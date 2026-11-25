<template>
  <div class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 class="text-2xl font-extrabold text-slate-900">Kelola Hadiah Doorprize</h1>
        <p class="mt-1 text-sm text-slate-500">
          Atur daftar hadiah, warna segmen, urutan, dan stok yang ditampilkan pada Spinning Wheel undian.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <router-link
          to="/doorprize"
          target="_blank"
          class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50"
        >
          <ExternalLink class="h-4 w-4 text-blue-600" />
          Buka Spinning Wheel
        </router-link>
        <button
          type="button"
          @click="openCreate"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus class="h-4 w-4" />
          Tambah Hadiah
        </button>
      </div>
    </div>

    <!-- Summary Strip -->
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Item Hadiah</p>
        <p class="mt-1 text-2xl font-extrabold text-slate-900">{{ prizes.length }}</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Tampil di Wheel</p>
        <p class="mt-1 text-2xl font-extrabold text-emerald-600">{{ activeOnWheelCount }}</p>
        <p class="mt-0.5 text-xs text-slate-400">Status aktif &amp; stok tersedia</p>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Status Wheel</p>
        <p
          class="mt-1 text-sm font-bold"
          :class="activeOnWheelCount >= 2 ? 'text-emerald-600' : 'text-amber-600'"
        >
          {{
            activeOnWheelCount >= 2
              ? 'Siap Diputar (/doorprize)'
              : 'Minimal 2 hadiah aktif diperlukan'
          }}
        </p>
      </div>
    </div>

    <!-- Table / List -->
    <div v-if="loading" class="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
      Memuat daftar hadiah doorprize...
    </div>

    <div
      v-else-if="prizes.length === 0"
      class="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Belum ada hadiah doorprize. Klik <strong>Tambah Hadiah</strong> untuk mulai mengisi roda undian.
    </div>

    <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase text-slate-500">Urutan</th>
              <th class="px-5 py-3.5 text-left text-xs font-semibold uppercase text-slate-500">Warna &amp; Nama Hadiah</th>
              <th class="px-5 py-3.5 text-center text-xs font-semibold uppercase text-slate-500">Stok</th>
              <th class="px-5 py-3.5 text-center text-xs font-semibold uppercase text-slate-500">Status</th>
              <th class="px-5 py-3.5 text-right text-xs font-semibold uppercase text-slate-500">Aksi</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="item in prizes" :key="item.id" class="hover:bg-slate-50/80">
              <td class="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-600">
                #{{ item.urutan }}
              </td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <span
                    class="h-7 w-7 shrink-0 rounded-lg border-2 border-slate-900 shadow-xs"
                    :style="{ backgroundColor: item.warna }"
                  />
                  <div>
                    <p class="text-sm font-bold text-slate-900">{{ item.nama }}</p>
                    <p class="font-mono text-[11px] text-slate-400">{{ item.warna }}</p>
                  </div>
                </div>
              </td>
              <td class="whitespace-nowrap px-5 py-3.5 text-center">
                <span
                  v-if="item.stok === null"
                  class="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                >
                  Tak Terbatas
                </span>
                <span
                  v-else
                  class="inline-flex rounded-lg px-2.5 py-1 text-xs font-bold"
                  :class="item.stok > 0 ? 'bg-slate-100 text-slate-800' : 'bg-red-100 text-red-700'"
                >
                  {{ item.stok > 0 ? `${item.stok} tersisa` : 'Habis (0)' }}
                </span>
              </td>
              <td class="whitespace-nowrap px-5 py-3.5 text-center">
                <button
                  type="button"
                  @click="toggleActive(item)"
                  class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition"
                  :class="
                    item.is_active
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  "
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="item.is_active ? 'bg-emerald-600' : 'bg-slate-400'"
                  />
                  {{ item.is_active ? 'Aktif' : 'Nonaktif' }}
                </button>
              </td>
              <td class="whitespace-nowrap px-5 py-3.5 text-right">
                <div class="inline-flex items-center gap-1">
                  <button
                    type="button"
                    @click="openEdit(item)"
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    @click="handleDelete(item)"
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Add/Edit -->
    <ModalDialog
      :open="modalOpen"
      :title="editingId ? 'Edit Hadiah Doorprize' : 'Tambah Hadiah Doorprize'"
      @close="modalOpen = false"
    >
      <div v-if="formError" class="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {{ formError }}
      </div>

      <form @submit.prevent="handleSave" class="space-y-4">
        <div>
          <label class="mb-1 block text-xs font-semibold text-slate-700">Nama / Nilai Hadiah</label>
          <input
            v-model.trim="form.nama"
            type="text"
            required
            maxlength="150"
            placeholder="Contoh: Voucher Belanja 100K / Tumbler Eksklusif"
            class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label class="mb-1.5 block text-xs font-semibold text-slate-700">Warna Segmen Wheel</label>
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-for="preset in colorPresets"
              :key="preset"
              type="button"
              @click="form.warna = preset"
              class="h-8 w-8 rounded-lg border-2 transition"
              :class="form.warna.toUpperCase() === preset ? 'scale-110 border-slate-900 ring-2 ring-blue-500' : 'border-slate-300'"
              :style="{ backgroundColor: preset }"
              :title="preset"
            />
            <label
              class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <input v-model="form.warna" type="color" class="h-6 w-6 cursor-pointer border-0 bg-transparent p-0" />
              <span class="font-mono uppercase">{{ form.warna }}</span>
            </label>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">
              Stok Hadiah <span class="font-normal text-slate-400">(opsional)</span>
            </label>
            <input
              v-model="form.stok"
              type="number"
              min="0"
              placeholder="Kosongkan = tak terbatas"
              class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-slate-700">Urutan Segmen</label>
            <input
              v-model.number="form.urutan"
              type="number"
              min="0"
              required
              class="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-600" />
          Tampilkan hadiah ini di Spinning Wheel
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
import { ref, reactive, computed, onMounted } from 'vue';
import api from '@/services/api';
import ModalDialog from '@/components/ModalDialog.vue';
import { Plus, ExternalLink } from 'lucide-vue-next';

const colorPresets = [
  '#FFD84D',
  '#93C5FD',
  '#A3F7BF',
  '#FF9F68',
  '#C4B5FD',
  '#FF6B6B',
  '#67E8F9',
  '#FDE68A',
  '#F9A8D4',
  '#86EFAC'
];

const prizes = ref([]);
const loading = ref(true);
const modalOpen = ref(false);
const editingId = ref(null);
const saving = ref(false);
const formError = ref('');

const form = reactive({
  nama: '',
  warna: '#FFD84D',
  stok: '',
  urutan: 1,
  is_active: true
});

const activeOnWheelCount = computed(
  () => prizes.value.filter((p) => p.is_active && (p.stok === null || p.stok > 0)).length
);

async function fetchPrizes() {
  loading.value = true;
  try {
    const { data } = await api.get('/admin/doorprize');
    prizes.value = data.prizes || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  formError.value = '';
  const nextOrder = prizes.value.length > 0 ? Math.max(...prizes.value.map((p) => Number(p.urutan || 0))) + 1 : 1;
  const nextColor = colorPresets[prizes.value.length % colorPresets.length];
  Object.assign(form, {
    nama: '',
    warna: nextColor,
    stok: '',
    urutan: nextOrder,
    is_active: true
  });
  modalOpen.value = true;
}

function openEdit(item) {
  editingId.value = item.id;
  formError.value = '';
  Object.assign(form, {
    nama: item.nama,
    warna: item.warna || '#FFD84D',
    stok: item.stok === null || item.stok === undefined ? '' : item.stok,
    urutan: item.urutan ?? 0,
    is_active: Boolean(item.is_active)
  });
  modalOpen.value = true;
}

async function handleSave() {
  saving.value = true;
  formError.value = '';
  const payload = {
    nama: form.nama,
    warna: form.warna,
    stok: form.stok === '' || form.stok === null ? null : Number(form.stok),
    urutan: Number(form.urutan || 0),
    is_active: form.is_active
  };

  try {
    if (editingId.value) {
      await api.put(`/admin/doorprize/${editingId.value}`, payload);
    } else {
      await api.post('/admin/doorprize', payload);
    }
    modalOpen.value = false;
    await fetchPrizes();
  } catch (err) {
    formError.value = err.response?.data?.message || 'Gagal menyimpan hadiah doorprize.';
  } finally {
    saving.value = false;
  }
}

async function toggleActive(item) {
  try {
    await api.put(`/admin/doorprize/${item.id}`, {
      nama: item.nama,
      warna: item.warna,
      stok: item.stok,
      urutan: item.urutan,
      is_active: !item.is_active
    });
    await fetchPrizes();
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal mengubah status hadiah.');
  }
}

async function handleDelete(item) {
  if (!window.confirm(`Hapus hadiah "${item.nama}" dari daftar doorprize?`)) return;
  try {
    await api.delete(`/admin/doorprize/${item.id}`);
    await fetchPrizes();
  } catch (err) {
    alert(err.response?.data?.message || 'Gagal menghapus hadiah.');
  }
}

onMounted(fetchPrizes);
</script>
