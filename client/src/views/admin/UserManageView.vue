<template>
  <div class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Kelola Peserta</h1>
        <p class="mt-1 text-sm text-slate-500">Tambah, ubah, cari, atau hapus akun peserta & admin.</p>
      </div>
      <button
        type="button"
        @click="openCreate"
        class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
      >
        <Plus class="h-4 w-4" />
        Tambah Peserta
      </button>
    </div>

    <!-- Search & Filter -->
    <div class="flex flex-col gap-3 sm:flex-row">
      <div class="relative flex-1">
        <Search class="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          v-model="search"
          @input="debouncedFetch"
          type="text"
          placeholder="Cari berdasarkan NIK, nama, atau no WhatsApp..."
          class="w-full rounded-xl border border-slate-300 bg-white py-2.5 pr-4 pl-10 text-sm outline-none focus:border-blue-500"
        />
      </div>
      <select
        v-model="roleFilter"
        @change="fetchUsers(1)"
        class="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
      >
        <option value="">Semua Role</option>
        <option value="peserta">Peserta</option>
        <option value="admin">Admin</option>
      </select>
    </div>

    <!-- Table -->
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div v-if="loading" class="p-8 text-center text-sm text-slate-500">Memuat data peserta...</div>
      <div v-else-if="users.length === 0" class="p-8 text-center text-sm text-slate-500">
        Tidak ada data pengguna ditemukan.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">NIK</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">Nama</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-slate-500">No. WhatsApp</th>
              <th class="px-5 py-3 text-center text-xs font-semibold uppercase text-slate-500">Role</th>
              <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="u in users" :key="u.id" class="hover:bg-slate-50">
              <td class="whitespace-nowrap px-5 py-3.5 font-mono text-sm text-slate-700">{{ u.nik }}</td>
              <td class="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-900">{{ u.nama }}</td>
              <td class="whitespace-nowrap px-5 py-3.5 font-mono text-sm text-slate-600">{{ u.no_whatsapp }}</td>
              <td class="whitespace-nowrap px-5 py-3.5 text-center">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  :class="u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'"
                >
                  {{ u.role }}
                </span>
              </td>
              <td class="whitespace-nowrap px-5 py-3.5 text-right">
                <button
                  type="button"
                  @click="openEdit(u)"
                  class="mr-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  @click="handleDelete(u)"
                  class="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div
        v-if="pagination.total_pages > 1"
        class="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-xs text-slate-600"
      >
        <span>Halaman {{ pagination.page }} dari {{ pagination.total_pages }} ({{ pagination.total }} data)</span>
        <div class="flex gap-2">
          <button
            type="button"
            :disabled="pagination.page <= 1"
            @click="fetchUsers(pagination.page - 1)"
            class="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            :disabled="pagination.page >= pagination.total_pages"
            @click="fetchUsers(pagination.page + 1)"
            class="rounded-lg border border-slate-300 px-3 py-1.5 font-semibold disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <ModalDialog :open="modalOpen" :title="editingId ? 'Edit Pengguna' : 'Tambah Pengguna'" @close="modalOpen = false">
      <div v-if="formError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {{ formError }}
      </div>

      <form @submit.prevent="handleSave" class="space-y-4">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">NIK (16 Digit)</label>
          <input
            v-model.trim="form.nik"
            type="text"
            maxlength="16"
            required
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-mono text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">Nama Lengkap</label>
          <input
            v-model.trim="form.nama"
            type="text"
            required
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">Nomor WhatsApp</label>
          <input
            v-model.trim="form.no_whatsapp"
            type="text"
            required
            placeholder="08xxxxxxxxxx"
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2 font-mono text-sm outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">Role</label>
          <select
            v-model="form.role"
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="peserta">Peserta</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">
            Password {{ editingId ? '(Kosongkan jika tidak ingin mengubah)' : '(Minimal 8 karakter)' }}
          </label>
          <input
            v-model="form.password"
            type="password"
            :required="!editingId"
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
          />
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
import { Plus, Search } from 'lucide-vue-next';

const users = ref([]);
const loading = ref(true);
const search = ref('');
const roleFilter = ref('');
const pagination = reactive({ page: 1, limit: 10, total: 0, total_pages: 1 });

const modalOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref('');

const form = reactive({
  nik: '',
  nama: '',
  no_whatsapp: '',
  role: 'peserta',
  password: ''
});

let debounceTimer = null;
function debouncedFetch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchUsers(1), 300);
}

async function fetchUsers(page = 1) {
  loading.value = true;
  try {
    const params = { page, limit: pagination.limit };
    if (search.value.trim()) params.search = search.value.trim();
    if (roleFilter.value) params.role = roleFilter.value;
    const { data } = await api.get('/admin/users', { params });
    users.value = data.users || [];
    Object.assign(pagination, data.pagination);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  formError.value = '';
  Object.assign(form, { nik: '', nama: '', no_whatsapp: '', role: 'peserta', password: '' });
  modalOpen.value = true;
}

function openEdit(user) {
  editingId.value = user.id;
  formError.value = '';
  Object.assign(form, {
    nik: user.nik,
    nama: user.nama,
    no_whatsapp: user.no_whatsapp,
    role: user.role,
    password: ''
  });
  modalOpen.value = true;
}

async function handleSave() {
  saving.value = true;
  formError.value = '';
  try {
    if (editingId.value) {
      await api.put(`/admin/users/${editingId.value}`, form);
    } else {
      await api.post('/admin/users', form);
    }
    modalOpen.value = false;
    await fetchUsers(pagination.page);
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan data pengguna.';
  } finally {
    saving.value = false;
  }
}

async function handleDelete(user) {
  if (!window.confirm(`Yakin ingin menghapus pengguna "${user.nama}" (${user.nik})?`)) return;
  try {
    await api.delete(`/admin/users/${user.id}`);
    await fetchUsers(pagination.page);
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus pengguna.');
  }
}

onMounted(() => fetchUsers(1));
</script>
