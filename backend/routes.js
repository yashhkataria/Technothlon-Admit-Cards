const express = require('express');
const router = express.Router();

const { createAdmitCard, getAdmitCard } = require('./controllers');

router.get('/', (req, res) => {
    res.send('Admit card api hello!');
})
router.post('/create-admit-card', createAdmitCard);
router.get('/get-admit-card', getAdmitCard);

module.exports = router;