import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

import AuthLayout from '@/layouts/AuthLayout.vue';
import PesertaLayout from '@/layouts/PesertaLayout.vue';
import AdminLayout from '@/layouts/AdminLayout.vue';

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/doorprize',
    name: 'doorprize',
    component: () => import('@/views/DoorprizeView.vue')
  },
  {
    path: '/',
    component: AuthLayout,
    meta: { guestOnly: true },
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/auth/LoginView.vue')
      },
      {
        path: 'register',
        redirect: '/login'
      }
    ]
  },
  {
    path: '/peserta',
    component: PesertaLayout,
    meta: { requiresAuth: true, role: 'peserta' },
    children: [
      {
        path: '',
        redirect: '/peserta/dashboard'
      },
      {
        path: 'dashboard',
        name: 'peserta-dashboard',
        component: () => import('@/views/peserta/DashboardView.vue')
      },
      {
        path: 'quizzes',
        redirect: '/peserta/dashboard'
      },
      {
        path: 'quiz/:attemptId',
        name: 'peserta-quiz-play',
        component: () => import('@/views/peserta/QuizPlayView.vue')
      },
      {
        path: 'result/:attemptId',
        name: 'peserta-result',
        component: () => import('@/views/peserta/ResultView.vue')
      },
      {
        path: 'ranking',
        redirect: '/peserta/dashboard'
      }
    ]
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: '',
        redirect: '/admin/dashboard'
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('@/views/admin/DashboardView.vue')
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('@/views/admin/UserManageView.vue')
      },
      {
        path: 'quizzes',
        name: 'admin-quizzes',
        component: () => import('@/views/admin/QuizManageView.vue')
      },
      {
        path: 'questions',
        name: 'admin-questions',
        component: () => import('@/views/admin/QuestionManageView.vue')
      },
      {
        path: 'scores',
        name: 'admin-scores',
        component: () => import('@/views/admin/ScoreView.vue')
      },
      {
        path: 'ranking',
        name: 'admin-ranking',
        component: () => import('@/views/admin/RankingView.vue')
      },
      {
        path: 'doorprize',
        name: 'admin-doorprize',
        component: () => import('@/views/admin/DoorprizeManageView.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/login'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Jika ada token tapi user belum dimuat, fetch /auth/me
  if (auth.token && !auth.user) {
    await auth.fetchMe();
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return auth.isAdmin ? '/admin/dashboard' : '/peserta/dashboard';
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login';
  }

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return auth.isAdmin ? '/admin/dashboard' : '/peserta/dashboard';
  }

  return true;
});

export default router;
