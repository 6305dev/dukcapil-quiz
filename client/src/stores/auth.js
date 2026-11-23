import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('quiz_token') || '');
  const user = ref(
    (() => {
      try {
        const saved = localStorage.getItem('quiz_user');
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    })()
  );
  const loading = ref(false);

  const isAuthenticated = computed(() => Boolean(token.value));
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isPeserta = computed(() => user.value?.role === 'peserta');

  function setAuth(newToken, newUser) {
    token.value = newToken;
    user.value = newUser;
    localStorage.setItem('quiz_token', newToken);
    localStorage.setItem('quiz_user', JSON.stringify(newUser));
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('quiz_token');
    localStorage.removeItem('quiz_user');
  }

  async function login(payload) {
    loading.value = true;
    try {
      const { data } = await api.post('/auth/login', payload);
      setAuth(data.token, data.user);
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function register(payload) {
    loading.value = true;
    try {
      const { data } = await api.post('/auth/register', payload);
      setAuth(data.token, data.user);
      return data;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMe() {
    if (!token.value) return null;
    try {
      const { data } = await api.get('/auth/me');
      user.value = data.user;
      localStorage.setItem('quiz_user', JSON.stringify(data.user));
      return data.user;
    } catch {
      logout();
      return null;
    }
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isPeserta,
    login,
    register,
    fetchMe,
    logout
  };
});
