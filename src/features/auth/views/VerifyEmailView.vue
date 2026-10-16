<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authService } from '@/features/auth/services/authService'
import { formatApiError } from '@/services/apiClient'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import {
  LucideAlertCircle,
  LucideCheckCircle2,
  LucideMail,
  LucideArrowLeft,
  LucideRefreshCw,
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const email = ref('')
const otp = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)
const isResending = ref(false)

// 60-second resend cooldown timer
const resendCooldown = ref(0)
let timerId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  if (route.query.email && typeof route.query.email === 'string') {
    email.value = route.query.email
  }
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})

function startCooldown() {
  resendCooldown.value = 60
  if (timerId) clearInterval(timerId)
  timerId = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--
    } else if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }, 1000)
}

async function handleVerify() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value.trim()) {
    errorMessage.value = 'Please provide an email address.'
    return
  }

  const cleanOtp = otp.value.trim()
  if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    errorMessage.value = 'Please enter a valid 6-digit verification code.'
    return
  }

  isSubmitting.value = true
  try {
    const res = await authService.verifyEmail({
      email: email.value.trim(),
      otp: cleanOtp,
    })
    successMessage.value = res.message || 'Email verified successfully! You can now sign in.'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isSubmitting.value = false
  }
}

async function handleResend() {
  if (resendCooldown.value > 0 || isResending.value) return
  if (!email.value.trim()) {
    errorMessage.value = 'Please enter your email address to resend code.'
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  isResending.value = true

  try {
    const res = await authService.resendVerificationOtp({
      email: email.value.trim(),
    })
    successMessage.value = res.message || 'A new verification code has been sent to your email.'
    startCooldown()
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isResending.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-3 sm:p-4 transition-colors">
    <div
      class="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-8 space-y-6"
    >
      <!-- Header -->
      <div class="text-center space-y-2">
        <div class="flex justify-center mb-2">
          <AppLogo size="lg" />
        </div>
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 mb-1">
          <LucideMail class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Verify Your Email
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          We sent a 6-digit confirmation code to your inbox.
        </p>
      </div>

      <!-- Success Notification -->
      <div
        v-if="successMessage"
        class="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5"
      >
        <LucideCheckCircle2 class="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
        <span class="leading-snug">{{ successMessage }}</span>
      </div>

      <!-- Error Notification -->
      <div
        v-if="errorMessage"
        class="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2.5"
      >
        <LucideAlertCircle class="w-5 h-5 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
        <span class="leading-snug">{{ errorMessage }}</span>
      </div>

      <!-- Form -->
      <form class="space-y-4" @submit.prevent="handleVerify">
        <BaseInput
          id="email"
          v-model="email"
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          required
        />

        <div>
          <label for="otp" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            6-Digit Verification Code
          </label>
          <input
            id="otp"
            v-model="otp"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="123456"
            required
            class="w-full text-center tracking-widest text-xl font-mono py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 transition-colors"
          />
        </div>

        <BaseButton
          type="submit"
          class="w-full"
          :loading="isSubmitting"
        >
          Confirm & Verify Email
        </BaseButton>
      </form>

      <!-- Resend Code -->
      <div class="pt-2 border-t border-slate-100 dark:border-slate-800 text-center space-y-2">
        <div class="text-sm text-slate-500 dark:text-slate-400">
          Didn't receive the email code?
        </div>
        <button
          type="button"
          class="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 disabled:opacity-50 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          :disabled="resendCooldown > 0 || isResending"
          @click="handleResend"
        >
          <LucideRefreshCw class="w-4 h-4" :class="{ 'animate-spin': isResending }" />
          <span v-if="resendCooldown > 0">Resend code in {{ resendCooldown }}s</span>
          <span v-else-if="isResending">Sending code...</span>
          <span v-else>Resend verification code</span>
        </button>
      </div>

      <!-- Back to Login -->
      <div class="text-center pt-2">
        <router-link
          to="/login"
          class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 inline-flex items-center gap-1"
        >
          <LucideArrowLeft class="w-3.5 h-3.5" />
          Back to Sign In
        </router-link>
      </div>
    </div>
  </div>
</template>
