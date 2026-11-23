<template>
  <div class="space-y-4">
    <!-- Question Box -->
    <div class="nb-card p-5">
      <div class="mb-2.5 flex items-center justify-between gap-2">
        <span class="rounded-lg border-2 border-[#111111] bg-[#E0F2FE] px-2.5 py-0.5 text-xs font-bold">
          #{{ index + 1 }}
        </span>
        <span v-if="saving" class="text-xs font-bold text-neutral-400">...</span>
        <span v-else-if="selected" class="text-xs font-bold text-emerald-700">✓</span>
      </div>

      <h2 class="text-[16px] font-bold leading-snug text-[#111111]">
        {{ question.pertanyaan }}
      </h2>
    </div>

    <!-- 4-Card 2x2 Grid Answers -->
    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="opt in options"
        :key="opt.key"
        type="button"
        :disabled="disabled"
        @click="$emit('select', opt.key)"
        class="flex min-h-[120px] flex-col justify-between rounded-2xl border-2 border-[#111111] p-3.5 text-left transition active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
        :class="
          selected === opt.key
            ? 'bg-[#FFD84D] shadow-[4px_4px_0px_#111111]'
            : `${opt.bg} shadow-[3px_3px_0px_#111111]`
        "
      >
        <div class="flex items-center justify-between">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#111111] text-xs font-bold"
            :class="selected === opt.key ? 'bg-[#111111] text-white' : 'bg-white text-[#111111]'"
          >
            {{ opt.key }}
          </span>
          <span v-if="selected === opt.key" class="text-sm font-bold text-[#111111]">✓</span>
        </div>

        <span class="mt-3 text-[13px] font-bold leading-snug text-[#111111]">
          {{ opt.text }}
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
  selected: { type: String, default: null },
  saving: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
});

defineEmits(['select']);

const options = computed(() => [
  { key: 'A', text: props.question.opsi_a, bg: 'bg-[#E0F2FE] hover:bg-[#BAE6FD]' },
  { key: 'B', text: props.question.opsi_b, bg: 'bg-[#DCFCE7] hover:bg-[#BBF7D0]' },
  { key: 'C', text: props.question.opsi_c, bg: 'bg-[#F3E8FF] hover:bg-[#E9D5FF]' },
  { key: 'D', text: props.question.opsi_d, bg: 'bg-[#FFEDD5] hover:bg-[#FED7AA]' }
]);
</script>
