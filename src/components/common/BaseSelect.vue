<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { LucideChevronDown, LucideCheck } from 'lucide-vue-next'

export interface SelectOption {
  value: string | number
  label: string
  dotColor?: string
  badgeClass?: string
  description?: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number | null | undefined
    options: SelectOption[]
    placeholder?: string
    label?: string
    id?: string
    disabled?: boolean
    size?: 'sm' | 'md'
    fullWidth?: boolean
  }>(),
  {
    placeholder: 'Select...',
    label: '',
    id: '',
    disabled: false,
    size: 'sm',
    fullWidth: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'change', value: string | number): void
}>()

const isOpen = ref(false)
const selectRef = ref<HTMLElement | null>(null)

const selectedOption = computed(() => {
  return props.options.find((opt) => opt.value === props.modelValue)
})

function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function selectOption(option: SelectOption) {
  emit('update:modelValue', option.value)
  emit('change', option.value)
  closeDropdown()
}

function handleClickOutside(event: MouseEvent) {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div
    ref="selectRef"
    class="relative inline-block text-left select-none"
    :class="{ 'w-full': fullWidth }"
  >
    <!-- Optional Label -->
    <label
      v-if="label"
      :for="id"
      class="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
    >
      {{ label }}
    </label>

    <!-- Trigger Button -->
    <button
      :id="id"
      type="button"
      :disabled="disabled"
      class="flex items-center justify-between gap-2.5 rounded-xl border font-medium transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
      :class="[
        fullWidth ? 'w-full' : 'min-w-[130px]',
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm',
        isOpen
          ? 'ring-2 ring-indigo-500 border-indigo-500 bg-white dark:bg-slate-900'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200',
        disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800' : '',
      ]"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="toggleDropdown"
    >
      <!-- Left side: dot / badge & label -->
      <span class="flex items-center gap-2 truncate">
        <!-- Dot if provided -->
        <span
          v-if="selectedOption?.dotColor"
          class="w-2 h-2 rounded-full shrink-0"
          :class="selectedOption.dotColor"
        ></span>

        <!-- Label or placeholder -->
        <span
          v-if="selectedOption"
          class="truncate font-medium text-slate-900 dark:text-slate-100"
        >
          {{ selectedOption.label }}
        </span>
        <span v-else class="text-slate-400 dark:text-slate-500 truncate">
          {{ placeholder }}
        </span>
      </span>

      <!-- Chevron -->
      <LucideChevronDown
        class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180 text-indigo-600 dark:text-indigo-400': isOpen }"
      />
    </button>

    <!-- Floating Popover Options Menu -->
    <div
      v-if="isOpen"
      class="absolute left-0 mt-1.5 min-w-full w-max max-w-xs md:max-w-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto"
      role="listbox"
    >
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer"
        :class="[
          option.value === modelValue
            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold'
            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80',
        ]"
        role="option"
        :aria-selected="option.value === modelValue"
        @click="selectOption(option)"
      >
        <span class="flex items-center gap-2 min-w-0 pr-3">
          <!-- Dot -->
          <span
            v-if="option.dotColor"
            class="w-2 h-2 rounded-full shrink-0"
            :class="option.dotColor"
          ></span>

          <!-- Label -->
          <span class="truncate">{{ option.label }}</span>
        </span>

        <!-- Checkmark for selected item -->
        <LucideCheck
          v-if="option.value === modelValue"
          class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0"
        />
      </button>
    </div>
  </div>
</template>
