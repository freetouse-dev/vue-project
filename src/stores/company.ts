import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { companyService } from '@/features/company/services/companyService'
import type {
  Company,
  CompanyCreationRequest,
} from '@/features/company/types/company.types'
import { useWorkspaceStore } from './workspace'

export const useCompanyStore = defineStore('company', () => {
  const companies = ref<Company[]>([])
  const activeCompany = ref<Company | null>(null)
  const myRequests = ref<CompanyCreationRequest[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  const isCompanyAdmin = computed(() => {
    const role = activeCompany.value?.my_role
    return role === 'COMPANY_OWNER' || role === 'COMPANY_ADMIN'
  })

  const isCompanyOwner = computed(() => {
    return activeCompany.value?.my_role === 'COMPANY_OWNER'
  })

  const canCreateWorkspace = computed(() => {
    return isCompanyOwner.value || isCompanyAdmin.value || Boolean(activeCompany.value?.can_create_workspace)
  })

  /**
   * Fetches all companies current user has active membership in.
   */
  async function fetchMyCompanies(): Promise<Company[]> {
    isLoading.value = true
    error.value = null
    try {
      const data = await companyService.getMyCompanies()
      companies.value = data

      const savedSlug = localStorage.getItem('pm_active_company_slug')
      if (savedSlug) {
        const found = data.find((c) => c.slug === savedSlug)
        if (found) {
          activeCompany.value = found
        } else if (data.length > 0) {
          activeCompany.value = data[0]
          localStorage.setItem('pm_active_company_slug', data[0].slug)
        } else {
          activeCompany.value = null
          localStorage.removeItem('pm_active_company_slug')
        }
      } else if (data.length > 0) {
        activeCompany.value = data[0]
        localStorage.setItem('pm_active_company_slug', data[0].slug)
      } else {
        activeCompany.value = null
        localStorage.removeItem('pm_active_company_slug')
      }

      return data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch companies'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Sets the active tenant company and reloads workspaces
   */
  async function setActiveCompany(companyOrSlug: Company | string) {
    let target: Company | undefined
    if (typeof companyOrSlug === 'string') {
      target = companies.value.find((c) => c.slug === companyOrSlug)
    } else {
      target = companyOrSlug
    }

    if (target) {
      activeCompany.value = target
      localStorage.setItem('pm_active_company_slug', target.slug)

      // Refresh workspaces to align with active company context
      try {
        const workspaceStore = useWorkspaceStore()
        await workspaceStore.fetchWorkspaces()
      } catch {
        // Silently handle if workspaces route changes
      }
    }
  }

  /**
   * Submits a company creation request
   */
  async function submitCreationRequest(payload: {
    company_name: string
    company_slug?: string
    business_description?: string
  }): Promise<CompanyCreationRequest> {
    isLoading.value = true
    try {
      const req = await companyService.submitCreationRequest(payload)
      myRequests.value.unshift(req)
      return req
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetches user's company creation requests
   */
  async function fetchMyRequests(): Promise<CompanyCreationRequest[]> {
    try {
      const list = await companyService.getMyCreationRequests()
      myRequests.value = list
      return list
    } catch {
      return []
    }
  }

  /**
   * Accepts invitation token and updates user company memberships
   */
  async function acceptInvitation(token: string) {
    isLoading.value = true
    try {
      const member = await companyService.acceptInvitation(token)
      await fetchMyCompanies()
      return member
    } finally {
      isLoading.value = false
    }
  }

  return {
    companies,
    activeCompany,
    myRequests,
    isLoading,
    error,
    isCompanyAdmin,
    isCompanyOwner,
    canCreateWorkspace,
    fetchMyCompanies,
    setActiveCompany,
    submitCreationRequest,
    fetchMyRequests,
    acceptInvitation,
  }
})
