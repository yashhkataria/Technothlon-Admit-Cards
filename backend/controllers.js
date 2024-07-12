const { MongoClient } = require('mongodb');
const path = require('path');
const bodyParser = require('body-parser');
const pdfTemplate = require('./document.js');
const pdfLib = require('pdf-lib');
const pdf = require('html-pdf');
const fs = require('fs');

const createAdmitCard = async (req, res) => {
    try {
        const client = new MongoClient(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        await client.connect();
        const database = client.db('test');
        const centreInfo = database.collection('centreinfos');
        
        const { roll, rollNumber } = req.body;
        const Roll = roll || rollNumber;

        const centreData = await centreInfo.findOne({ rollno: Roll });

        if(!centreData)
            return res.status(404).send('No data found for this roll number');

        const { name1, name2, rollno, centre } = centreData;

        const filePath = path.join(__dirname, 'result.pdf');
        pdf.create(pdfTemplate({ name1, name2, roll: rollno, centre }), {}).toFile(filePath, async (err) => {
            if(err) {
                console.log('Error creating pdf');
                return res.status(500).send('Error creating pdf', err);
            }
            try {
                const existingPdfBytes = fs.readFileSync(filePath);
                const pdfDoc = await pdfLib.PDFDocument.load(existingPdfBytes);
                const pages = pdfDoc.getPages();
                pages.forEach((page) => {
                    page.scale(1,1);
                })

                const resizedPdfBytes = await pdfDoc.save();
                fs.writeFileSync(filePath, resizedPdfBytes);

                res.send({success: true, messsage: 'Pdf created successfully'});
            } catch (error) {
                console.log('Error resizing pdf');
                return res.status(500).send('Error resizing pdf');
            }
        });

    } catch (err) {
        console.error('MongoDB connection FAIL');
    }
}

const getAdmitCard = (req, res) => {
    const filePath = path.join(__dirname, 'result.pdf');
    res.sendFile(filePath, (err) => {
    if(err) {
        console.error('Error fetching PDF:', err);
        res.status(500).send(err);
    }
});
}


module.exports = { createAdmitCard, getAdmitCard };