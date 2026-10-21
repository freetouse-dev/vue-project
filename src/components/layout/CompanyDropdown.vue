<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCompanyStore } from '@/stores/company'
import type { Company } from '@/features/company/types/company.types'
import {
  LucideChevronDown,
  LucideCheck,
  LucideBriefcase,
  LucidePlus,
  LucideSettings,
} from 'lucide-vue-next'

const router = useRouter()
const companyStore = useCompanyStore()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const companies = computed(() => companyStore.companies)
const activeCompany = computed(() => companyStore.activeCompany)
const isCompanyAdmin = computed(() => companyStore.isCompanyAdmin)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

async function handleSelect(comp: Company) {
  await companyStore.setActiveCompany(comp)
  closeDropdown()
  // Navigate to dashboard or workspaces of new company
  router.push('/dashboard')
}

function navigateToCompanySettings() {
  closeDropdown()
  router.push('/company/admin')
}

function navigateToOnboarding() {
  closeDropdown()
  router.push('/onboarding')
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div ref="dropdownRef" class="relative inline-block text-left min-w-0">
    <!-- Trigger Button -->
    <button
      type="button"
      class="flex items-center gap-1.5 sm:gap-2 bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200 text-xs sm:text-sm font-semibold rounded-lg px-2.5 py-1.5 transition-colors focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer max-w-[135px] xs:max-w-[165px] sm:max-w-[210px]"
      :class="{ 'ring-2 ring-indigo-500 border-indigo-500 bg-white dark:bg-slate-900': isOpen }"
      aria-haspopup="listbox"
      :aria-expanded="isOpen"
      @click="toggleDropdown"
    >
      <LucideBriefcase class="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
      <span class="truncate font-semibold text-slate-800 dark:text-slate-100">
        {{ activeCompany?.name || 'Select Company' }}
      </span>
      <LucideChevronDown
        class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ml-auto"
        :class="{ 'rotate-180 text-indigo-600 dark:text-indigo-400': isOpen }"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div
        v-if="isOpen"
        class="absolute left-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 focus:outline-hidden text-xs sm:text-sm"
        role="listbox"
      >
        <!-- Header -->
        <div class="px-3 py-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/60">
          Your Organizations
        </div>

        <!-- Companies List -->
        <div class="max-h-56 overflow-y-auto py-1">
          <div
            v-for="comp in companies"
            :key="comp.id"
            class="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50"
            :class="{ 'bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300': activeCompany?.id === comp.id }"
            role="option"
            :aria-selected="activeCompany?.id === comp.id"
            @click="handleSelect(comp)"
          >
            <div class="flex items-center gap-2 min-w-0 pr-2">
              <div class="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-xs shrink-0">
                {{ comp.name.charAt(0).toUpperCase() }}
              </div>
              <div class="truncate">
                <p class="font-medium text-slate-800 dark:text-slate-100 truncate text-xs sm:text-sm">
                  {{ comp.name }}
                </p>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                  {{ comp.my_role?.replace('COMPANY_', '') || 'MEMBER' }}
                </p>
              </div>
            </div>

            <LucideCheck
              v-if="activeCompany?.id === comp.id"
              class="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0"
            />
          </div>

          <div v-if="companies.length === 0" class="px-3 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
            No company memberships
          </div>
        </div>

        <!-- Actions Footer -->
        <div class="border-t border-slate-100 dark:border-slate-700/60 pt-1 mt-1 px-1">
          <button
            v-if="isCompanyAdmin"
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
            @click="navigateToCompanySettings"
          >
            <LucideSettings class="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Company Administration</span>
          </button>

          <button
            type="button"
            class="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
            @click="navigateToOnboarding"
          >
            <LucidePlus class="w-3.5 h-3.5" />
            <span>Create / Join Organization</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
