<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCompanyStore } from '@/stores/company'
import { useNotification } from '@/composables/useNotification'
import AppLogo from '@/components/common/AppLogo.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import {
  LucideBuilding2,
  LucideMailCheck,
  LucideClock,
  LucideCheckCircle2,
  LucideXCircle,
  LucideArrowRight,
  LucideLogOut,
  LucideSparkles,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const companyStore = useCompanyStore()
const { success, error: notifyError } = useNotification()

const activeTab = ref<'request' | 'join'>('request')

// Create Request Form
const companyName = ref('')
const companySlug = ref('')
const businessDescription = ref('')
const isSubmittingRequest = ref(false)

// Accept Invite Form
const invitationToken = ref('')
const isAcceptingInvite = ref(false)

const user = computed(() => authStore.user)
const myRequests = computed(() => companyStore.myRequests)

function autoSlug() {
  if (!companySlug.value || companySlug.value === slugify(companyName.value.slice(0, -1))) {
    companySlug.value = slugify(companyName.value)
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function handleCreateRequest() {
  if (!companyName.value.trim()) {
    notifyError('Please provide an organization name.')
    return
  }

  isSubmittingRequest.value = true
  try {
    await companyStore.submitCreationRequest({
      company_name: companyName.value.trim(),
      company_slug: companySlug.value.trim() || undefined,
      business_description: businessDescription.value.trim() || undefined,
    })
    success('Your organization request has been submitted for platform administrator review!')
    companyName.value = ''
    companySlug.value = ''
    businessDescription.value = ''
  } catch (err: any) {
    notifyError(err.response?.data?.detail || 'Failed to submit request.')
  } finally {
    isSubmittingRequest.value = false
  }
}

async function handleAcceptInvite() {
  if (!invitationToken.value.trim()) {
    notifyError('Please enter your invitation token.')
    return
  }

  isAcceptingInvite.value = true
  try {
    await companyStore.acceptInvitation(invitationToken.value.trim())
    success('Invitation accepted! Welcome to your new organization.')
    router.push('/dashboard')
  } catch (err: any) {
    notifyError(err.response?.data?.detail || 'Invalid or expired invitation token.')
  } finally {
    isAcceptingInvite.value = false
  }
}

async function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  await companyStore.fetchMyRequests()
  const myComps = await companyStore.fetchMyCompanies()
  if (myComps.length > 0) {
    // Already has active company membership
    router.push('/dashboard')
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
    <!-- Onboarding Topbar -->
    <header class="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
      <div class="flex items-center gap-3">
        <AppLogo size="md" />
        <span class="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">Unitask</span>
        <span class="text-xs px-2 py-0.5 font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          Organization Setup
        </span>
      </div>

      <div class="flex items-center gap-3">
        <ThemeToggle />
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
          @click="handleLogout"
        >
          <LucideLogOut class="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center">
      <!-- Welcome Hero -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm border border-indigo-200 dark:border-indigo-800">
          <LucideSparkles class="w-7 h-7" />
        </div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Welcome to Unitask, {{ user?.full_name || 'Collaborator' }}!
        </h1>
        <p class="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-xl mx-auto">
          You are registered, but do not belong to an active organization yet. Choose an option below to set up your multi-tenant workspace experience.
        </p>
      </div>

      <!-- Action Tabs -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
        <!-- Tab Navigation -->
        <div class="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            class="py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            :class="activeTab === 'request'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            @click="activeTab = 'request'"
          >
            <LucideBuilding2 class="w-4 h-4" />
            <span>Request New Organization</span>
          </button>

          <button
            type="button"
            class="py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            :class="activeTab === 'join'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
            @click="activeTab = 'join'"
          >
            <LucideMailCheck class="w-4 h-4" />
            <span>Accept Organization Invitation</span>
          </button>
        </div>

        <!-- Tab 1: Request New Company -->
        <div v-if="activeTab === 'request'" class="p-6 sm:p-8">
          <form @submit.prevent="handleCreateRequest" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organization Name <span class="text-red-500">*</span>
              </label>
              <input
                v-model="companyName"
                type="text"
                required
                placeholder="e.g. Acme Corporation"
                class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                @input="autoSlug"
              />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Organization Slug (Identifier)
              </label>
              <input
                v-model="companySlug"
                type="text"
                placeholder="e.g. acme-corporation"
                class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              />
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Used in multi-tenant contexts and header identification. Lowercase alphanumeric with hyphens.
              </p>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Business Purpose / Description
              </label>
              <textarea
                v-model="businessDescription"
                rows="3"
                placeholder="Briefly describe what your company does and your use case for Unitask..."
                class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              ></textarea>
            </div>

            <div class="pt-2">
              <button
                type="submit"
                :disabled="isSubmittingRequest"
                class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{{ isSubmittingRequest ? 'Submitting Request...' : 'Submit Organization Request' }}</span>
                <LucideArrowRight class="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        <!-- Tab 2: Accept Invitation -->
        <div v-else class="p-6 sm:p-8">
          <form @submit.prevent="handleAcceptInvite" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Invitation Token <span class="text-red-500">*</span>
              </label>
              <input
                v-model="invitationToken"
                type="text"
                required
                placeholder="Paste the invitation token provided by your company admin"
                class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
              />
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Invitations are single-use, cryptographically verified tokens linked to your account.
              </p>
            </div>

            <div class="pt-2">
              <button
                type="submit"
                :disabled="isAcceptingInvite"
                class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{{ isAcceptingInvite ? 'Joining Organization...' : 'Join Organization' }}</span>
                <LucideArrowRight class="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Submitted Requests Tracking -->
      <div v-if="myRequests.length > 0" class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h3 class="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <LucideClock class="w-4 h-4 text-indigo-500" />
          <span>Your Organization Creation Requests</span>
        </h3>

        <div class="divide-y divide-slate-100 dark:divide-slate-800">
          <div
            v-for="req in myRequests"
            :key="req.id"
            class="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800 dark:text-slate-100 text-sm">{{ req.company_name }}</span>
                <span class="text-xs text-slate-400 font-mono">({{ req.company_slug }})</span>
              </div>
              <p v-if="req.business_description" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {{ req.business_description }}
              </p>
              <p v-if="req.rejection_reason" class="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                Reason: {{ req.rejection_reason }}
              </p>
            </div>

            <div class="flex items-center gap-2 shrink-0">
              <span
                v-if="req.status === 'PENDING'"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              >
                <LucideClock class="w-3 h-3" />
                <span>Pending Review</span>
              </span>

              <span
                v-else-if="req.status === 'APPROVED'"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              >
                <LucideCheckCircle2 class="w-3 h-3" />
                <span>Approved</span>
              </span>

              <span
                v-else
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
              >
                <LucideXCircle class="w-3 h-3" />
                <span>Rejected</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
