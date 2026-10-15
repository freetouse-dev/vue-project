<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    size: 'md',
  }
)
</script>

<template>
  <div
    class="shrink-0 transition-transform duration-150 hover:scale-105"
    :class="[
      size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-12 h-12' : 'w-8 h-8',
    ]"
  >
    <img
      src="/favicon.svg"
      alt="TaskFlow Logo"
      class="w-full h-full drop-shadow-xs"
    />
  </div>
</template>
