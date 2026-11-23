<template>
  <div :class="compact ? 'nb-card overflow-hidden' : 'overflow-hidden rounded-2xl border border-slate-200/70 bg-white'">
    <div v-if="loading" class="p-8 text-center text-xs font-bold text-neutral-500">Memuat...</div>
    <div v-else-if="items.length === 0" class="p-8 text-center">
      <Trophy class="mx-auto mb-2 h-7 w-7 text-neutral-400" />
      <p class="text-xs font-bold text-neutral-500">Belum ada data</p>
    </div>

    <!-- Neo-Brutalism Native Mobile List (compact mode) -->
    <div v-else-if="compact" class="divide-y-2 divide-[#111111]">
      <div
        v-for="row in items"
        :key="row.user_id"
        class="flex items-center gap-3 px-4 py-3.5"
        :class="highlightUserId && Number(row.user_id) === Number(highlightUserId) ? 'bg-[#FFFBEB]' : 'bg-white'"
      >
        <span
          class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-[#111111] text-xs font-bold"
          :class="compactRankClass(row.rank)"
        >
          {{ row.rank }}
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <span class="truncate text-sm font-bold text-[#111111]">{{ row.nama }}</span>
            <span
              v-if="highlightUserId && Number(row.user_id) === Number(highlightUserId)"
              class="shrink-0 rounded-md border border-[#111111] bg-[#FFD84D] px-1.5 py-0.5 text-[10px] font-bold text-[#111111]"
            >
              Anda
            </span>
          </div>
          <p class="mt-0.5 font-mono text-[11px] font-medium text-neutral-500">
            {{ formatDuration(row.waktu_tercepat) }}
          </p>
        </div>

        <span
          class="shrink-0 rounded-lg border-2 border-[#111111] px-2.5 py-0.5 text-sm font-bold text-[#111111]"
          :class="
            row.skor_tertinggi >= 80
              ? 'bg-[#A3F7BF]'
              : row.skor_tertinggi >= 60
                ? 'bg-[#93C5FD]'
                : 'bg-[#FF6B6B]'
          "
        >
          {{ row.skor_tertinggi }}
        </span>
      </div>
    </div>

    <!-- Desktop Table (default for admin) -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Peringkat
            </th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              Peserta
            </th>
            <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              NIK
            </th>
            <th class="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              Skor Tertinggi
            </th>
            <th class="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              Waktu Tercepat
            </th>
            <th
              v-if="showAttempts"
              class="px-5 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
            >
              Attempt
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          <tr
            v-for="row in items"
            :key="row.user_id"
            :class="highlightUserId && Number(row.user_id) === Number(highlightUserId) ? 'bg-blue-50/60' : 'hover:bg-slate-50'"
          >
            <td class="whitespace-nowrap px-5 py-4">
              <span
                class="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                :class="rankBadgeClass(row.rank)"
              >
                {{ row.rank }}
              </span>
            </td>
            <td class="whitespace-nowrap px-5 py-4">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-slate-900">{{ row.nama }}</span>
                <span
                  v-if="highlightUserId && Number(row.user_id) === Number(highlightUserId)"
                  class="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700"
                >
                  Anda
                </span>
              </div>
              <div v-if="showWhatsapp && row.no_whatsapp" class="text-xs text-slate-400">
                {{ row.no_whatsapp }}
              </div>
            </td>
            <td class="whitespace-nowrap px-5 py-4 font-mono text-sm text-slate-600">
              {{ maskNik ? maskNikValue(row.nik) : row.nik }}
            </td>
            <td class="whitespace-nowrap px-5 py-4 text-center">
              <span
                class="inline-flex rounded-full px-3 py-1 text-sm font-bold"
                :class="
                  row.skor_tertinggi >= 80
                    ? 'bg-emerald-100 text-emerald-700'
                    : row.skor_tertinggi >= 60
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                "
              >
                {{ row.skor_tertinggi }}
              </span>
            </td>
            <td class="whitespace-nowrap px-5 py-4 text-center font-mono text-sm text-slate-600">
              {{ formatDuration(row.waktu_tercepat) }}
            </td>
            <td v-if="showAttempts" class="whitespace-nowrap px-5 py-4 text-center text-sm text-slate-600">
              {{ row.total_attempt }}x
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { Trophy } from 'lucide-vue-next';

defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  highlightUserId: { type: [Number, String], default: null },
  maskNik: { type: Boolean, default: false },
  showWhatsapp: { type: Boolean, default: false },
  showAttempts: { type: Boolean, default: true },
  compact: { type: Boolean, default: false }
});

function rankBadgeClass(rank) {
  if (rank === 1) return 'bg-amber-400 text-amber-950 shadow-sm';
  if (rank === 2) return 'bg-slate-300 text-slate-800';
  if (rank === 3) return 'bg-orange-300 text-orange-950';
  return 'bg-slate-100 text-slate-600';
}

function compactRankClass(rank) {
  if (rank === 1) return 'bg-[#FFD84D] text-[#111111]';
  if (rank === 2) return 'bg-[#E5E7EB] text-[#111111]';
  if (rank === 3) return 'bg-[#FDBA74] text-[#111111]';
  return 'bg-white text-[#111111]';
}

function maskNikValue(nik) {
  if (!nik || nik.length < 10) return nik;
  return `${nik.slice(0, 6)}******${nik.slice(-4)}`;
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '-';
  const s = Math.max(0, Number(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${String(rem).padStart(2, '0')}d`;
}
</script>
