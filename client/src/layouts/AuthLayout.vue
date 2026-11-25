<template>
  <div class="flex min-h-dvh flex-col items-center justify-center bg-[#FFFDF7] px-5 py-8">
    <div class="w-full max-w-[400px]">
      <!-- Brand -->
      <div class="mb-6 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#111111] bg-[#FFD84D] shadow-[3px_3px_0px_#111111]"
          >
            <ShieldCheck class="h-6 w-6 text-[#111111]" :stroke-width="2.5" />
          </div>
          <h1 class="text-xl font-bold tracking-tight text-[#111111]">Dukcapil Quiz</h1>
        </div>
        <router-link
          to="/doorprize"
          class="nb-btn inline-flex h-9 items-center gap-1.5 bg-[#A3F7BF] px-3 text-xs font-bold text-[#111111] hover:bg-[#86EFAC]"
        >
          <Gift class="h-4 w-4" :stroke-width="2.4" />
          Doorprize
        </router-link>
      </div>

      <div class="nb-card p-6">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ShieldCheck, Gift } from 'lucide-vue-next';
</script>
