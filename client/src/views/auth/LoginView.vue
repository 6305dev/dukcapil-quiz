<template>
  <div>
    <h2 class="text-lg font-bold text-[#111111]">Masuk</h2>

    <div
      v-if="errorMsg"
      class="mt-4 rounded-xl border-2 border-[#111111] bg-[#FF6B6B] px-3.5 py-2.5 text-xs font-bold text-[#111111]"
    >
      {{ errorMsg }}
    </div>

    <form @submit.prevent="handleSubmit" class="mt-5 space-y-4">
      <div>
        <label class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#111111]">NIK</label>
        <input
          v-model.trim="form.nik"
          type="text"
          inputmode="numeric"
          maxlength="16"
          required
          placeholder="16 digit NIK"
          class="nb-input h-12 w-full px-3.5 font-mono text-[15px] font-semibold text-[#111111] placeholder:font-normal placeholder:text-neutral-400"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#111111]">Nama</label>
        <input
          v-model.trim="form.nama"
          type="text"
          required
          placeholder="Nama lengkap"
          class="nb-input h-12 w-full px-3.5 text-[15px] font-semibold text-[#111111] placeholder:font-normal placeholder:text-neutral-400"
        />
      </div>

      <div>
        <label class="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[#111111]">Telepon</label>
        <input
          v-model.trim="form.no_whatsapp"
          type="text"
          inputmode="tel"
          required
          placeholder="08xxxxxxxxxx"
          class="nb-input h-12 w-full px-3.5 font-mono text-[15px] font-semibold text-[#111111] placeholder:font-normal placeholder:text-neutral-400"
        />
      </div>

      <button
        type="submit"
        :disabled="auth.loading"
        class="nb-btn mt-2 flex h-12 w-full items-center justify-center bg-[#FFD84D] text-[15px] font-bold text-[#111111] hover:bg-[#FCCE2D] disabled:opacity-60"
      >
        {{ auth.loading ? '...' : 'Lanjut' }}
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
    const data = await auth.login({
      nik: form.nik,
      nama: form.nama,
      no_whatsapp: form.no_whatsapp
    });
    if (data.user.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/peserta/dashboard');
    }
  } catch (err) {
    errorMsg.value =
      err.response?.data?.message || 'Gagal login. Periksa kembali NIK, nama lengkap, dan nomor telepon Anda.';
  }
}
</script>
