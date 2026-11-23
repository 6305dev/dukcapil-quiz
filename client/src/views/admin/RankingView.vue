<template>
  <div class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Ranking Global Peserta</h1>
        <p class="mt-1 text-sm text-slate-500">
          Kriteria peringkat: Skor Tertinggi &rarr; Waktu Tercepat &rarr; Attempt Terbaru.
        </p>
      </div>

      <select
        v-model="selectedQuizId"
        @change="fetchRanking"
        class="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
      >
        <option value="">Semua Quiz (Global)</option>
        <option v-for="q in quizzes" :key="q.id" :value="q.id">{{ q.judul }}</option>
      </select>
    </div>

    <RankingTable :items="ranking" :loading="loading" :mask-nik="false" :show-whatsapp="true" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import RankingTable from '@/components/RankingTable.vue';

const ranking = ref([]);
const quizzes = ref([]);
const selectedQuizId = ref('');
const loading = ref(true);

async function fetchRanking() {
  loading.value = true;
  try {
    const params = selectedQuizId.value ? { quiz_id: selectedQuizId.value } : {};
    const { data } = await api.get('/admin/ranking', { params });
    ranking.value = data.ranking || [];
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  const { data } = await api.get('/admin/quizzes');
  quizzes.value = data.quizzes || [];
  await fetchRanking();
});
</script>
