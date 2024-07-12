const express = require('express');
const router = express.Router();

const { getOnlineTeams, getOfflineTeams, getCentreInfo, createAdmitCard, getAdmitCard } = require('./controllers');

router.get('/online-teams', getOnlineTeams);
router.get('/offline-teams', getOfflineTeams);
router.get('/centre-info', getCentreInfo);
router.post('/create-admit-card', createAdmitCard);
router.get('/get-admit-card', getAdmitCard);

module.exports = router;