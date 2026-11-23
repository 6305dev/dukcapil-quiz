<template>
  <div class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Kelola Quiz</h1>
        <p class="mt-1 text-sm text-slate-500">Atur judul, durasi waktu, jumlah soal acak, dan status aktif quiz.</p>
      </div>
      <button
        type="button"
        @click="openCreate"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
      >
        <Plus class="h-4 w-4" />
        Buat Quiz Baru
      </button>
    </div>

    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
      Memuat daftar quiz...
    </div>

    <div
      v-else-if="quizzes.length === 0"
      class="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Belum ada quiz dibuat.
    </div>

    <div v-else class="grid gap-4 md:grid-cols-2">
      <div
        v-for="q in quizzes"
        :key="q.id"
        class="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <div class="flex items-start justify-between gap-2">
            <h2 class="text-base font-bold text-slate-900">{{ q.judul }}</h2>
            <span
              class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="q.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
            >
              {{ q.is_active ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>
          <p class="mt-1.5 text-sm text-slate-500">{{ q.deskripsi || '-' }}</p>

          <div class="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            <span class="rounded-lg bg-slate-100 px-2.5 py-1">Durasi: {{ q.durasi_detik }} detik</span>
            <span class="rounded-lg bg-slate-100 px-2.5 py-1">Soal Tampil: {{ q.jumlah_soal }}</span>
            <span class="rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700">Bank Soal: {{ q.total_soal }}</span>
            <span class="rounded-lg bg-amber-50 px-2.5 py-1 text-amber-700">Attempt: {{ q.total_attempt }}</span>
          </div>
        </div>

        <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <router-link
            :to="{ path: '/admin/questions', query: { quiz_id: q.id } }"
            class="text-xs font-bold text-blue-600 hover:underline"
          >
            Kelola Soal &rarr;
          </router-link>

          <div class="flex gap-2">
            <button
              type="button"
              @click="openEdit(q)"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Edit
            </button>
            <button
              type="button"
              @click="handleDelete(q)"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              Hapus
            </button>
          </div>
        </div>
      </div>
    </div>

    <ModalDialog :open="modalOpen" :title="editingId ? 'Edit Quiz' : 'Buat Quiz Baru'" @close="modalOpen = false">
      <div v-if="formError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {{ formError }}
      </div>

      <form @submit.prevent="handleSave" class="space-y-4">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">Judul Quiz</label>
          <input
            v-model.trim="form.judul"
            type="text"
            required
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">Deskripsi</label>
          <textarea
            v-model.trim="form.deskripsi"
            rows="3"
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Durasi (detik)</label>
            <input
              v-model.number="form.durasi_detik"
              type="number"
              min="30"
              required
              class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Jumlah Soal Acak</label>
            <input
              v-model.number="form.jumlah_soal"
              type="number"
              min="1"
              required
              class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>
        <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" />
          Aktifkan quiz untuk peserta
        </label>

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
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import api from '@/services/api';
import ModalDialog from '@/components/ModalDialog.vue';
import { Plus } from 'lucide-vue-next';

const quizzes = ref([]);
const loading = ref(true);
const modalOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref('');

const form = reactive({
  judul: '',
  deskripsi: '',
  durasi_detik: 300,
  jumlah_soal: 5,
  is_active: true
});

async function fetchQuizzes() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/quizzes');
    quizzes.value = data.quizzes || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  formError.value = '';
  Object.assign(form, { judul: '', deskripsi: '', durasi_detik: 300, jumlah_soal: 5, is_active: true });
  modalOpen.value = true;
}

function openEdit(quiz) {
  editingId.value = quiz.id;
  formError.value = '';
  Object.assign(form, {
    judul: quiz.judul,
    deskripsi: quiz.deskripsi || '',
    durasi_detik: quiz.durasi_detik,
    jumlah_soal: quiz.jumlah_soal,
    is_active: Boolean(quiz.is_active)
  });
  modalOpen.value = true;
}

async function handleSave() {
  saving.value = true;
  formError.value = '';
  try {
    if (editingId.value) {
      await api.put(`/admin/quizzes/${editingId.value}`, form);
    } else {
      await api.post('/admin/quizzes', form);
    }
    modalOpen.value = false;
    await fetchQuizzes();
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan quiz.';
  } finally {
    saving.value = false;
  }
}

async function handleDelete(quiz) {
  if (!window.confirm(`Yakin ingin menghapus quiz "${quiz.judul}" beserta seluruh soal dan attempt-nya?`)) return;
  try {
    await api.delete(`/admin/quizzes/${quiz.id}`);
    await fetchQuizzes();
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus quiz.');
  }
}

onMounted(fetchQuizzes);
</script>
