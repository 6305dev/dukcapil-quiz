<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold tracking-tight text-[#111111]">Kuis</h1>

    <div v-if="loading" class="nb-card-sm p-6 text-center text-xs font-medium text-neutral-500">
      Memuat...
    </div>

    <div v-else-if="quizStore.activeQuizzes.length === 0" class="nb-card-sm p-8 text-center">
      <ClipboardList class="mx-auto mb-2 h-7 w-7 text-neutral-400" />
      <p class="text-xs font-bold text-neutral-500">Belum ada kuis</p>
    </div>

    <div v-else class="space-y-3.5">
      <div
        v-for="quiz in quizStore.activeQuizzes"
        :key="quiz.id"
        class="nb-card p-4"
      >
        <h2 class="text-[15px] font-bold leading-snug text-[#111111]">{{ quiz.judul }}</h2>

        <div class="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
          <span class="inline-flex items-center gap-1 rounded-lg border-2 border-[#111111] bg-[#E0F2FE] px-2 py-0.5">
            <HelpCircle class="h-3.5 w-3.5" />
            {{ quiz.jumlah_soal }} soal
          </span>
          <span class="inline-flex items-center gap-1 rounded-lg border-2 border-[#111111] bg-[#F3E8FF] px-2 py-0.5">
            <Clock class="h-3.5 w-3.5" />
            15 dtk/soal
          </span>
          <span
            v-if="quiz.latest_attempt?.status === 'in_progress'"
            class="rounded-lg border-2 border-[#111111] bg-[#FFD84D] px-2 py-0.5"
          >
            Berlangsung
          </span>
          <span
            v-else-if="quiz.latest_attempt"
            class="rounded-lg border-2 border-[#111111] bg-[#A3F7BF] px-2 py-0.5"
          >
            Skor {{ quiz.latest_attempt.score }}
          </span>
        </div>

        <button
          type="button"
          :disabled="startingId === quiz.id || Number(quiz.total_bank_soal) === 0"
          @click="handleStart(quiz.id)"
          class="nb-btn mt-4 flex h-11 w-full items-center justify-center gap-1.5 bg-[#FFD84D] text-sm font-bold text-[#111111] hover:bg-[#FCCE2D] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Play class="h-4 w-4" :stroke-width="2.5" />
          {{
            startingId === quiz.id
              ? '...'
              : quiz.latest_attempt?.status === 'in_progress'
                ? 'Lanjut'
                : 'Mulai'
          }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuizStore } from '@/stores/quiz';
import { ClipboardList, HelpCircle, Clock, Play } from 'lucide-vue-next';

const quizStore = useQuizStore();
const router = useRouter();
const loading = ref(true);
const startingId = ref(null);

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s > 0 ? `${m} menit ${s} detik` : `${m} menit`;
}

async function handleStart(quizId) {
  startingId.value = quizId;
  try {
    const data = await quizStore.startQuiz(quizId);
    router.push(`/peserta/quiz/${data.attempt_id}`);
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal memulai quiz.');
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
