<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-900">Semua Skor Peserta</h1>
      <p class="mt-1 text-sm text-slate-500">Rekap seluruh attempt quiz beserta skor dan waktu pengerjaan.</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-col gap-3 sm:flex-row">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          @input="debouncedFetch"
          type="text"
          placeholder="Cari nama peserta, NIK, atau judul quiz..."
          class="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-10 text-sm outline-none focus:border-blue-500"
        />
      </div>
      <select
        v-model="selectedQuizId"
        @change="fetchScores"
        class="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
      >
        <option value="">Semua Quiz</option>
        <option v-for="q in quizzes" :key="q.id" :value="q.id">{{ q.judul }}</option>
      </select>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div v-if="loading" class="p-8 text-center text-sm text-slate-500">Memuat data skor...</div>
      <div v-else-if="scores.length === 0" class="p-8 text-center text-sm text-slate-500">
        Belum ada data skor ditemukan.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Peserta</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Quiz</th>
              <th class="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">Status</th>
              <th class="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">Skor</th>
              <th class="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">Durasi</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mulai</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="row in scores" :key="row.attempt_id" class="hover:bg-slate-50">
              <td class="whitespace-nowrap px-5 py-3.5">
                <p class="text-sm font-semibold text-slate-900">{{ row.user_nama }}</p>
                <p class="font-mono text-xs text-slate-400">{{ row.nik }}</p>
              </td>
              <td class="px-5 py-3.5 text-sm text-slate-700">{{ row.quiz_judul }}</td>
              <td class="whitespace-nowrap px-5 py-3.5 text-center">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="
                    row.status === 'finished'
                      ? 'bg-emerald-100 text-emerald-700'
                      : row.status === 'expired'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                  "
                >
                  {{ row.status }}
                </span>
              </td>
              <td class="whitespace-nowrap px-5 py-3.5 text-center text-sm font-extrabold text-slate-900">
                {{ row.score }}
              </td>
              <td class="whitespace-nowrap px-5 py-3.5 text-center font-mono text-xs text-slate-600">
                {{ formatDuration(row.durasi_pengerjaan) }}
              </td>
              <td class="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">
                {{ new Date(row.started_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { Search } from 'lucide-vue-next';

const scores = ref([]);
const quizzes = ref([]);
const selectedQuizId = ref('');
const search = ref('');
const loading = ref(true);

let timer = null;
function debouncedFetch() {
  clearTimeout(timer);
  timer = setTimeout(fetchScores, 300);
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return '-';
  const s = Math.max(0, Number(seconds));
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}d`;
}

async function fetchScores() {
  loading.value = true;
  try {
    const params = {};
    if (selectedQuizId.value) params.quiz_id = selectedQuizId.value;
    if (search.value.trim()) params.search = search.value.trim();
    const { data } = await api.get('/admin/scores', { params });
    scores.value = data.scores || [];
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  const { data } = await api.get('/admin/quizzes');
  quizzes.value = data.quizzes || [];
  await fetchScores();
});
</script>
