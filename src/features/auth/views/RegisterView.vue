<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { formatApiError } from '@/services/apiClient'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import { LucideAlertCircle } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''

  if (!fullName.value || !email.value || !password.value) {
    errorMessage.value = 'Please fill in all required fields.'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isSubmitting.value = true
  try {
    // 1. Register user
    await authStore.register({
      email: email.value,
      full_name: fullName.value,
      password: password.value,
    })

    // 2. Redirect to verification view where OTP code is entered
    router.push(`/verify-email?email=${encodeURIComponent(email.value.trim())}`)
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
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
          Create an Account
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          Get started with your collaborative workspace
        </p>
      </div>

      <!-- Error Alert -->
      <div
        v-if="errorMessage"
        class="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-lg text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2.5"
      >
        <LucideAlertCircle class="w-5 h-5 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
        <span class="leading-snug">{{ errorMessage }}</span>
      </div>

      <!-- Registration Form -->
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <BaseInput
          id="full_name"
          v-model="fullName"
          label="Full Name"
          placeholder="Jane Doe"
          required
        />

        <BaseInput
          id="email"
          v-model="email"
          type="email"
          label="Email Address"
          placeholder="jane@example.com"
          required
        />

        <BaseInput
          id="password"
          v-model="password"
          type="password"
          label="Password"
          placeholder="At least 6 characters"
          hint="Minimum 6 characters"
          required
        />

        <BaseInput
          id="confirm_password"
          v-model="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="••••••••"
          required
        />

        <BaseButton
          type="submit"
          class="w-full"
          :loading="isSubmitting"
        >
          Create Account
        </BaseButton>
      </form>

      <!-- Footer -->
      <div class="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?
        <router-link
          to="/login"
          class="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 hover:underline"
        >
          Sign in
        </router-link>
      </div>
    </div>
  </div>
</template>
