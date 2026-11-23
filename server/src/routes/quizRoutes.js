const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const attemptController = require('../controllers/attemptController');
const authenticate = require('../middleware/auth');

router.get('/quizzes/active', authenticate, quizController.getActiveQuizzes);
router.get('/attempts/me', authenticate, quizController.getMyAttempts);
router.post('/quiz/:id/start', authenticate, attemptController.startAttempt);
router.get('/ranking', authenticate, quizController.getRanking);

module.exports = router;
