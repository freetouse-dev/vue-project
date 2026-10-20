<script setup lang="ts">
import { useNotification, type NotificationType } from '@/composables/useNotification'
import {
  LucideCheckCircle2,
  LucideAlertCircle,
  LucideAlertTriangle,
  LucideInfo,
  LucideX,
} from 'lucide-vue-next'

const { notifications, dismiss } = useNotification()

function getIcon(type: NotificationType) {
  switch (type) {
    case 'success':
      return LucideCheckCircle2
    case 'error':
      return LucideAlertCircle
    case 'warning':
      return LucideAlertTriangle
    case 'info':
    default:
      return LucideInfo
  }
}

function getToastClasses(type: NotificationType) {
  switch (type) {
    case 'success':
      return {
        card: 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-800/80 shadow-lg',
        iconContainer: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
        title: 'text-emerald-950 dark:text-emerald-200',
      }
    case 'error':
      return {
        card: 'bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-800/80 shadow-lg',
        iconContainer: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
        title: 'text-rose-950 dark:text-rose-200',
      }
    case 'warning':
      return {
        card: 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-800/80 shadow-lg',
        iconContainer: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
        title: 'text-amber-950 dark:text-amber-200',
      }
    case 'info':
    default:
      return {
        card: 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/80 shadow-lg',
        iconContainer: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
        title: 'text-indigo-950 dark:text-indigo-200',
      }
  }
}
</script>

<template>
  <div
    class="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2 sm:p-0"
    aria-live="polite"
    aria-atomic="true"
  >
    <transition-group
      enter-active-class="transform ease-out duration-300 transition"
      enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
      enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="item in notifications"
        :key="item.id"
        class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border transition-all text-xs sm:text-sm"
        :class="getToastClasses(item.type).card"
        role="alert"
      >
        <div
          class="p-1.5 rounded-lg shrink-0"
          :class="getToastClasses(item.type).iconContainer"
        >
          <component :is="getIcon(item.type)" class="w-4 h-4" />
        </div>

        <div class="flex-1 min-w-0 pt-0.5">
          <h4
            v-if="item.title"
            class="font-semibold"
            :class="getToastClasses(item.type).title"
          >
            {{ item.title }}
          </h4>
          <p class="text-slate-700 dark:text-slate-300 leading-snug">
            {{ item.message }}
          </p>
        </div>

        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer shrink-0"
          @click="dismiss(item.id)"
          aria-label="Dismiss notification"
        >
          <LucideX class="w-4 h-4" />
        </button>
      </div>
    </transition-group>
  </div>
</template>
