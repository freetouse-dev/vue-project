<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { formatApiError } from '@/services/apiClient'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import { LucideAlertCircle } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please provide both email and password.'
    return
  }

  isSubmitting.value = true
  try {
    await authStore.login({
      email: email.value,
      password: password.value,
    })

    const redirect = (route.query.redirect as string) || '/workspaces'
    router.push(redirect)
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-4">
    <div class="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-5 sm:p-8 space-y-5 sm:space-y-6">
      <!-- Header -->
      <div class="text-center space-y-2">
        <div class="flex justify-center mb-2">
          <AppLogo size="lg" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900">
          Welcome back
        </h1>
        <p class="text-sm text-slate-500">
          Sign in to your project management workspace
        </p>
      </div>

      <!-- Session Expired Notice -->
      <div
        v-if="route.query.expired"
        class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2"
      >
        <LucideAlertCircle class="w-4 h-4 shrink-0 text-amber-600" />
        <span>Your session has expired. Please log in again.</span>
      </div>

      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-start gap-2.5"
      >
        <LucideAlertCircle class="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
        <span class="leading-snug">{{ errorMessage }}</span>
      </div>

      <!-- Login Form -->
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <BaseInput
          id="email"
          v-model="email"
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          required
        />

        <BaseInput
          id="password"
          v-model="password"
          type="password"
          label="Password"
          placeholder="••••••••"
          required
        />

        <BaseButton
          type="submit"
          class="w-full"
          :loading="isSubmitting"
        >
          Sign In
        </BaseButton>
      </form>

      <!-- Footer -->
      <div class="text-center text-sm text-slate-500">
        Don't have an account?
        <router-link
          to="/register"
          class="font-medium text-indigo-600 hover:text-indigo-500 hover:underline"
        >
          Create one now
        </router-link>
      </div>
    </div>
  </div>
</template>
