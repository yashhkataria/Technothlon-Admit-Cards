const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csvtojson');
const cors = require('cors');
const UploadOffTeam = require('../models/offTeaminfo');
const { v4: uuidv4 } = require('uuid'); 
const bcrypt = require('bcrypt'); 
const cityToID = require('../utils/cityToID.json');
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const dotenv = require("dotenv");
const pdf = require('html-pdf');
const fs = require('fs');
const csvParser = require('csv-parser');

const pdfLib = require('pdf-lib');
const bodyParser = require('body-parser');
const pdfTemplate = require('./document.js');
const path = require('path');
const Teams = require('../models/teamModel.js');
const centreInfo = require('../models/centres');
router.use(cookieParser());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());
dotenv.config();

const allowedOrigins = [
    'http://localhost:3000', // Local development URL
    'https://technothlon.techniche.org.in' // Production URL
];

const corsOptions = {
    origin: (origin, callback) => {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};

router.use(cors(corsOptions));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});
const upload = multer({ storage: storage });
router.post('/login', async (req, res) => {
  const { roll, password } = req.body;
  
  try {
      let user = null;

     
      user = await Teams.findOne({ rollNumber: roll });
      
    
      if (!user) {
          user = await UploadOffTeam.findOne({ roll });
      }

      if (!user) {
          return res.status(401).json({ message: "Invalid credentials" });
      }

      const User = (user.roll || user.rollNumber);

      if(user.password !== password) {
          return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ roll: User }, process.env.KEY, { expiresIn: '7h' });
      res.cookie('token', token, { maxAge: 3600000 });
      return res.json({ status: true, message: "Login successful" });

  } catch (err) {
      res.status(500).json({ message: "Internal server error" });
  }
});



const verifyToken = (req, res, next) => {
const token = req.cookies.token;

if (!token) {
  return res.status(401).json({ message: "Unauthorized: No token provided" });
}

jwt.verify(token, process.env.KEY, (err, decoded) => {
  if (err) {
    console.error("Error verifying token:", err);
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
  req.roll = decoded.roll;
  next();
});
};


router.get('/user', verifyToken, async (req, res) => {
const { roll } = req;

try {
  let user =null;
  user= await Teams.findOne({ rollNumber: roll });

  if (!user) {
    user = await UploadOffTeam.findOne({ roll });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user });
} catch (err) {
  console.error("Error fetching user:", err);
  return res.status(500).json({ message: "Internal server error" });
}
});

router.get('/logout', (req, res) => {
res.clearCookie('token');
return res.json({ status: true });
});



// router.post('/change-password', verifyToken, async (req, res) => {
// const { oldPassword, newPassword } = req.body;
// const { roll } = req;

// try {
//   let user = await Teams.findOne({ rollNumber: roll });
//   let isTeamUser = true;

//   if (!user) {
//     user = await UploadOffTeam.findOne({ roll });
//     isTeamUser = false;
//   }

//   if (!user) {
//     return res.status(404).json({ message: "User not found" });
//   }

//   // Ensure the new password is unique
//   if (oldPassword === newPassword) {
//     return res.status(400).json({ message: "New password must be different from the old password" });
//   }

//   if (isTeamUser) {
//     const pass = user.password;

    
//     const isMatch = await bcrypt.compare(oldPassword, pass);

//     if (!isMatch) {
//       return res.status(401).json({ message: "Incorrect old password" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(newPassword, salt);
//     user.password = newPassword;
//   } else {
//     // Direct comparison for UploadOffTeam model
//     if (oldPassword !== user.password) {
//       return res.status(401).json({ message: "Incorrect old password" });
//     }

//     user.password = newPassword;
//   }

//   await user.save();

//   res.status(200).json({ message: "Password changed successfully" });
// } catch (error) {
//   console.error('Error changing password:', error);
//   res.status(500).json({ message: "Internal server error" });
// }
// });

router.post('/change-password', verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const { roll } = req;

  try {
    let user = await Teams.findOne({ rollNumber: roll });

    if (!user) {
      user = await UploadOffTeam.findOne({ roll });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure the new password is unique
    if (oldPassword === newPassword) {
      return res.status(400).json({ message: "New password must be different from the old password" });
    }

    // Direct comparison for both models
    if (oldPassword !== user.password) {
      return res.status(401).json({ message: "Incorrect old password" });
    }

    user.password = newPassword;

    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post('/update-details', verifyToken, async (req, res) => {
const { email1, contact1, email2, contact2 } = req.body;
const { roll } = req;

try {
  let user = await Teams.findOne({ rollNumber: roll });

  if (!user) {
    user = await UploadOffTeam.findOne({ roll });
  }

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.email1 = email1;
  user.contact1 = contact1;
  user.email2 = email2;
  user.contact2 = contact2;

  await user.save();

  res.status(200).json({ message: "Details updated successfully" });
} catch (error) {
  console.error('Error updating details:', error);
  res.status(500).json({ message: "Internal server error" });
}
});



router.post('/create-pdf', async (req, res) => {
  const { roll,rollNumber } = req.body; 
 const Roll=(roll||rollNumber);
  try {
    // Fetch the data from the Centres model based on the provided roll
    const centreData = await centreInfo.findOne({ rollno: Roll }); // Find the document with the matching rollno
    
    if (!centreData) {
      return res.status(404).send({ success: false, message: 'No data found for the provided roll' });
    }

    // Extract name1, name2, rollno, and centre from the fetched data
    const { name1, name2, rollno, centre } = centreData;

    const filePath = path.join(__dirname, 'result.pdf');
    pdf.create(pdfTemplate({ name1, name2, roll: rollno, centre }), {}).toFile(filePath, async (err) => {
      if (err) {
        console.error('Error creating PDF:', err); // Log error
        return res.status(500).send({ success: false, message: 'Error creating PDF' });
      }

      console.log('PDF created successfully');

      // Resize the PDF
      try {
        const existingPdfBytes = fs.readFileSync(filePath);
        const pdfDoc = await pdfLib.PDFDocument.load(existingPdfBytes);
        const pages = pdfDoc.getPages();
        pages.forEach(page => {
          page.scale(1, 1); // Resize to 50% of original size
        });
        
        const resizedPdfBytes = await pdfDoc.save();
        fs.writeFileSync(filePath, resizedPdfBytes);

        res.send({ success: true, message: 'PDF created and resized successfully' });
      } catch (resizeErr) {
        console.error('Error resizing PDF:', resizeErr); // Log error
        return res.status(500).send({ success: false, message: 'Error resizing PDF' });
      }
    });
  } catch (err) {
    console.error('Error fetching centre data:', err); // Log error
    res.status(500).send({ success: false, message: 'Error fetching centre data' });
  }
});


// GET route for fetching the PDF
router.get('/fetch-pdf', (req, res) => {
const filePath = path.join(__dirname, 'result.pdf');
res.sendFile(filePath, (err) => {
    if (err) {
        console.error('Error fetching PDF:', err); // Log error
        res.status(500).send(err);
    }
});
});




router.route("/uploadcsv").post(upload.single("file"), async (req, res) => {
  try {
    const jsonArray = await csv().fromFile(req.file.path);
    const { school, studentcount } = req.body;
    console.log(school);
    const dataWithCredentials = await Promise.all(jsonArray.map(async (entry, index) => {
      const { squad, language, city} = entry; // Extract squad, language, cityid, and studentcount from the entry
      
      if (index < studentcount) {
        const roll = generateRollNumber(squad, language, city, index);
        const password = generatePassword();

        // Send email to email1 and email2
        await new Promise(resolve => setTimeout(resolve, 1000 * index)); // One-second delay
        await Promise.all([
          sendEmail(entry.email1,entry.name1,entry.name2, roll, password),
          sendEmail(entry.email2,entry.name1,entry.name2, roll, password)
        ]);
        
        

        // Return the entry with roll number, password, and other data
        return {
          roll,
          password,
          school,
          ...entry
        };
      } else {
        return;
      }
    }));
    
    const result = await UploadOffTeam.insertMany(dataWithCredentials);
    res.json("Added successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json("Error inserting data to MongoDb " + error);
  }
});
let studentCount=1;
function generateRollNumber(squad, language, city, studentcount) {
    const medium = (language === "EN") ? "0" : "1";
    const squadCode = (squad === "HE") ? "HE" : "JR";
    const mode = "F";
    const cityID = cityToID[city];
    const paddedStudentCount = String(studentCount +40).padStart(5, '0');
    studentCount++;
    const rollNumber = `${squadCode}${mode}${medium}${cityID}${paddedStudentCount}`;
    return rollNumber;
}

function generatePassword() {
    return uuidv4();
}

router.route("/upload-final").post(upload.single("file"), async (req, res) => {
  if (!req.file) {
      return res.status(400).json("No file uploaded");
  }

  const rollnumbers = [];
  const filePath = req.file.path;

  // Check if the file exists
  if (!fs.existsSync(filePath)) {
      return res.status(400).json("File not found");
  }

  fs.createReadStream(filePath)
  .on('error', (error) => {
      res.status(500).json("Error reading file " + error);
  })
  .pipe(csvParser())
  .on('data', (data) => {
      if (data.roll) {
          rollnumbers.push(data.roll);
      }
  })
  .on('end', async () => {
      if (rollnumbers.length === 0) {
          return res.status(400).json("No valid roll numbers found in the uploaded file");
      }
      try {
          await Teams.updateMany(
              { rollNumber: { $in: rollnumbers } },
              { $set: { isPaid: true, isVerified: true } }
          );

          // Fetch the updated team details
          const teams = await Teams.find({ rollNumber: { $in: rollnumbers } });

          // Create the email transporter
          const transporter = nodemailer.createTransport({
              service: 'gmail',
              host: 'smtp.gmail.com',
              auth: {
                user: 'technothlon@technicheiitg.in',
                pass: 'fjowuvpqbbtjrvsa'
              },
          });

          for (const team of teams) {
              const mailOptions1 = {
                  from: '"Technothlon" <technothlon@technicheiitg.in>',
                  to: `${team.email1}`,
                  subject: 'Important update regarding Technothlon 2024',
                  html: `
                  <p>Hey champs!</p>
<p>Greetings from Technothlon!</p>
<p>We're excited to inform you that your details have been updated. Below are your credentials to access the Technothlon portal:</p>
<ul>
    <li><strong>Roll Number:</strong> ${team.rollNumber}</li>
    <li><strong>Password:</strong> ${team.password}</li>
</ul>
<p>For security reasons, we strongly recommend changing your password upon first login. The preliminary round is scheduled for July 14th, 2024. Admit cards will be available shortly before the event.</p>
<p>Should you have any questions or encounter any issues, please don't hesitate to reach out to us. We're here to help!</p>
<p>Best regards,<br>Technothlon IITG</p>
              `
              };

              await transporter.sendMail(mailOptions1);

              const mailOptions2 = {
                from: '"Technothlon" <technothlon@technicheiitg.in>',
                  to: `${team.email2}`,
                  subject: 'Important update regarding Technothlon 2024',
                  html: `
                  <p>Hey champs!</p>
<p>Greetings from Technothlon!</p>
<p>We're excited to inform you that your details have been updated. Below are your credentials to access the Technothlon portal:</p>
<ul>
    <li><strong>Roll Number:</strong> ${team.rollNumber}</li>
    <li><strong>Password:</strong> ${team.password}</li>
</ul>
<p>For security reasons, we strongly recommend changing your password upon first login. The preliminary round is scheduled for July 14th, 2024. Admit cards will be available shortly before the event.</p>
<p>Should you have any questions or encounter any issues, please don't hesitate to reach out to us. We're here to help!</p>
<p>Best regards,<br>Technothlon IITG</p>
              `
            };

            await transporter.sendMail(mailOptions2);
          }

          res.send("Updated successfully and emails sent");
      } catch (error) {
          res.status(500).json("Error inserting data to MongoDb or sending emails " + error);
      } finally {
          fs.unlinkSync(filePath);
      }
  });
});

async function sendEmail(email, name1, name2, roll, password) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'technothlon@technicheiitg.in',
                pass: 'fjowuvpqbbtjrvsa'
            },
        });

        await transporter.sendMail({
            from: '"Technothlon" <technothlon@technicheiitg.in>',
            to: email,
            subject: 'New Technothlon 2024 Roll Number and Password',
            html: `<p>Team Technothlon is delighted to inform you that you have successfully registered for Technothlon'24!</p>
                   <p>Please note your Roll No. and Password:</p>
                   <p>Participant 1: ${name1}</p>
                   <p>Participant 2: ${name2}</p>
                   <p><strong>Roll No.:</strong> ${roll}</p>
                   <p><strong>Password:</strong> ${password}</p>
                   <p>The date for prelims is 14th July 2024.</p>
                   <p>For receiving   further communications and updates, please join/follow:</p>
                   <ul>
                       <li><a href="https://whatsapp.com/channel/0029VaM9jc072WTqZJIaKL1S">Whatsapp</a></li>
                       <li><a href="https://www.instagram.com/technothlon.iitg?igsh=MWU1NmU3ZG8zcnFpbg==">Instagram</a></li>
                       <li><a href="http://technothlon.techniche.org.in">Website</a></li>
                   </ul>
                   <p>With regards,<br>Team Technothlon</p>`
        });

        console.log("Mail sent");
    } catch (error) {
        console.error("Error sending email:", error);
    }
}
module.exports = router;
