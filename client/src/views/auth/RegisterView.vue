<template>
  <div>
    <!-- Segmented Switch -->
    <div class="mb-7 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
      <router-link
        to="/login"
        class="rounded-xl py-2 text-center text-sm font-medium text-slate-500 transition hover:text-slate-700"
      >
        Masuk
      </router-link>
      <span
        class="rounded-xl bg-white py-2 text-center text-sm font-semibold text-slate-900 shadow-xs"
      >
        Daftar
      </span>
    </div>

    <h2 class="text-xl font-bold tracking-tight text-slate-900">Buat Akun Peserta</h2>
    <p class="mt-1 text-sm text-slate-500">Isi data singkat untuk mulai mengikuti kuis.</p>

    <div
      v-if="errorMsg"
      class="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-xs font-medium text-red-600"
    >
      {{ errorMsg }}
    </div>

    <form @submit.prevent="handleSubmit" class="mt-6 space-y-4">
      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-500">NIK (16 Digit)</label>
        <input
          v-model.trim="form.nik"
          type="text"
          inputmode="numeric"
          maxlength="16"
          required
          placeholder="16 digit angka NIK"
          class="h-12 w-full rounded-2xl border border-transparent bg-slate-100/90 px-4 font-mono text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-500">Nama Lengkap</label>
        <input
          v-model.trim="form.nama"
          type="text"
          required
          placeholder="Nama sesuai KTP"
          class="h-12 w-full rounded-2xl border border-transparent bg-slate-100/90 px-4 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-500">Nomor Telepon</label>
        <input
          v-model.trim="form.no_whatsapp"
          type="text"
          inputmode="tel"
          required
          placeholder="08xxxxxxxxxx"
          class="h-12 w-full rounded-2xl border border-transparent bg-slate-100/90 px-4 font-mono text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
      </div>

      <button
        type="submit"
        :disabled="auth.loading"
        class="mt-2 flex h-12 w-full items-center justify-center rounded-2xl bg-blue-600 text-[15px] font-semibold text-white transition active:scale-[0.98] hover:bg-blue-700 disabled:opacity-60"
      >
        {{ auth.loading ? 'Mendaftarkan...' : 'Daftar & Mulai' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const errorMsg = ref('');

const form = reactive({
  nik: '',
  nama: '',
  no_whatsapp: ''
});

async function handleSubmit() {
  errorMsg.value = '';

  if (!/^[0-9]{16}$/.test(form.nik)) {
    errorMsg.value = 'NIK harus terdiri dari tepat 16 digit angka.';
    return;
  }
  if (form.nama.length < 3) {
    errorMsg.value = 'Nama lengkap minimal 3 karakter.';
    return;
  }
  if (!/^0[0-9]{8,14}$/.test(form.no_whatsapp)) {
    errorMsg.value = 'Format nomor telepon tidak valid (contoh: 081234567890).';
    return;
  }

  try {
    await auth.register({
      nik: form.nik,
      nama: form.nama,
      no_whatsapp: form.no_whatsapp
    });
    router.push('/peserta/dashboard');
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.';
  }
}
</script>
