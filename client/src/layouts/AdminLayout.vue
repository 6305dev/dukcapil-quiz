<template>
  <div class="flex min-h-screen bg-slate-50">
    <!-- Mobile backdrop -->
    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
      @click="sidebarOpen = false"
    />

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-200 transition-transform duration-200 lg:static lg:translate-x-0"
      :class="sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex items-center justify-between border-b border-slate-800 px-5 py-4">
        <router-link to="/admin/dashboard" class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck class="h-5 w-5" />
          </div>
          <div>
            <span class="block text-sm font-extrabold text-white">Dukcapil Quiz</span>
            <span class="block text-[11px] text-slate-400">Admin Panel</span>
          </div>
        </router-link>
        <button @click="sidebarOpen = false" class="rounded-lg p-1 text-slate-400 hover:text-white lg:hidden">
          <X class="h-5 w-5" />
        </button>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          @click="sidebarOpen = false"
          class="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition"
          :class="
            route.path === item.to
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
          "
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          {{ item.label }}
        </router-link>
      </nav>

      <div class="border-t border-slate-800 p-4">
        <div class="mb-3 rounded-xl bg-slate-800/70 px-3 py-2.5">
          <p class="truncate text-xs font-semibold text-white">{{ auth.user?.nama }}</p>
          <p class="font-mono text-[11px] text-slate-400">{{ auth.user?.nik }}</p>
        </div>
        <button
          type="button"
          @click="handleLogout"
          class="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut class="h-4 w-4" />
          Keluar
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6 lg:hidden">
        <button
          type="button"
          @click="sidebarOpen = true"
          class="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
        >
          <Menu class="h-5 w-5" />
        </button>
        <span class="text-sm font-bold text-slate-900">Admin Panel — Dukcapil Quiz</span>
        <div class="w-9" />
      </header>

      <main class="flex-1 p-4 sm:p-6 lg:p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  ClipboardList,
  HelpCircle,
  FileBarChart2,
  Trophy,
  LogOut,
  Menu,
  X
} from 'lucide-vue-next';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Kelola Peserta', icon: Users },
  { to: '/admin/quizzes', label: 'Kelola Quiz', icon: ClipboardList },
  { to: '/admin/questions', label: 'Kelola Soal', icon: HelpCircle },
  { to: '/admin/scores', label: 'Skor Peserta', icon: FileBarChart2 },
  { to: '/admin/ranking', label: 'Ranking Global', icon: Trophy }
];

function handleLogout() {
  auth.logout();
  router.push('/login');
}
</script>
