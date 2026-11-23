<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-extrabold text-slate-900">Dashboard Admin</h1>
      <p class="mt-1 text-sm text-slate-500">Ringkasan statistik peserta, quiz, dan performa evaluasi.</p>
    </div>

    <!-- KPI Cards -->
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total Peserta"
        :value="stats.total_peserta"
        subtext="Peserta terdaftar"
        :icon="Users"
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
      />
      <StatCard
        label="Total Quiz"
        :value="stats.total_quiz"
        :subtext="`${stats.active_quiz} quiz aktif`"
        :icon="ClipboardList"
        iconBg="bg-indigo-50"
        iconColor="text-indigo-600"
      />
      <StatCard
        label="Total Attempt"
        :value="stats.total_attempt"
        subtext="Total pengerjaan quiz"
        :icon="Activity"
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
      />
      <StatCard
        label="Rata-rata Skor"
        :value="stats.avg_score"
        subtext="Dari seluruh attempt selesai"
        :icon="Award"
        iconBg="bg-emerald-50"
        iconColor="text-emerald-600"
      />
    </div>

    <!-- Recent Attempts -->
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 class="text-base font-bold text-slate-900">Aktivitas Pengerjaan Terbaru</h2>
        <router-link to="/admin/scores" class="text-xs font-semibold text-blue-600 hover:underline">
          Lihat Semua Skor &rarr;
        </router-link>
      </div>

      <div v-if="loading" class="p-8 text-center text-sm text-slate-500">Memuat data...</div>
      <div v-else-if="recentAttempts.length === 0" class="p-8 text-center text-sm text-slate-500">
        Belum ada aktivitas pengerjaan quiz.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Peserta</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Quiz</th>
              <th class="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">Status</th>
              <th class="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">Skor</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Waktu</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="att in recentAttempts" :key="att.id" class="hover:bg-slate-50">
              <td class="px-5 py-3.5">
                <p class="text-sm font-semibold text-slate-900">{{ att.user_nama }}</p>
                <p class="font-mono text-xs text-slate-400">{{ att.nik }}</p>
              </td>
              <td class="px-5 py-3.5 text-sm text-slate-700">{{ att.quiz_judul }}</td>
              <td class="px-5 py-3.5 text-center">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="
                    att.status === 'finished'
                      ? 'bg-emerald-100 text-emerald-700'
                      : att.status === 'expired'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                  "
                >
                  {{ att.status }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-center text-sm font-bold text-slate-900">{{ att.score }}</td>
              <td class="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500">
                {{ new Date(att.started_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/api';
import StatCard from '@/components/StatCard.vue';
import { Users, ClipboardList, Activity, Award } from 'lucide-vue-next';

const loading = ref(true);
const stats = reactive({
  total_peserta: 0,
  total_quiz: 0,
  active_quiz: 0,
  total_attempt: 0,
  avg_score: 0
});
const recentAttempts = ref([]);

onMounted(async () => {
  try {
    const { data } = await api.get('/admin/dashboard');
    Object.assign(stats, data.stats);
    recentAttempts.value = data.recent_attempts || [];
  } finally {
    loading.value = false;
  }
});
</script>
