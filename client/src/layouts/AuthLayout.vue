<template>
  <div class="flex min-h-dvh flex-col items-center justify-center bg-[#FFFDF7] px-5 py-8">
    <div class="w-full max-w-[400px]">
      <!-- Brand -->
      <div class="mb-6 flex items-center justify-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#111111] bg-[#FFD84D] shadow-[3px_3px_0px_#111111]"
        >
          <ShieldCheck class="h-6 w-6 text-[#111111]" :stroke-width="2.5" />
        </div>
        <h1 class="text-xl font-bold tracking-tight text-[#111111]">Dukcapil Quiz</h1>
      </div>

      <div class="nb-card p-6">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ShieldCheck } from 'lucide-vue-next';
</script>
