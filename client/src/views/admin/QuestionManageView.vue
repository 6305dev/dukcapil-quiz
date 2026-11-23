<template>
  <div class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Kelola Bank Soal</h1>
        <p class="mt-1 text-sm text-slate-500">Pilih quiz untuk melihat, menambah, atau mengubah soal pilihan ganda.</p>
      </div>
      <button
        type="button"
        :disabled="quizzes.length === 0"
        @click="openCreate"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
      >
        <Plus class="h-4 w-4" />
        Tambah Soal
      </button>
    </div>

    <!-- Filter by Quiz -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <label class="text-sm font-semibold text-slate-700">Filter Quiz:</label>
      <select
        v-model="selectedQuizId"
        @change="fetchQuestions"
        class="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 sm:min-w-72"
      >
        <option value="">Semua Quiz</option>
        <option v-for="q in quizzes" :key="q.id" :value="q.id">{{ q.judul }}</option>
      </select>
      <span class="text-xs font-medium text-slate-500">Total: {{ questions.length }} soal</span>
    </div>

    <!-- Question List -->
    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
      Memuat daftar soal...
    </div>

    <div
      v-else-if="questions.length === 0"
      class="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Belum ada soal untuk quiz ini.
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(q, idx) in questions"
        :key="q.id"
        class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div class="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">#{{ idx + 1 }}</span>
            <span class="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {{ q.quiz_judul }}
            </span>
          </div>
          <div class="flex gap-2">
            <button
              type="button"
              @click="openEdit(q)"
              class="rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              Edit
            </button>
            <button
              type="button"
              @click="handleDelete(q)"
              class="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Hapus
            </button>
          </div>
        </div>

        <p class="mb-4 text-sm font-semibold text-slate-900 sm:text-base">{{ q.pertanyaan }}</p>

        <div class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="opt in ['A', 'B', 'C', 'D']"
            :key="opt"
            class="flex items-start gap-2 rounded-xl border px-3.5 py-2 text-xs sm:text-sm"
            :class="
              q.jawaban_benar === opt
                ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-900'
                : 'border-slate-200 bg-slate-50/50 text-slate-600'
            "
          >
            <span class="font-bold">{{ opt }}.</span>
            <span>{{ q[`opsi_${opt.toLowerCase()}`] }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal CRUD Soal -->
    <ModalDialog :open="modalOpen" :title="editingId ? 'Edit Soal' : 'Tambah Soal Baru'" @close="modalOpen = false">
      <div v-if="formError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {{ formError }}
      </div>

      <form @submit.prevent="handleSave" class="space-y-4">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">Quiz</label>
          <select
            v-model="form.quiz_id"
            required
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="" disabled>-- Pilih Quiz --</option>
            <option v-for="q in quizzes" :key="q.id" :value="q.id">{{ q.judul }}</option>
          </select>
        </div>

        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">Pertanyaan</label>
          <textarea
            v-model.trim="form.pertanyaan"
            rows="3"
            required
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div class="grid gap-3">
          <div v-for="opt in ['a', 'b', 'c', 'd']" :key="opt">
            <label class="mb-1 block text-xs font-semibold text-slate-700">Opsi {{ opt.toUpperCase() }}</label>
            <input
              v-model.trim="form[`opsi_${opt}`]"
              type="text"
              required
              class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">Jawaban Benar</label>
          <select
            v-model="form.jawaban_benar"
            required
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm font-semibold outline-none focus:border-blue-500"
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button
            type="button"
            @click="modalOpen = false"
            class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Batal
          </button>
          <button
            type="submit"
            :disabled="saving"
            class="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {{ saving ? 'Menyimpan...' : 'Simpan Soal' }}
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/services/api';
import ModalDialog from '@/components/ModalDialog.vue';
import { Plus } from 'lucide-vue-next';

const route = useRoute();
const quizzes = ref([]);
const questions = ref([]);
const selectedQuizId = ref(route.query.quiz_id ? Number(route.query.quiz_id) : '');
const loading = ref(true);

const modalOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref('');

const form = reactive({
  quiz_id: '',
  pertanyaan: '',
  opsi_a: '',
  opsi_b: '',
  opsi_c: '',
  opsi_d: '',
  jawaban_benar: 'A'
});

async function fetchQuizzes() {
  const { data } = await api.get('/admin/quizzes');
  quizzes.value = data.quizzes || [];
}

async function fetchQuestions() {
  loading.value = true;
  try {
    const params = selectedQuizId.value ? { quiz_id: selectedQuizId.value } : {};
    const { data } = await api.get('/admin/questions', { params });
    questions.value = data.questions || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  formError.value = '';
  Object.assign(form, {
    quiz_id: selectedQuizId.value || quizzes.value[0]?.id || '',
    pertanyaan: '',
    opsi_a: '',
    opsi_b: '',
    opsi_c: '',
    opsi_d: '',
    jawaban_benar: 'A'
  });
  modalOpen.value = true;
}

function openEdit(q) {
  editingId.value = q.id;
  formError.value = '';
  Object.assign(form, {
    quiz_id: q.quiz_id,
    pertanyaan: q.pertanyaan,
    opsi_a: q.opsi_a,
    opsi_b: q.opsi_b,
    opsi_c: q.opsi_c,
    opsi_d: q.opsi_d,
    jawaban_benar: q.jawaban_benar
  });
  modalOpen.value = true;
}

async function handleSave() {
  saving.value = true;
  formError.value = '';
  try {
    if (editingId.value) {
      await api.put(`/admin/questions/${editingId.value}`, form);
    } else {
      await api.post('/admin/questions', form);
    }
    modalOpen.value = false;
    await fetchQuestions();
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan soal.';
  } finally {
    saving.value = false;
  }
}

async function handleDelete(q) {
  if (!window.confirm('Yakin ingin menghapus soal ini?')) return;
  try {
    await api.delete(`/admin/questions/${q.id}`);
    await fetchQuestions();
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus soal.');
  }
}

onMounted(async () => {
  await fetchQuizzes();
  await fetchQuestions();
});
</script>
