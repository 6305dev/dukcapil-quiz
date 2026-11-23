const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

router.use(authenticate, isAdmin);

router.get('/dashboard', adminController.getDashboard);

// Users CRUD
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Quizzes CRUD
router.get('/quizzes', adminController.getQuizzes);
router.post('/quizzes', adminController.createQuiz);
router.put('/quizzes/:id', adminController.updateQuiz);
router.delete('/quizzes/:id', adminController.deleteQuiz);

// Questions CRUD
router.get('/questions', adminController.getQuestions);
router.post('/questions', adminController.createQuestion);
router.put('/questions/:id', adminController.updateQuestion);
router.delete('/questions/:id', adminController.deleteQuestion);

// Scores & Ranking
router.get('/scores', adminController.getScores);
router.get('/ranking', adminController.getAdminRanking);

module.exports = router;
