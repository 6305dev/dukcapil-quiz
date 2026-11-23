<template>
  <div class="space-y-4">
    <h1 class="text-xl font-bold tracking-tight text-[#111111]">Peringkat</h1>

    <select
      v-model="selectedQuizId"
      @change="fetchRanking"
      class="nb-input h-11 w-full px-3.5 text-sm font-bold text-[#111111]"
    >
      <option value="">Semua Kuis</option>
      <option v-for="q in quizzes" :key="q.id" :value="q.id">{{ q.judul }}</option>
    </select>

    <RankingTable
      :items="ranking"
      :loading="loading"
      :highlight-user-id="auth.user?.id"
      :mask-nik="true"
      :compact="true"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import RankingTable from '@/components/RankingTable.vue';

const auth = useAuthStore();
const ranking = ref([]);
const quizzes = ref([]);
const selectedQuizId = ref('');
const loading = ref(true);

async function fetchRanking() {
  loading.value = true;
  try {
    const params = selectedQuizId.value ? { quiz_id: selectedQuizId.value } : {};
    const { data } = await api.get('/ranking', { params });
    ranking.value = data.ranking || [];
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get('/quizzes/active');
    quizzes.value = data.quizzes || [];
  } catch {
    // ignore
  }
  await fetchRanking();
});
</script>
