<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      @click.self="$emit('close')"
    >
      <div class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 class="text-lg font-bold text-slate-900">{{ title }}</h3>
          <button
            type="button"
            @click="$emit('close')"
            class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
        <div class="max-h-[80vh] overflow-y-auto px-6 py-5">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { X } from 'lucide-vue-next';

defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' }
});

defineEmits(['close']);
</script>
