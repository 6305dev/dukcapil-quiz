<template>
  <div class="flex min-h-[calc(100dvh-9rem)] flex-col justify-center space-y-5">
    <!-- Nama Peserta -->
    <div>
      <p class="text-xs font-bold uppercase tracking-wider text-neutral-500">Peserta</p>
      <h1 class="mt-0.5 text-2xl font-bold tracking-tight text-[#111111]">
        {{ auth.user?.nama }}
      </h1>
    </div>

    <div v-if="loading" class="nb-card p-6 text-center text-xs font-bold text-neutral-500">
      Memuat...
    </div>

    <div v-else-if="quizStore.activeQuizzes.length === 0" class="nb-card p-8 text-center">
      <p class="text-sm font-bold text-[#111111]">Belum ada kuis</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="quiz in quizStore.activeQuizzes"
        :key="quiz.id"
        class="nb-card p-5"
      >
        <div class="flex items-start justify-between gap-2">
          <h2 class="text-lg font-bold leading-snug text-[#111111]">{{ quiz.judul }}</h2>
          <span
            v-if="isCompleted(quiz)"
            class="inline-flex shrink-0 items-center gap-1 rounded-lg border-2 border-[#111111] bg-[#A3F7BF] px-2.5 py-0.5 text-[11px] font-bold text-[#111111]"
          >
            <CheckCircle2 class="h-3.5 w-3.5" :stroke-width="2.5" />
            Sudah Menjawab
          </span>
        </div>

        <div class="mt-3 flex flex-wrap gap-2 text-xs font-bold">
          <span class="rounded-lg border-2 border-[#111111] bg-[#E0F2FE] px-2.5 py-0.5">
            {{ quiz.jumlah_soal }} soal
          </span>
          <span class="rounded-lg border-2 border-[#111111] bg-[#F3E8FF] px-2.5 py-0.5">
            15 dtk/soal
          </span>
        </div>

        <button
          type="button"
          :disabled="startingId === quiz.id || Number(quiz.total_bank_soal) === 0"
          @click="handleStartQuiz(quiz.id)"
          class="nb-btn mt-5 flex h-13 w-full items-center justify-center gap-2 text-base font-bold text-[#111111] disabled:opacity-50"
          :class="isCompleted(quiz) ? 'bg-white hover:bg-[#FFFBEB]' : 'bg-[#FFD84D] hover:bg-[#FCCE2D]'"
        >
          <RotateCcw v-if="isCompleted(quiz)" class="h-5 w-5" :stroke-width="2.5" />
          <Play v-else class="h-5 w-5" :stroke-width="2.5" />
          {{
            startingId === quiz.id
              ? '...'
              : quiz.latest_attempt?.status === 'in_progress'
                ? 'Lanjut Kuis'
                : isCompleted(quiz)
                  ? 'Ulangi Kuis'
                  : 'Mulai Kuis'
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useQuizStore } from '@/stores/quiz';
import { Play, RotateCcw, CheckCircle2 } from 'lucide-vue-next';

const auth = useAuthStore();
const quizStore = useQuizStore();
const router = useRouter();

const loading = ref(true);
const startingId = ref(null);

function isCompleted(quiz) {
  return Boolean(quiz.latest_attempt && quiz.latest_attempt.status !== 'in_progress');
}

async function handleStartQuiz(quizId) {
  startingId.value = quizId;
  try {
    const data = await quizStore.startQuiz(quizId);
    router.push(`/peserta/quiz/${data.attempt_id}`);
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal memulai kuis.');
  } finally {
    startingId.value = null;
  }
}

onMounted(async () => {
  try {
    await quizStore.fetchActiveQuizzes();
  } finally {
    loading.value = false;
  }
});
</script>
