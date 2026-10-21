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
const isUnverified = ref(false)
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''
  isUnverified.value = false

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

    const redirect = route.query.redirect as string
    if (redirect) {
      router.push(redirect)
    } else if (authStore.user?.is_superuser) {
      router.push('/admin/overview')
    } else {
      router.push('/dashboard')
    }
  } catch (err: unknown) {
    const msg = formatApiError(err)
    errorMessage.value = msg
    if (msg.toLowerCase().includes('verify') || msg.toLowerCase().includes('verified')) {
      isUnverified.value = true
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-3 sm:p-4 transition-colors">
    <div class="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 space-y-5 sm:space-y-6">
      <!-- Header -->
      <div class="text-center space-y-2">
        <div class="flex justify-center mb-2">
          <AppLogo size="lg" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Sign in to your Unitask workspace
        </p>
      </div>

      <!-- Session Expired Notice -->
      <div
        v-if="route.query.expired"
        class="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2"
      >
        <LucideAlertCircle class="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>Your session has expired. Please log in again.</span>
      </div>

      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg text-sm text-rose-700 dark:text-rose-300 space-y-2"
      >
        <div class="flex items-start gap-2.5">
          <LucideAlertCircle class="w-5 h-5 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
          <span class="leading-snug">{{ errorMessage }}</span>
        </div>
        <div v-if="isUnverified" class="pt-1 pl-7">
          <router-link
            :to="`/verify-email?email=${encodeURIComponent(email.trim())}`"
            class="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
          >
            Verify your email address now &rarr;
          </router-link>
        </div>
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

        <div>
          <div class="flex items-center justify-between mb-1">
            <label for="password" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Password
            </label>
            <router-link
              to="/forgot-password"
              class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline"
            >
              Forgot password?
            </router-link>
          </div>
          <BaseInput
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        <BaseButton
          type="submit"
          class="w-full"
          :loading="isSubmitting"
        >
          Sign In
        </BaseButton>
      </form>

      <!-- Footer -->
      <div class="text-center text-sm text-slate-500 dark:text-slate-400">
        Don't have an account?
        <router-link
          to="/register"
          class="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline"
        >
          Create one now
        </router-link>
      </div>
    </div>
  </div>
</template>
