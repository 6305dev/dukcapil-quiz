<template>
  <div class="inline-flex shrink-0 items-center gap-1.5">
    <button
      type="button"
      @click="toggleMute"
      :title="muted ? 'Nyalakan suara' : 'Matikan suara'"
      class="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#111111] bg-white text-[#111111] shadow-[2px_2px_0px_#111111] transition active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
    >
      <VolumeX v-if="muted" class="h-3.5 w-3.5" :stroke-width="2.5" />
      <Volume2 v-else class="h-3.5 w-3.5" :stroke-width="2.5" />
    </button>

    <div
      class="inline-flex shrink-0 items-center gap-1.5 rounded-xl border-2 border-[#111111] px-3 py-1 font-mono text-xs font-bold text-[#111111] shadow-[2px_2px_0px_#111111]"
      :class="timerClass"
    >
      <Clock class="h-3.5 w-3.5" :stroke-width="2.5" :class="{ 'animate-pulse': remaining <= 5 }" />
      <span>{{ formattedTime }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { Clock, Volume2, VolumeX } from 'lucide-vue-next';
import { playTickSound, playTimeoutSound, unlockAudio } from '@/utils/sound';

const props = defineProps({
  initialSeconds: {
    type: Number,
    required: true
  },
  paused: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['expired', 'tick']);

const remaining = ref(Math.max(0, Math.floor(props.initialSeconds)));
const muted = ref(localStorage.getItem('quiz_muted') === '1');
let intervalId = null;
let hasEmittedExpired = false;

function toggleMute() {
  muted.value = !muted.value;
  localStorage.setItem('quiz_muted', muted.value ? '1' : '0');
  if (!muted.value) {
    unlockAudio();
    playTickSound(false);
  }
}

watch(
  () => props.initialSeconds,
  (val) => {
    remaining.value = Math.max(0, Math.floor(val));
    hasEmittedExpired = false;
  }
);

const formattedTime = computed(() => {
  const mins = Math.floor(remaining.value / 60);
  const secs = remaining.value % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

const timerClass = computed(() => {
  if (remaining.value <= 5) {
    return 'bg-[#FF6B6B]';
  }
  if (remaining.value <= 10) {
    return 'bg-[#FFD84D]';
  }
  return 'bg-white';
});

function startTimer() {
  stopTimer();
  intervalId = setInterval(() => {
    if (props.paused) return;
    if (remaining.value > 0) {
      remaining.value -= 1;
      emit('tick', remaining.value);
      if (!muted.value && remaining.value > 0) {
        playTickSound(remaining.value <= 5);
      }
    }
    if (remaining.value <= 0 && !hasEmittedExpired) {
      hasEmittedExpired = true;
      stopTimer();
      if (!muted.value) {
        playTimeoutSound();
      }
      emit('expired');
    }
  }, 1000);
}

function stopTimer() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function handleFirstInteraction() {
  if (!muted.value) unlockAudio();
}

onMounted(() => {
  window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
  if (!muted.value) unlockAudio();

  if (remaining.value <= 0) {
    hasEmittedExpired = true;
    emit('expired');
  } else {
    startTimer();
  }
});

onUnmounted(() => {
  window.removeEventListener('pointerdown', handleFirstInteraction);
  stopTimer();
});
</script>
