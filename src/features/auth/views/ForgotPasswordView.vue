<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/features/auth/services/authService'
import { formatApiError } from '@/services/apiClient'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import AppLogo from '@/components/common/AppLogo.vue'
import {
  LucideAlertCircle,
  LucideCheckCircle2,
  LucideKeyRound,
  LucideArrowLeft,
  LucideShieldCheck,
  LucideLock,
} from 'lucide-vue-next'

const router = useRouter()

// 3 Steps: 1 = Request OTP, 2 = Verify OTP, 3 = New Password
const step = ref<1 | 2 | 3>(1)

const email = ref('')
const otp = ref('')
const resetToken = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const errorMessage = ref('')
const successMessage = ref('')
const isSubmitting = ref(false)

async function handleRequestOtp() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!email.value.trim()) {
    errorMessage.value = 'Please enter your account email address.'
    return
  }

  isSubmitting.value = true
  try {
    const res = await authService.forgotPassword({ email: email.value.trim() })
    successMessage.value = res.message || 'If registered, a password reset code was sent.'
    step.value = 2
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isSubmitting.value = false
  }
}

async function handleVerifyOtp() {
  errorMessage.value = ''
  successMessage.value = ''

  const cleanOtp = otp.value.trim()
  if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    errorMessage.value = 'Please enter a valid 6-digit verification code.'
    return
  }

  isSubmitting.value = true
  try {
    const res = await authService.verifyResetOtp({
      email: email.value.trim(),
      otp: cleanOtp,
    })
    resetToken.value = res.reset_token
    successMessage.value = 'Code verified! Now choose a new password.'
    step.value = 3
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isSubmitting.value = false
  }
}

async function handleResetPassword() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!newPassword.value || newPassword.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long.'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isSubmitting.value = true
  try {
    const res = await authService.resetPassword({
      reset_token: resetToken.value,
      new_password: newPassword.value,
    })
    successMessage.value = res.message || 'Password reset successfully!'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
  } finally {
    isSubmitting.value = false
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
          <LucideKeyRound v-if="step === 1" class="w-6 h-6" />
          <LucideShieldCheck v-else-if="step === 2" class="w-6 h-6" />
          <LucideLock v-else class="w-6 h-6" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          <span v-if="step === 1">Reset Your Password</span>
          <span v-else-if="step === 2">Enter Verification Code</span>
          <span v-else>Choose New Password</span>
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400">
          <span v-if="step === 1">Enter your registered email to receive an authorization code.</span>
          <span v-else-if="step === 2">Enter the 6-digit code sent to {{ email }}.</span>
          <span v-else>Must be at least 8 characters long.</span>
        </p>
      </div>

      <!-- Step Indicator -->
      <div class="flex items-center justify-center gap-2">
        <div
          class="w-8 h-1.5 rounded-full transition-colors"
          :class="step >= 1 ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'"
        ></div>
        <div
          class="w-8 h-1.5 rounded-full transition-colors"
          :class="step >= 2 ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'"
        ></div>
        <div
          class="w-8 h-1.5 rounded-full transition-colors"
          :class="step >= 3 ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-200 dark:bg-slate-700'"
        ></div>
      </div>

      <!-- Notifications -->
      <div
        v-if="successMessage"
        class="p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5"
      >
        <LucideCheckCircle2 class="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
        <span class="leading-snug">{{ successMessage }}</span>
      </div>

      <div
        v-if="errorMessage"
        class="p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-xl text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2.5"
      >
        <LucideAlertCircle class="w-5 h-5 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
        <span class="leading-snug">{{ errorMessage }}</span>
      </div>

      <!-- Step 1: Request OTP -->
      <form v-if="step === 1" class="space-y-4" @submit.prevent="handleRequestOtp">
        <BaseInput
          id="email"
          v-model="email"
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          required
        />

        <BaseButton
          type="submit"
          class="w-full"
          :loading="isSubmitting"
        >
          Send Reset Code
        </BaseButton>
      </form>

      <!-- Step 2: Verify OTP -->
      <form v-else-if="step === 2" class="space-y-4" @submit.prevent="handleVerifyOtp">
        <div>
          <label for="otp" class="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            6-Digit Reset Code
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
          Verify Code
        </BaseButton>

        <div class="text-center">
          <button
            type="button"
            class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            @click="step = 1"
          >
            Wrong email address? Change email
          </button>
        </div>
      </form>

      <!-- Step 3: New Password -->
      <form v-else class="space-y-4" @submit.prevent="handleResetPassword">
        <BaseInput
          id="new-password"
          v-model="newPassword"
          type="password"
          label="New Password"
          placeholder="••••••••"
          hint="Minimum 8 characters"
          required
        />

        <BaseInput
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          label="Confirm New Password"
          placeholder="••••••••"
          required
        />

        <BaseButton
          type="submit"
          class="w-full"
          :loading="isSubmitting"
        >
          Save New Password & Sign In
        </BaseButton>
      </form>

      <!-- Back to Login -->
      <div class="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
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
