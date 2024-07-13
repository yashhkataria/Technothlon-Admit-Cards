const express = require('express');
const cors = require('cors');
const connectDB = require('./connectDB');
const dotenv = require('dotenv');
const router = require('./routes');

dotenv.config();

const app = express();

const corsOptions = {
  origin: '*',
  credentials: true
}

app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

app.use(cors(corsOptions));
app.use(express.json());

connectDB();

// app.get('/', (req, res) => {
//   res.send('Admit card hello!');
// });

app.use('/api', router);

const PORT = process.env.PORT || 4500;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});