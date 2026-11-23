<template>
  <div class="space-y-4">
    <div v-if="loading" class="nb-card-sm p-8 text-center text-xs font-bold text-neutral-500">
      Memuat...
    </div>

    <div v-else-if="errorMsg" class="nb-card bg-[#FF6B6B] p-6 text-center">
      <p class="text-sm font-bold text-[#111111]">{{ errorMsg }}</p>
      <router-link
        to="/peserta/quizzes"
        class="nb-btn mt-4 inline-block bg-white px-4 py-2 text-xs font-bold text-[#111111]"
      >
        Kembali
      </router-link>
    </div>

    <template v-else-if="attempt && questions.length > 0">
      <!-- Sticky Top Bar -->
      <div class="sticky top-0 z-20 -mx-4 border-b-2 border-[#111111] bg-[#FFFDF7] px-4 pt-2 pb-3">
        <div class="flex items-center justify-between gap-3">
          <p class="font-mono text-sm font-bold text-[#111111]">
            {{ currentIndex + 1 }} / {{ questions.length }}
          </p>

          <TimerCountdown
            :key="currentIndex"
            :initial-seconds="QUESTION_DURATION"
            :paused="submitting"
            @expired="handleQuestionTimeout"
          />
        </div>

        <!-- Neo-Brutal Progress Bar -->
        <div class="mt-2.5 h-2.5 w-full overflow-hidden rounded-full border-2 border-[#111111] bg-white">
          <div
            class="h-full bg-[#A3F7BF] transition-all duration-200"
            :style="{ width: `${(answeredCount / questions.length) * 100}%` }"
          />
        </div>
      </div>

      <!-- Horizontal Scrollable Question Pills -->
      <div class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1">
        <button
          v-for="(q, idx) in questions"
          :key="q.question_id"
          type="button"
          @click="currentIndex = idx"
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#111111] text-xs font-bold transition active:translate-y-[1px]"
          :class="
            idx === currentIndex
              ? 'bg-[#FFD84D] text-[#111111] shadow-[2px_2px_0px_#111111]'
              : q.jawaban_dipilih
                ? 'bg-[#A3F7BF] text-[#111111]'
                : 'bg-white text-neutral-600'
          "
        >
          {{ idx + 1 }}
        </button>
      </div>

      <!-- Active Question Card -->
      <QuestionCard
        :question="currentQuestion"
        :index="currentIndex"
        :total="questions.length"
        :selected="currentQuestion.jawaban_dipilih"
        :saving="savingQuestionId === currentQuestion.question_id"
        :disabled="submitting"
        @select="handleSelectOption"
      />

      <!-- Quick submit if all answered -->
      <div v-if="answeredCount === questions.length && currentIndex < questions.length - 1" class="text-center">
        <button
          type="button"
          :disabled="submitting"
          @click="confirmSubmit"
          class="text-xs font-bold underline decoration-2 underline-offset-2"
        >
          Kirim sekarang
        </button>
      </div>

      <!-- Sticky Bottom Action Bar -->
      <div class="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t-2 border-[#111111] bg-white">
        <div class="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <button
            type="button"
            :disabled="currentIndex === 0 || submitting"
            @click="currentIndex--"
            class="nb-btn flex h-12 flex-1 items-center justify-center gap-1 bg-white text-sm font-bold text-[#111111] disabled:opacity-40"
          >
            <ChevronLeft class="h-4 w-4" :stroke-width="2.5" />
            Kembali
          </button>

          <button
            v-if="currentIndex < questions.length - 1"
            type="button"
            :disabled="submitting"
            @click="currentIndex++"
            class="nb-btn flex h-12 flex-[1.4] items-center justify-center gap-1 bg-[#FFD84D] text-sm font-bold text-[#111111] hover:bg-[#FCCE2D]"
          >
            Lanjut
            <ChevronRight class="h-4 w-4" :stroke-width="2.5" />
          </button>

          <button
            v-else
            type="button"
            :disabled="submitting"
            @click="confirmSubmit"
            class="nb-btn flex h-12 flex-[1.4] items-center justify-center gap-1.5 bg-[#A3F7BF] text-sm font-bold text-[#111111] hover:bg-[#86EFAC] disabled:opacity-60"
          >
            <Send class="h-4 w-4" :stroke-width="2.5" />
            {{ submitting ? '...' : 'Kirim' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuizStore } from '@/stores/quiz';
import TimerCountdown from '@/components/TimerCountdown.vue';
import QuestionCard from '@/components/QuestionCard.vue';
import { ChevronLeft, ChevronRight, Send } from 'lucide-vue-next';

const route = useRoute();
const router = useRouter();
const quizStore = useQuizStore();

const QUESTION_DURATION = 15;
const attemptId = Number(route.params.attemptId);
const loading = ref(true);
const errorMsg = ref('');
const currentIndex = ref(0);
const savingQuestionId = ref(null);
const submitting = ref(false);

const attempt = computed(() => quizStore.currentAttempt);
const questions = computed(() => quizStore.questions);
const currentQuestion = computed(() => questions.value[currentIndex.value]);
const answeredCount = computed(() => questions.value.filter((q) => Boolean(q.jawaban_dipilih)).length);

async function handleSelectOption(optionKey) {
  if (!currentQuestion.value || submitting.value) return;
  const qId = currentQuestion.value.question_id;
  savingQuestionId.value = qId;
  try {
    await quizStore.saveAnswer(attemptId, qId, optionKey);
  } catch (err) {
    if (err.response?.data?.expired) {
      router.replace(`/peserta/result/${attemptId}`);
      return;
    }
    alert(err.response?.data?.message || 'Gagal menyimpan jawaban.');
  } finally {
    savingQuestionId.value = null;
  }
}

async function doSubmit() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    await quizStore.submitAttempt(attemptId);
    router.replace(`/peserta/result/${attemptId}`);
  } catch (err) {
    // Jika server mengembalikan expired (400), tetap arahkan ke halaman hasil
    if (err.response?.data?.expired) {
      router.replace(`/peserta/result/${attemptId}`);
      return;
    }
    alert(err.response?.data?.message || 'Gagal mengirim quiz.');
    submitting.value = false;
  }
}

function confirmSubmit() {
  const unanswered = questions.value.length - answeredCount.value;
  const msg =
    unanswered > 0
      ? `Masih ada ${unanswered} soal yang belum dijawab (akan dianggap salah). Yakin ingin menyelesaikan quiz?`
      : 'Yakin ingin menyelesaikan dan mengirim seluruh jawaban Anda?';
  if (window.confirm(msg)) {
    doSubmit();
  }
}

function handleQuestionTimeout() {
  if (submitting.value) return;
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value += 1;
  } else {
    doSubmit();
  }
}

onMounted(async () => {
  try {
    const data = await quizStore.fetchAttempt(attemptId);
    if (data.attempt.status !== 'in_progress') {
      router.replace(`/peserta/result/${attemptId}`);
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Gagal memuat sesi quiz.';
  } finally {
    loading.value = false;
  }
});
</script>
