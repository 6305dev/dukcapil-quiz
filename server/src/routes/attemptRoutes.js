const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const authenticate = require('../middleware/auth');

router.get('/:id', authenticate, attemptController.getAttempt);
router.post('/:id/answer', authenticate, attemptController.saveAnswer);
router.post('/:id/submit', authenticate, attemptController.submitAttempt);
router.get('/:id/result', authenticate, attemptController.getAttemptResult);

module.exports = router;
