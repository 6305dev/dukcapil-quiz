const express = require('express');
const router = express.Router();
const doorprizeController = require('../controllers/doorprizeController');

router.get('/prizes', doorprizeController.getPublicPrizes);
router.post('/prizes/:id/claim', doorprizeController.claimPrize);

module.exports = router;
