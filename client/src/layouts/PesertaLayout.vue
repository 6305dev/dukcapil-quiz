<template>
  <div class="min-h-dvh bg-[#FFFDF7] text-[#111111]">
    <!-- Top Bar -->
    <header
      v-if="!isQuizPlay"
      class="sticky top-0 z-30 border-b-2 border-[#111111] bg-[#FFFDF7]"
    >
      <div class="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <router-link to="/peserta/dashboard" class="flex items-center gap-2.5">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-[#111111] bg-[#FFD84D] shadow-[2px_2px_0px_#111111]"
          >
            <ShieldCheck class="h-4 w-4 text-[#111111]" :stroke-width="2.5" />
          </div>
          <span class="text-[15px] font-bold tracking-tight">Dukcapil Quiz</span>
        </router-link>

        <button
          type="button"
          @click="handleLogout"
          title="Keluar"
          class="nb-btn flex h-9 w-9 items-center justify-center bg-white text-[#111111] hover:bg-[#FF6B6B]"
        >
          <LogOut class="h-4 w-4" :stroke-width="2.4" />
        </button>
      </div>
    </header>

    <!-- Main Mobile Viewport -->
    <main
      class="mx-auto max-w-lg px-4"
      :class="isQuizPlay ? 'pt-3 pb-28' : 'pt-5 pb-10'"
    >
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ShieldCheck, LogOut } from 'lucide-vue-next';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const isQuizPlay = computed(() => route.name === 'peserta-quiz-play');

function handleLogout() {
  if (!window.confirm('Keluar dari akun ini?')) return;
  auth.logout();
  router.push('/login');
}
</script>
