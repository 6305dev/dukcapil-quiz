<template>
  <div class="relative flex min-h-[calc(100dvh-9rem)] flex-col justify-center">
    <canvas
      ref="confettiCanvas"
      class="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />

    <div v-if="loading" class="nb-card p-8 text-center text-xs font-bold text-neutral-500">
      Memuat...
    </div>

    <div v-else-if="errorMsg" class="nb-card bg-[#FF6B6B] p-6 text-center">
      <p class="text-sm font-bold text-[#111111]">{{ errorMsg }}</p>
      <router-link
        to="/peserta/dashboard"
        class="nb-btn mt-4 inline-block bg-white px-5 py-2.5 text-xs font-bold text-[#111111]"
      >
        Kembali
      </router-link>
    </div>

    <div v-else class="nb-card p-7 text-center">
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#111111] bg-[#A3F7BF] shadow-[3px_3px_0px_#111111]"
      >
        <CheckCircle2 class="h-9 w-9 text-[#111111]" :stroke-width="2.5" />
      </div>

      <h1 class="mt-5 text-2xl font-bold tracking-tight text-[#111111]">Selamat!</h1>
      <p class="mt-2 text-sm font-medium text-neutral-600">
        Anda telah menyelesaikan kuis.
      </p>

      <router-link
        to="/peserta/dashboard"
        class="nb-btn mt-7 flex h-12 w-full items-center justify-center bg-[#FFD84D] text-sm font-bold text-[#111111] hover:bg-[#FCCE2D]"
      >
        Selesai
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useQuizStore } from '@/stores/quiz';
import { playTrumpetFanfare } from '@/utils/sound';
import { CheckCircle2 } from 'lucide-vue-next';

const route = useRoute();
const quizStore = useQuizStore();

const loading = ref(true);
const errorMsg = ref('');
const confettiCanvas = ref(null);
let rafId = null;

const CONFETTI_COLORS = ['#FFD84D', '#A3F7BF', '#FF6B6B', '#93C5FD', '#C4B5FD', '#FF9F68'];

function launchConfetti() {
  const canvas = confettiCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let width = window.innerWidth;
  let height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const particles = [];
  const spawnBurst = (originX, originY, count, spreadAngle, baseAngle) => {
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
      const speed = 7 + Math.random() * 11;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        w: 8 + Math.random() * 6,
        h: 6 + Math.random() * 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.25,
        tilt: Math.random() * Math.PI,
        tiltSpeed: 0.08 + Math.random() * 0.1,
        alpha: 1
      });
    }
  };

  // Dua ledakan dari sudut bawah kiri & kanan + tengah atas
  spawnBurst(width * 0.15, height * 0.72, 40, 0.9, -Math.PI / 3);
  spawnBurst(width * 0.85, height * 0.72, 40, 0.9, (-2 * Math.PI) / 3);
  spawnBurst(width * 0.5, height * 0.3, 35, Math.PI * 1.4, -Math.PI / 2);

  const render = () => {
    ctx.clearRect(0, 0, width, height);
    let alive = 0;

    for (const p of particles) {
      p.vy += 0.32; // gravity
      p.vx *= 0.985; // air drag
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.tilt += p.tiltSpeed;

      if (p.y > height * 0.85) {
        p.alpha = Math.max(0, p.alpha - 0.03);
      }
      if (p.alpha <= 0 || p.y > height + 40) continue;

      alive++;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(1, Math.cos(p.tilt));
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1.5;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (alive > 0) {
      rafId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, width, height);
      rafId = null;
    }
  };

  rafId = requestAnimationFrame(render);
}

onMounted(async () => {
  try {
    await quizStore.fetchResult(Number(route.params.attemptId));
    loading.value = false;
    launchConfetti();
    playTrumpetFanfare();
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Gagal memuat status kuis.';
    loading.value = false;
  }
});

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId);
});
</script>
