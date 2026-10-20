<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'
import NotificationToast from '@/components/common/NotificationToast.vue'

const authStore = useAuthStore()
const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
  authStore.initAuth()
})
</script>

<template>
  <router-view />
  <NotificationToast />
</template>
