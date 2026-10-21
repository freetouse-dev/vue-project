<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'icon' | 'full'
  }>(),
  {
    size: 'md',
    variant: 'icon',
  }
)
</script>

<template>
  <div
    class="shrink-0 transition-transform duration-150 hover:scale-105 flex items-center justify-center"
    :class="[
      variant === 'full'
        ? size === 'sm'
          ? 'h-7 w-auto'
          : size === 'lg'
          ? 'h-12 w-auto'
          : 'h-9 w-auto'
        : size === 'xs'
        ? 'w-5 h-5'
        : size === 'sm'
        ? 'w-7 h-7'
        : size === 'lg'
        ? 'w-12 h-12'
        : size === 'xl'
        ? 'w-16 h-16'
        : 'w-8 h-8',
    ]"
  >
    <template v-if="variant === 'full'">
      <!-- Light mode full logo -->
      <img
        src="/unitask-logo.png"
        alt="Unitask Project Management"
        class="h-full w-auto object-contain dark:hidden drop-shadow-xs"
      />
      <!-- Dark mode full logo -->
      <img
        src="/unitask-logo-dark.png"
        alt="Unitask Project Management"
        class="h-full w-auto object-contain hidden dark:block drop-shadow-xs"
      />
    </template>
    <template v-else>
      <img
        src="/unitask-icon.png"
        alt="Unitask Logo"
        class="w-full h-full object-contain drop-shadow-xs"
      />
    </template>
  </div>
</template>
