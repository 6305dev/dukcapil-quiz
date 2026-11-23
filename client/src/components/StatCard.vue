<template>
  <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">{{ label }}</p>
        <p class="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">{{ value }}</p>
        <p v-if="subtext" class="mt-1 text-xs text-slate-500">{{ subtext }}</p>
      </div>
      <div class="flex h-12 w-12 items-center justify-center rounded-xl" :class="iconBg">
        <component :is="icon" class="h-6 w-6" :class="iconColor" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  subtext: { type: String, default: '' },
  icon: { type: [Object, Function], required: true },
  iconBg: { type: String, default: 'bg-blue-50' },
  iconColor: { type: String, default: 'text-blue-600' }
});
</script>
