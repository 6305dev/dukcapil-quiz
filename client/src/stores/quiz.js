import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/services/api';

export const useQuizStore = defineStore('quiz', () => {
  const activeQuizzes = ref([]);
  const myAttempts = ref([]);
  const currentAttempt = ref(null);
  const questions = ref([]);
  const loading = ref(false);

  async function fetchActiveQuizzes() {
    loading.value = true;
    try {
      const { data } = await api.get('/quizzes/active');
      activeQuizzes.value = data.quizzes || [];
      return activeQuizzes.value;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMyAttempts() {
    const { data } = await api.get('/attempts/me');
    myAttempts.value = data.attempts || [];
    return myAttempts.value;
  }

  async function startQuiz(quizId) {
    const { data } = await api.post(`/quiz/${quizId}/start`);
    return data;
  }

  async function fetchAttempt(attemptId) {
    loading.value = true;
    try {
      const { data } = await api.get(`/attempt/${attemptId}`);
      currentAttempt.value = data.attempt;
      questions.value = data.questions || [];
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function saveAnswer(attemptId, questionId, jawabanDipilih) {
    const { data } = await api.post(`/attempt/${attemptId}/answer`, {
      question_id: questionId,
      jawaban_dipilih: jawabanDipilih
    });
    const idx = questions.value.findIndex((q) => q.question_id === questionId);
    if (idx !== -1) {
      questions.value[idx].jawaban_dipilih = jawabanDipilih;
    }
    return data;
  }

  async function submitAttempt(attemptId) {
    const { data } = await api.post(`/attempt/${attemptId}/submit`);
    return data;
  }

  async function fetchResult(attemptId) {
    const { data } = await api.get(`/attempt/${attemptId}/result`);
    return data;
  }

  return {
    activeQuizzes,
    myAttempts,
    currentAttempt,
    questions,
    loading,
    fetchActiveQuizzes,
    fetchMyAttempts,
    startQuiz,
    fetchAttempt,
    saveAnswer,
    submitAttempt,
    fetchResult
  };
});
