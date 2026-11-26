<template>
  <div class="relative min-h-dvh overflow-x-hidden bg-[#FFFDF7] text-[#111111]">
    <!-- Confetti Overlay Canvas -->
    <canvas
      ref="confettiCanvas"
      class="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />

    <!-- Decorative Background Pattern -->
    <div
      class="pointer-events-none fixed inset-0 opacity-35"
      style="background-image: radial-gradient(#111111 1.25px, transparent 1.25px); background-size: 24px 24px;"
    />

    <!-- Top Navigation Bar -->
    <header class="relative z-20 border-b-2 border-[#111111] bg-[#FFFDF7]/95 backdrop-blur-xs">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#111111] bg-[#FFD84D] shadow-[3px_3px_0px_#111111]"
          >
            <Gift class="h-5 w-5 text-[#111111]" :stroke-width="2.5" />
          </div>
          <div class="min-w-0">
            <h1 class="truncate text-base font-extrabold leading-tight tracking-tight sm:text-lg">
              Undian Doorprize Dukcapil
            </h1>
            <p class="truncate text-[11px] font-semibold text-neutral-500">Spinning Wheel Berhadiah</p>
          </div>
        </div>

        <!-- Event Logos (Desktop Header) -->
        <div
          class="hidden items-center gap-3 rounded-xl border-2 border-[#111111] bg-white px-3.5 py-1.5 shadow-[3px_3px_0px_#111111] md:flex"
        >
          <img
            :src="hut61Logo"
            alt="Logo HUT ke-61 Kabupaten Tapin"
            class="h-9 w-auto object-contain select-none"
          />
          <span class="h-7 w-0.5 rounded-full bg-[#111111]/20" />
          <img
            :src="tapinMajuLogo"
            alt="Logo Maju Banuanya Baiman Warganya"
            class="h-9 w-auto object-contain select-none"
          />
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <!-- Mute Toggle -->
          <button
            type="button"
            @click="toggleMute"
            :title="isMuted ? 'Nyalakan Suara' : 'Matikan Suara'"
            class="nb-btn flex h-10 w-10 items-center justify-center bg-white text-[#111111] hover:bg-[#FFFBEB]"
          >
            <VolumeX v-if="isMuted" class="h-4 w-4 text-red-600" :stroke-width="2.5" />
            <Volume2 v-else class="h-4 w-4" :stroke-width="2.5" />
          </button>

          <!-- Refresh Prizes -->
          <button
            type="button"
            :disabled="isSpinning || loading"
            @click="fetchPrizes"
            title="Muat Ulang Hadiah"
            class="nb-btn flex h-10 w-10 items-center justify-center bg-white text-[#111111] hover:bg-[#FFFBEB] disabled:opacity-50"
          >
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" :stroke-width="2.5" />
          </button>

          <!-- Back / Admin Link -->
          <router-link
            v-if="auth.isAdmin"
            to="/admin/doorprize"
            class="nb-btn inline-flex h-10 items-center gap-1.5 bg-[#93C5FD] px-3.5 text-xs font-bold text-[#111111] hover:bg-[#7DD3FC]"
          >
            <Settings class="h-4 w-4" :stroke-width="2.4" />
            <span class="hidden sm:inline">Atur Hadiah</span>
          </router-link>
          <router-link
            v-else
            :to="backPath"
            class="nb-btn inline-flex h-10 items-center gap-1.5 bg-white px-3.5 text-xs font-bold text-[#111111] hover:bg-[#FFFBEB]"
          >
            <ArrowLeft class="h-4 w-4" :stroke-width="2.4" />
            <span>Kembali</span>
          </router-link>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <!-- Event Logos Banner (Mobile / Tablet) -->
      <div
        class="nb-card-sm mx-auto mb-6 flex max-w-md items-center justify-center gap-4 bg-white px-4 py-2.5 md:hidden"
      >
        <img
          :src="hut61Logo"
          alt="Logo HUT ke-61 Kabupaten Tapin"
          class="h-11 w-auto object-contain select-none sm:h-12"
        />
        <span class="h-8 w-0.5 shrink-0 rounded-full bg-[#111111]/20" />
        <img
          :src="tapinMajuLogo"
          alt="Logo Maju Banuanya Baiman Warganya"
          class="h-11 w-auto object-contain select-none sm:h-12"
        />
      </div>

      <div v-if="loading && prizes.length === 0" class="nb-card mx-auto max-w-md p-10 text-center">
        <p class="text-sm font-bold text-neutral-600">Memuat roda undian...</p>
      </div>

      <div v-else-if="prizes.length === 0" class="nb-card mx-auto max-w-md p-8 text-center">
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#111111] bg-[#FFD84D] shadow-[3px_3px_0px_#111111]"
        >
          <Gift class="h-7 w-7 text-[#111111]" :stroke-width="2.5" />
        </div>
        <h2 class="mt-4 text-lg font-extrabold">Belum Ada Hadiah Aktif</h2>
        <p class="mt-1.5 text-xs font-medium text-neutral-600">
          Silakan tambahkan atau aktifkan daftar hadiah melalui menu Kelola Doorprize di Dashboard Admin.
        </p>
        <router-link
          v-if="auth.isAdmin"
          to="/admin/doorprize"
          class="nb-btn mt-5 inline-flex items-center gap-2 bg-[#FFD84D] px-5 py-2.5 text-xs font-bold text-[#111111]"
        >
          Atur Hadiah Sekarang
        </router-link>
      </div>

      <div v-else class="grid items-center gap-8 lg:grid-cols-12">
        <!-- Left / Center: Spinning Wheel Stage -->
        <div class="flex flex-col items-center lg:col-span-7">
          <div class="relative flex items-center justify-center p-3 sm:p-5">
            <!-- Top Flapper / Pointer -->
            <div
              class="pointer-events-none absolute -top-1 left-1/2 z-30 -translate-x-1/2 origin-top transition-transform duration-75"
              :style="{ transform: `translateX(-50%) rotate(${pointerKickAngle}deg)` }"
            >
              <svg width="56" height="64" viewBox="0 0 56 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <filter id="pointerShadow" x="0" y="0" width="56" height="64" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="2" dy="3" stdDeviation="0" flood-color="#111111" />
                </filter>
                <g filter="url(#pointerShadow)">
                  <path
                    d="M28 58L8 16C5.5 10.8 9.3 5 15 5H41C46.7 5 50.5 10.8 48 16L28 58Z"
                    fill="#FF3B3B"
                    stroke="#111111"
                    stroke-width="3.5"
                    stroke-linejoin="round"
                  />
                  <circle cx="28" cy="17" r="6" fill="#FFD84D" stroke="#111111" stroke-width="3" />
                </g>
              </svg>
            </div>

            <!-- Outer Wheel Casing with Decorative Bulbs -->
            <div
              class="relative rounded-full border-4 border-[#111111] bg-[#1E293B] p-3.5 shadow-[8px_8px_0px_#111111] sm:p-4"
            >
              <!-- Rim Lights -->
              <span
                v-for="bulb in 16"
                :key="bulb"
                class="pointer-events-none absolute h-2.5 w-2.5 rounded-full border border-[#111111] transition-colors duration-200 sm:h-3 sm:w-3"
                :class="getBulbClass(bulb)"
                :style="getBulbPositionStyle(bulb, 16)"
              />

              <!-- Wheel Canvas -->
              <div class="relative h-[300px] w-[300px] sm:h-[420px] sm:w-[420px]">
                <canvas
                  ref="wheelCanvas"
                  class="h-full w-full cursor-pointer rounded-full select-none"
                  @click="spinWheel"
                />

                <!-- Center Hub Spin Button -->
                <button
                  type="button"
                  :disabled="isSpinning || prizes.length < 1"
                  @click="spinWheel"
                  class="absolute top-1/2 left-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-4 border-[#111111] bg-[#FFD84D] text-[#111111] shadow-[0_4px_0_#111111] transition active:scale-95 disabled:cursor-not-allowed sm:h-24 sm:w-24"
                  :class="isSpinning ? 'bg-[#FDE68A]' : 'hover:scale-105 hover:bg-[#FCCE2D]'"
                >
                  <Sparkles v-if="!isSpinning" class="h-5 w-5 sm:h-6 sm:w-6" :stroke-width="2.5" />
                  <span class="mt-0.5 text-xs font-black uppercase tracking-wider sm:text-sm">
                    {{ isSpinning ? '...' : 'PUTAR' }}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Big Spin CTA Button -->
          <div class="mt-5 flex w-full max-w-sm flex-col items-center gap-2.5">
            <button
              type="button"
              :disabled="isSpinning || prizes.length < 1"
              @click="spinWheel"
              class="nb-btn flex h-14 w-full items-center justify-center gap-2.5 bg-[#FFD84D] text-base font-extrabold uppercase tracking-wide text-[#111111] hover:bg-[#FCCE2D] disabled:opacity-60"
            >
              <Dices class="h-5 w-5" :class="{ 'animate-spin': isSpinning }" :stroke-width="2.5" />
              {{ isSpinning ? 'Memutar Undian...' : 'Putar Sekarang!' }}
            </button>
            <p class="text-center text-xs font-semibold text-neutral-500">
              Klik tombol <strong>Putar Sekarang</strong> atau tekan bagian tengah roda
            </p>
          </div>
        </div>

        <!-- Right Column: Available Prizes & History -->
        <div class="space-y-5 lg:col-span-5">
          <!-- Daftar Hadiah di Roda -->
          <div class="nb-card p-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <Gift class="h-5 w-5 text-[#111111]" :stroke-width="2.5" />
                <h2 class="text-base font-extrabold">Daftar Hadiah ({{ prizes.length }})</h2>
              </div>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="showStock = !showStock"
                  class="nb-btn inline-flex h-8 items-center gap-1.5 px-2.5 text-xs font-bold text-[#111111]"
                  :class="showStock ? 'bg-[#FFD84D] hover:bg-[#FCCE2D]' : 'bg-white hover:bg-[#FFFBEB]'"
                >
                  <EyeOff v-if="showStock" class="h-3.5 w-3.5" :stroke-width="2.4" />
                  <Eye v-else class="h-3.5 w-3.5" :stroke-width="2.4" />
                  {{ showStock ? 'Sembunyikan Stok' : 'Lihat Stok' }}
                </button>
                <label
                  v-if="auth.isAdmin"
                  class="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-neutral-700 select-none"
                  title="Jika dicentang, stok hadiah terbatas akan otomatis berkurang 1 saat terpilih"
                >
                  <input
                    v-model="autoDeductStock"
                    type="checkbox"
                    class="h-4 w-4 rounded border-2 border-[#111111] accent-[#111111]"
                  />
                  Kurangi stok otomatis
                </label>
              </div>
            </div>

            <div class="mt-4 max-h-64 space-y-2 overflow-y-auto pr-1">
              <div
                v-for="p in prizes"
                :key="p.id"
                class="flex items-center justify-between gap-3 rounded-xl border-2 border-[#111111] px-3 py-2 transition"
                :class="
                  highlightedSegmentId === p.id
                    ? 'scale-[1.01] bg-[#FFFBEB] shadow-[2px_2px_0px_#111111]'
                    : 'bg-white'
                "
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  <span
                    class="h-4 w-4 shrink-0 rounded border-2 border-[#111111]"
                    :style="{ backgroundColor: p.warna }"
                  />
                  <span class="truncate text-xs font-bold sm:text-sm">{{ p.nama }}</span>
                </div>
                <span
                  v-if="showStock"
                  class="shrink-0 rounded-md border border-[#111111] bg-[#FFFDF7] px-2 py-0.5 text-[11px] font-bold"
                >
                  {{ p.stok !== null ? `Sisa ${p.stok}` : 'Tak Terbatas' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Riwayat Pemenang Sesi Ini -->
          <div class="nb-card p-5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Trophy class="h-5 w-5 text-[#111111]" :stroke-width="2.5" />
                <h2 class="text-base font-extrabold">Riwayat Putaran</h2>
              </div>
              <button
                v-if="spinHistory.length > 0"
                type="button"
                @click="spinHistory = []"
                class="text-xs font-bold text-neutral-500 underline hover:text-[#111111]"
              >
                Bersihkan
              </button>
            </div>

            <div v-if="spinHistory.length === 0" class="mt-4 rounded-xl bg-neutral-100 p-4 text-center text-xs font-semibold text-neutral-500">
              Belum ada putaran pada sesi ini.
            </div>
            <div v-else class="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
              <div
                v-for="(item, idx) in spinHistory"
                :key="item.timestamp + '-' + idx"
                class="flex items-center justify-between rounded-xl border-2 border-[#111111] bg-[#FFFDF7] px-3 py-2"
              >
                <div class="flex min-w-0 items-center gap-2.5">
                  <span
                    class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#111111] text-[11px] font-extrabold"
                    :style="{ backgroundColor: item.warna }"
                  >
                    {{ spinHistory.length - idx }}
                  </span>
                  <span class="truncate text-xs font-bold sm:text-sm">{{ item.nama }}</span>
                </div>
                <span class="shrink-0 font-mono text-[11px] font-semibold text-neutral-500">{{ item.timeLabel }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Winner Celebration Modal -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition duration-250 ease-out"
        enter-from-class="opacity-0 scale-90"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="winnerModalOpen && selectedPrize"
          class="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          @click.self="closeWinnerModal"
        >
          <div
            class="nb-card relative w-full max-w-md overflow-hidden bg-[#FFFDF7] p-6 text-center shadow-[8px_8px_0px_#111111] sm:p-8"
          >
            <div
              class="mx-auto flex h-20 w-20 animate-bounce items-center justify-center rounded-2xl border-3 border-[#111111] shadow-[4px_4px_0px_#111111]"
              :style="{ backgroundColor: selectedPrize.warna || '#FFD84D' }"
            >
              <PartyPopper class="h-10 w-10 text-[#111111]" :stroke-width="2.4" />
            </div>

            <p class="mt-4 text-xs font-extrabold uppercase tracking-widest text-neutral-500">
              Selamat! Hadiah Terpilih
            </p>

            <div
              class="mt-3 rounded-2xl border-2 border-[#111111] px-4 py-5 shadow-[4px_4px_0px_#111111]"
              :style="{ backgroundColor: selectedPrize.warna || '#FFD84D' }"
            >
              <h2 class="text-2xl font-black leading-tight tracking-tight text-[#111111] sm:text-3xl">
                {{ selectedPrize.nama }}
              </h2>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                @click="closeWinnerModal"
                class="nb-btn flex h-12 items-center justify-center bg-white text-sm font-extrabold text-[#111111] hover:bg-neutral-100"
              >
                Tutup
              </button>
              <button
                type="button"
                @click="spinAgainFromModal"
                class="nb-btn flex h-12 items-center justify-center gap-1.5 bg-[#FFD84D] text-sm font-extrabold text-[#111111] hover:bg-[#FCCE2D]"
              >
                <Dices class="h-4 w-4" :stroke-width="2.5" />
                Putar Lagi
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { unlockAudio, playWheelPegTick, playDoorprizeTrumpet } from '@/utils/sound';
import hut61Logo from '@/assets/HUT61.png';
import tapinMajuLogo from '@/assets/TAPINMAJU.png';
import {
  Gift,
  Sparkles,
  Dices,
  Trophy,
  PartyPopper,
  Volume2,
  VolumeX,
  RefreshCw,
  Settings,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-vue-next';

const auth = useAuthStore();

const prizes = ref([]);
const loading = ref(true);
const isSpinning = ref(false);
const isMuted = ref(localStorage.getItem('doorprize_muted') === '1');
const autoDeductStock = ref(true);
const showStock = ref(false);

const wheelCanvas = ref(null);
const confettiCanvas = ref(null);

const currentRotation = ref(0); // in radians, 0 means angle 0 is at 3 o'clock; pointer is at -PI/2 (12 o'clock)
const pointerKickAngle = ref(0);
const bulbPhase = ref(0);

const selectedPrize = ref(null);
const winnerModalOpen = ref(false);
const spinHistory = ref([]);
const highlightedSegmentId = ref(null);

let spinRafId = null;
let confettiRafId = null;
let bulbIntervalId = null;
let pointerKickTimeout = null;

const backPath = computed(() => {
  if (!auth.isAuthenticated) return '/login';
  return auth.isAdmin ? '/admin/dashboard' : '/peserta/dashboard';
});

function toggleMute() {
  isMuted.value = !isMuted.value;
  localStorage.setItem('doorprize_muted', isMuted.value ? '1' : '0');
  if (!isMuted.value) unlockAudio();
}

function getBulbPositionStyle(index, total) {
  const angle = ((index - 1) / total) * Math.PI * 2 - Math.PI / 2;
  const radiusPercent = 48.2;
  const x = 50 + Math.cos(angle) * radiusPercent;
  const y = 50 + Math.sin(angle) * radiusPercent;
  return {
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)'
  };
}

function getBulbClass(index) {
  const active = (index + bulbPhase.value) % 2 === 0;
  if (isSpinning.value || winnerModalOpen.value) {
    return active ? 'bg-[#FFD84D] shadow-[0_0_8px_#FFD84D]' : 'bg-white';
  }
  return index % 2 === 0 ? 'bg-[#FFD84D]' : 'bg-[#FFFDF7]';
}

function getSegmentIndexAtPointer(rotationRad, count) {
  if (count <= 0) return -1;
  const arc = (Math.PI * 2) / count;
  // Pointer berada di atas (-PI / 2)
  const pointerAngle = -Math.PI / 2;
  let normalized = (pointerAngle - rotationRad) % (Math.PI * 2);
  if (normalized < 0) normalized += Math.PI * 2;
  return Math.floor(normalized / arc) % count;
}

function truncateLabel(text, maxLen = 20) {
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
}

function drawWheel() {
  const canvas = wheelCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const rect = canvas.getBoundingClientRect();
  const size = Math.max(rect.width, 280);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  if (canvas.width !== Math.round(size * dpr) || canvas.height !== Math.round(size * dpr)) {
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 6;
  const items = prizes.value;
  const count = items.length;

  if (count === 0) {
    ctx.restore();
    return;
  }

  const arc = (Math.PI * 2) / count;

  // Draw slices
  for (let i = 0; i < count; i++) {
    const startAngle = currentRotation.value + i * arc;
    const endAngle = startAngle + arc;
    const item = items[i];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();

    ctx.fillStyle = item.warna || '#FFD84D';
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#111111';
    ctx.stroke();

    // Draw label along radius
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arc / 2);

    const fontSize = count > 12 ? Math.max(10, size * 0.028) : count > 8 ? Math.max(11, size * 0.032) : Math.max(12, size * 0.036);
    ctx.font = `800 ${fontSize}px "Space Grotesk", system-ui, sans-serif`;
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const maxTextWidth = radius * 0.58;
    let label = truncateLabel(item.nama, count > 10 ? 16 : 22);
    while (label.length > 4 && ctx.measureText(label).width > maxTextWidth) {
      label = `${label.slice(0, -2)}…`;
    }

    ctx.fillText(label, radius - 20, 0);
    ctx.restore();
  }

  // Outer crisp border ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#111111';
  ctx.stroke();

  // Peg pins on segment boundaries
  for (let i = 0; i < count; i++) {
    const pegAngle = currentRotation.value + i * arc;
    const px = cx + Math.cos(pegAngle) * (radius - 6);
    const py = cy + Math.sin(pegAngle) * (radius - 6);

    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#111111';
    ctx.stroke();
  }

  ctx.restore();
}

function triggerPointerKick(speedRatio) {
  pointerKickAngle.value = -14 - speedRatio * 14;
  if (pointerKickTimeout) clearTimeout(pointerKickTimeout);
  pointerKickTimeout = setTimeout(() => {
    pointerKickAngle.value = 0;
  }, 65);
}

async function fetchPrizes() {
  loading.value = true;
  try {
    const { data } = await api.get('/doorprize/prizes');
    prizes.value = data.prizes || [];
    await nextTick();
    drawWheel();
  } catch (err) {
    console.error('Gagal mengambil hadiah doorprize:', err);
  } finally {
    loading.value = false;
  }
}

function spinWheel() {
  if (isSpinning.value || prizes.value.length === 0) return;

  unlockAudio();
  winnerModalOpen.value = false;
  isSpinning.value = true;

  const count = prizes.value.length;
  const arc = (Math.PI * 2) / count;

  // Pilih pemenang secara acak merata menggunakan crypto bila tersedia
  let winningIndex = Math.floor(Math.random() * count);
  if (window.crypto && window.crypto.getRandomValues) {
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    winningIndex = arr[0] % count;
  }

  // Posisi acak di dalam segmen pemenang (hindari tepat di garis batas 15%..85%)
  const innerOffset = (0.18 + Math.random() * 0.64) * arc;
  const targetNormalized = winningIndex * arc + innerOffset;

  // Kita ingin (-PI/2 - finalRotation) mod 2PI === targetNormalized
  // => finalRotation = -PI/2 - targetNormalized + k * 2PI
  const baseTargetRotation = -Math.PI / 2 - targetNormalized;
  const extraFullSpins = 7 + Math.floor(Math.random() * 4); // 7 s/d 10 putaran penuh
  const current = currentRotation.value;
  const minTarget = current + extraFullSpins * Math.PI * 2;
  const k = Math.ceil((minTarget - baseTargetRotation) / (Math.PI * 2));
  const finalRotation = baseTargetRotation + k * Math.PI * 2;

  const startRotation = current;
  const totalDelta = finalRotation - startRotation;
  const durationMs = 5400 + Math.random() * 800; // ~5.4 - 6.2 detik dramatis
  const startTime = performance.now();

  let lastSegmentIdx = getSegmentIndexAtPointer(startRotation, count);

  // Quintic ease-out untuk deselerasi roda yang realistis dan menegangkan di akhir
  const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

  const animate = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / durationMs, 1);
    const eased = easeOutQuint(progress);

    currentRotation.value = startRotation + totalDelta * eased;
    drawWheel();

    const activeIdx = getSegmentIndexAtPointer(currentRotation.value, count);
    if (activeIdx >= 0 && prizes.value[activeIdx]) {
      highlightedSegmentId.value = prizes.value[activeIdx].id;
    }

    if (activeIdx !== lastSegmentIdx) {
      const speedRatio = Math.max(0, 1 - progress);
      playWheelPegTick(speedRatio, isMuted.value);
      triggerPointerKick(speedRatio);
      lastSegmentIdx = activeIdx;
    }

    if (progress < 1) {
      spinRafId = requestAnimationFrame(animate);
    } else {
      spinRafId = null;
      finishSpin(winningIndex);
    }
  };

  spinRafId = requestAnimationFrame(animate);
}

async function finishSpin(winningIndex) {
  isSpinning.value = false;
  pointerKickAngle.value = 0;

  const won = prizes.value[winningIndex];
  if (!won) return;

  selectedPrize.value = { ...won };
  highlightedSegmentId.value = won.id;
  winnerModalOpen.value = true;

  // Mainkan terompet & confetti meriah!
  playDoorprizeTrumpet(isMuted.value);
  launchConfetti();

  spinHistory.value.unshift({
    id: won.id,
    nama: won.nama,
    warna: won.warna,
    timestamp: Date.now(),
    timeLabel: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  });

  // Jika stok terbatas & autoDeductStock aktif, kurangi stok di server
  if (autoDeductStock.value && won.stok !== null) {
    try {
      const { data } = await api.post(`/doorprize/prizes/${won.id}/claim`);
      if (data.prize) {
        // Perbarui daftar hadiah untuk putaran berikutnya
        const { data: refreshed } = await api.get('/doorprize/prizes');
        prizes.value = refreshed.prizes || [];
        await nextTick();
        drawWheel();
      }
    } catch (err) {
      console.warn('Gagal memperbarui stok hadiah:', err);
    }
  }
}

function closeWinnerModal() {
  winnerModalOpen.value = false;
}

function spinAgainFromModal() {
  winnerModalOpen.value = false;
  if (prizes.value.length > 0) {
    setTimeout(() => spinWheel(), 120);
  }
}

// ==================== CONFETTI BURST ====================
const CONFETTI_COLORS = ['#FFD84D', '#A3F7BF', '#FF6B6B', '#93C5FD', '#C4B5FD', '#FF9F68', '#67E8F9'];

function launchConfetti() {
  const canvas = confettiCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (confettiRafId) cancelAnimationFrame(confettiRafId);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  const particles = [];
  const spawnBurst = (originX, originY, count, spreadAngle, baseAngle, minSpeed = 8, maxSpeed = 19) => {
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.random() - 0.5) * spreadAngle;
      const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        w: 8 + Math.random() * 7,
        h: 6 + Math.random() * 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.28,
        tilt: Math.random() * Math.PI,
        tiltSpeed: 0.08 + Math.random() * 0.12,
        alpha: 1
      });
    }
  };

  // Meriam confetti kiri, kanan, dan tengah atas
  spawnBurst(width * 0.1, height * 0.78, 55, 0.95, -Math.PI / 3);
  spawnBurst(width * 0.9, height * 0.78, 55, 0.95, (-2 * Math.PI) / 3);
  spawnBurst(width * 0.5, height * 0.28, 60, Math.PI * 1.6, -Math.PI / 2, 6, 15);

  const render = () => {
    ctx.clearRect(0, 0, width, height);
    let alive = 0;

    for (const p of particles) {
      p.vy += 0.3;
      p.vx *= 0.986;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotSpeed;
      p.tilt += p.tiltSpeed;

      if (p.y > height * 0.86) {
        p.alpha = Math.max(0, p.alpha - 0.028);
      }
      if (p.alpha <= 0 || p.y > height + 50) continue;

      alive++;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(1, Math.cos(p.tilt));
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1.4;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }

    if (alive > 0) {
      confettiRafId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, width, height);
      confettiRafId = null;
    }
  };

  confettiRafId = requestAnimationFrame(render);
}

function handleResize() {
  drawWheel();
}

watch(
  () => prizes.value.length,
  async () => {
    await nextTick();
    drawWheel();
  }
);

onMounted(async () => {
  await fetchPrizes();
  window.addEventListener('resize', handleResize);
  bulbIntervalId = setInterval(() => {
    bulbPhase.value = (bulbPhase.value + 1) % 2;
  }, 280);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (spinRafId) cancelAnimationFrame(spinRafId);
  if (confettiRafId) cancelAnimationFrame(confettiRafId);
  if (bulbIntervalId) clearInterval(bulbIntervalId);
  if (pointerKickTimeout) clearTimeout(pointerKickTimeout);
});
</script>
