const express = require('express');
const router = express.Router();

const { createAdmitCard, getAdmitCard } = require('./controllers');

router.post('/create-admit-card', createAdmitCard);
router.get('/get-admit-card', getAdmitCard);
router.get('/', (req, res) => {
    res.send('Admit card api hello!');
})

module.exports = router;