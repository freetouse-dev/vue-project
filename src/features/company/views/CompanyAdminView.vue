<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCompanyStore } from '@/stores/company'
import { companyService } from '../services/companyService'
import type {
  CompanyMember,
  CompanyInvitation,
  CompanyRole,
  WorkspaceAccessRequest,
} from '../types/company.types'
import { useNotification } from '@/composables/useNotification'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import UserAvatar from '@/components/common/UserAvatar.vue'
import {
  LucideUsers,
  LucideMail,
  LucideSettings,
  LucidePlus,
  LucideTrash2,
  LucideCopy,
  LucideCheck,
  LucideArrowLeft,
  LucideLayers,
} from 'lucide-vue-next'

const router = useRouter()
const companyStore = useCompanyStore()
const { success, error: notifyError } = useNotification()

const activeTab = ref<'settings' | 'members' | 'invitations' | 'requests'>('settings')
const activeCompany = computed(() => companyStore.activeCompany)
const isCompanyOwner = computed(() => companyStore.isCompanyOwner)

// Workspace Requests
const workspaceRequests = ref<WorkspaceAccessRequest[]>([])
const isLoadingRequests = ref(false)
const pendingRequestsCount = computed(
  () => workspaceRequests.value.filter((r) => r.status === 'PENDING').length
)

// Settings Form
const companyName = ref('')
const companyDescription = ref('')
const isSavingSettings = ref(false)

// Members
const members = ref<CompanyMember[]>([])
const isLoadingMembers = ref(false)
const showAddMemberModal = ref(false)
const newMemberEmail = ref('')
const newMemberRole = ref<CompanyRole>('MEMBER')
const isAddingMember = ref(false)

// Invitations
const invitations = ref<CompanyInvitation[]>([])
const isLoadingInvitations = ref(false)
const showInviteModal = ref(false)
const inviteEmail = ref('')
const inviteRole = ref<CompanyRole>('MEMBER')
const isSendingInvite = ref(false)
const generatedToken = ref<string | null>(null)
const copiedToken = ref(false)

// Confirm dialog
const showConfirmDialog = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const confirmAction = ref<() => Promise<void>>(() => Promise.resolve())

async function loadCompanyData() {
  if (!activeCompany.value) {
    const list = await companyStore.fetchMyCompanies()
    if (list.length === 0) {
      router.push('/onboarding')
      return
    }
  }

  if (activeCompany.value) {
    companyName.value = activeCompany.value.name
    companyDescription.value = activeCompany.value.description || ''
    await Promise.all([loadMembers(), loadInvitations(), loadWorkspaceRequests()])
  }
}

async function loadMembers() {
  if (!activeCompany.value) return
  isLoadingMembers.value = true
  try {
    members.value = await companyService.getCompanyMembers(activeCompany.value.slug)
  } catch (err: any) {
    notifyError('Failed to load company members.')
  } finally {
    isLoadingMembers.value = false
  }
}

async function loadInvitations() {
  if (!activeCompany.value) return
  isLoadingInvitations.value = true
  try {
    invitations.value = await companyService.getCompanyInvitations(activeCompany.value.slug)
  } catch (err: any) {
    notifyError('Failed to load company invitations.')
  } finally {
    isLoadingInvitations.value = false
  }
}

async function handleSaveSettings() {
  if (!activeCompany.value) return
  isSavingSettings.value = true
  try {
    const updated = await companyService.updateCompany(activeCompany.value.slug, {
      name: companyName.value.trim(),
      description: companyDescription.value.trim() || undefined,
    })
    await companyStore.setActiveCompany(updated)
    success('Company settings updated successfully.')
  } catch (err: any) {
    notifyError(err.response?.data?.detail || 'Failed to update settings.')
  } finally {
    isSavingSettings.value = false
  }
}

async function handleAddMember() {
  if (!activeCompany.value || !newMemberEmail.value.trim()) return
  isAddingMember.value = true
  try {
    await companyService.addCompanyMember(activeCompany.value.slug, {
      email: newMemberEmail.value.trim(),
      role: newMemberRole.value,
    })
    success(`Added ${newMemberEmail.value} to organization.`)
    newMemberEmail.value = ''
    showAddMemberModal.value = false
    await loadMembers()
  } catch (err: any) {
    notifyError(err.response?.data?.detail || 'Failed to add member.')
  } finally {
    isAddingMember.value = false
  }
}

async function handleRoleChange(member: CompanyMember, newRole: CompanyRole) {
  if (!activeCompany.value) return
  try {
    await companyService.updateMemberRole(activeCompany.value.slug, member.user_id, newRole)
    success(`Updated ${member.user?.full_name}'s role to ${newRole}.`)
    await loadMembers()
  } catch (err: any) {
    notifyError(err.response?.data?.detail || 'Failed to update role.')
    await loadMembers()
  }
}

function promptRemoveMember(member: CompanyMember) {
  confirmTitle.value = 'Remove Company Member'
  confirmMessage.value = `Are you sure you want to remove ${member.user?.full_name || member.user?.email} from the organization? They will lose access to all company workspaces.`
  confirmAction.value = async () => {
    if (!activeCompany.value) return
    try {
      await companyService.removeMember(activeCompany.value.slug, member.user_id)
      success('Member removed from company.')
      await loadMembers()
    } catch (err: any) {
      notifyError(err.response?.data?.detail || 'Failed to remove member.')
    }
  }
  showConfirmDialog.value = true
}

async function handleSendInvitation() {
  if (!activeCompany.value || !inviteEmail.value.trim()) return
  isSendingInvite.value = true
  try {
    const inv = await companyService.inviteMember(activeCompany.value.slug, {
      email: inviteEmail.value.trim(),
      role: inviteRole.value,
    })
    generatedToken.value = inv.token || null
    success('Invitation created successfully!')
    inviteEmail.value = ''
    await loadInvitations()
  } catch (err: any) {
    notifyError(err.response?.data?.detail || 'Failed to send invitation.')
  } finally {
    isSendingInvite.value = false
  }
}

function promptRevokeInvitation(inv: CompanyInvitation) {
  confirmTitle.value = 'Revoke Invitation'
  confirmMessage.value = `Are you sure you want to revoke the invitation sent to ${inv.email}?`
  confirmAction.value = async () => {
    if (!activeCompany.value) return
    try {
      await companyService.revokeInvitation(activeCompany.value.slug, inv.id)
      success('Invitation revoked.')
      await loadInvitations()
    } catch (err: any) {
      notifyError(err.response?.data?.detail || 'Failed to revoke invitation.')
    }
  }
  showConfirmDialog.value = true
}

function copyTokenToClipboard(token: string) {
  navigator.clipboard.writeText(token)
  copiedToken.value = true
  setTimeout(() => {
    copiedToken.value = false
  }, 2500)
}

async function loadWorkspaceRequests() {
  if (!activeCompany.value) return
  isLoadingRequests.value = true
  try {
    workspaceRequests.value = await companyService.getWorkspaceRequests(activeCompany.value.slug)
  } catch (err: any) {
    notifyError('Failed to load workspace access requests.')
  } finally {
    isLoadingRequests.value = false
  }
}

function promptApproveRequest(req: WorkspaceAccessRequest) {
  confirmTitle.value = 'Approve Workspace Access Request'
  confirmMessage.value = `Are you sure you want to approve ${req.user?.full_name || req.user?.email}'s request to ${req.request_type === 'CREATE_WORKSPACE' ? 'create workspaces in this organization' : 'join workspace'}?`
  confirmAction.value = async () => {
    if (!activeCompany.value) return
    try {
      await companyService.approveWorkspaceRequest(activeCompany.value.slug, req.id)
      success('Workspace access request approved.')
      await Promise.all([loadWorkspaceRequests(), loadMembers()])
    } catch (err: any) {
      notifyError(err.response?.data?.detail || 'Failed to approve request.')
    }
  }
  showConfirmDialog.value = true
}

function promptRejectRequest(req: WorkspaceAccessRequest) {
  confirmTitle.value = 'Reject Workspace Access Request'
  confirmMessage.value = `Are you sure you want to reject ${req.user?.full_name || req.user?.email}'s request?`
  confirmAction.value = async () => {
    if (!activeCompany.value) return
    try {
      await companyService.rejectWorkspaceRequest(activeCompany.value.slug, req.id)
      success('Workspace access request rejected.')
      await loadWorkspaceRequests()
    } catch (err: any) {
      notifyError(err.response?.data?.detail || 'Failed to reject request.')
    }
  }
  showConfirmDialog.value = true
}

onMounted(() => {
  loadCompanyData()
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
    <!-- Header Back Navigation -->
    <div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
      <div>
        <button
          type="button"
          class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 mb-2 cursor-pointer transition-colors"
          @click="router.push('/dashboard')"
        >
          <LucideArrowLeft class="w-3.5 h-3.5" />
          <span>Back to User Dashboard</span>
        </button>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-extrabold text-base shadow-sm">
            {{ activeCompany?.name.charAt(0).toUpperCase() || 'C' }}
          </div>
          <div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {{ activeCompany?.name || 'Company Administration' }}
            </h1>
            <div class="flex items-center gap-2 mt-0.5">
              <span class="text-xs font-mono text-slate-400">slug: {{ activeCompany?.slug }}</span>
              <span class="text-slate-300 dark:text-slate-700">•</span>
              <span class="text-xs px-2 py-0.5 font-bold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase">
                {{ activeCompany?.my_role?.replace('COMPANY_', '') || 'ADMIN' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="px-3.5 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800 cursor-pointer"
          @click="showInviteModal = true"
        >
          + Invite Member
        </button>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-6">
      <button
        type="button"
        class="py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer"
        :class="activeTab === 'settings'
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'settings'"
      >
        <LucideSettings class="w-4 h-4" />
        <span>General Settings</span>
      </button>

      <button
        type="button"
        class="py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer"
        :class="activeTab === 'members'
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'members'"
      >
        <LucideUsers class="w-4 h-4" />
        <span>Members ({{ members.length }})</span>
      </button>

      <button
        type="button"
        class="py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer"
        :class="activeTab === 'invitations'
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'invitations'"
      >
        <LucideMail class="w-4 h-4" />
        <span>Pending Invitations ({{ invitations.length }})</span>
      </button>

      <button
        type="button"
        class="py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors cursor-pointer"
        :class="activeTab === 'requests'
          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
        @click="activeTab = 'requests'"
      >
        <LucideLayers class="w-4 h-4" />
        <span>Workspace Requests</span>
        <span
          v-if="pendingRequestsCount > 0"
          class="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
        >
          {{ pendingRequestsCount }}
        </span>
      </button>
    </div>

    <!-- TAB 1: General Settings -->
    <div v-if="activeTab === 'settings'" class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm max-w-2xl">
      <h2 class="text-base font-bold text-slate-900 dark:text-white mb-4">
        Organization Profile & Details
      </h2>

      <form @submit.prevent="handleSaveSettings" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Company Name
          </label>
          <input
            v-model="companyName"
            type="text"
            required
            class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            v-model="companyDescription"
            rows="3"
            class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Organization Slug (Immutable Identifier)
          </label>
          <input
            :value="activeCompany?.slug"
            disabled
            type="text"
            class="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs font-mono"
          />
        </div>

        <div class="pt-2">
          <BaseButton
            type="submit"
            variant="primary"
            :loading="isSavingSettings"
          >
            Save Changes
          </BaseButton>
        </div>
      </form>
    </div>

    <!-- TAB 2: Members Management -->
    <div v-else-if="activeTab === 'members'" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Members of this organization can collaborate on workspaces and projects assigned to them.
        </p>
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-800 cursor-pointer"
          @click="showAddMemberModal = true"
        >
          <LucidePlus class="w-3.5 h-3.5" />
          <span>Add Member Directly</span>
        </button>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="py-3 px-4">Member</th>
                <th class="py-3 px-4">Role</th>
                <th class="py-3 px-4">Joined Date</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="m in members" :key="m.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td class="py-3 px-4">
                  <div class="flex items-center gap-3">
                    <UserAvatar
                      :name="m.user?.full_name || 'Member'"
                      :avatar-url="m.user?.avatar_url"
                      size="sm"
                    />
                    <div>
                      <p class="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                        {{ m.user?.full_name || 'Anonymous' }}
                      </p>
                      <p class="text-xs text-slate-400">{{ m.user?.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <select
                    :value="m.role"
                    :disabled="m.role === 'COMPANY_OWNER' && !isCompanyOwner"
                    class="px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-60"
                    @change="handleRoleChange(m, ($event.target as HTMLSelectElement).value as CompanyRole)"
                  >
                    <option value="COMPANY_OWNER">COMPANY OWNER</option>
                    <option value="COMPANY_ADMIN">COMPANY ADMIN</option>
                    <option value="MEMBER">MEMBER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                </td>
                <td class="py-3 px-4 text-xs text-slate-500">
                  {{ new Date(m.joined_at).toLocaleDateString() }}
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    v-if="m.role !== 'COMPANY_OWNER'"
                    type="button"
                    class="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Remove member"
                    @click="promptRemoveMember(m)"
                  >
                    <LucideTrash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: Invitations -->
    <div v-else-if="activeTab === 'invitations'" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Single-use cryptographic invitations. Invitees can use their invitation token on the onboarding screen.
        </p>
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-200 dark:border-indigo-800 cursor-pointer"
          @click="showInviteModal = true"
        >
          <LucidePlus class="w-3.5 h-3.5" />
          <span>New Invitation</span>
        </button>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="py-3 px-4">Invited Email</th>
                <th class="py-3 px-4">Role</th>
                <th class="py-3 px-4">Expires</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              <tr v-for="inv in invitations" :key="inv.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td class="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                  {{ inv.email }}
                </td>
                <td class="py-3 px-4 text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400">
                  {{ inv.role }}
                </td>
                <td class="py-3 px-4 text-xs text-slate-500">
                  {{ new Date(inv.expires_at).toLocaleDateString() }}
                </td>
                <td class="py-3 px-4">
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    {{ inv.status }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <button
                    type="button"
                    class="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Revoke invitation"
                    @click="promptRevokeInvitation(inv)"
                  >
                    <LucideTrash2 class="w-4 h-4" />
                  </button>
                </td>
              </tr>

              <tr v-if="invitations.length === 0">
                <td colspan="5" class="py-6 text-center text-xs text-slate-400">
                  No active pending invitations found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 4: Workspace Requests -->
    <div v-else-if="activeTab === 'requests'" class="space-y-4">
      <div class="flex items-center justify-between">
        <p class="text-xs text-slate-500 dark:text-slate-400">
          Review requests from company members asking for permission to create new workspaces or join existing ones.
        </p>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs sm:text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="py-3 px-4">Requester</th>
                <th class="py-3 px-4">Request Type</th>
                <th class="py-3 px-4">Reason / Notes</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              <tr v-for="req in workspaceRequests" :key="req.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                <td class="py-3 px-4 font-medium">
                  <div class="flex items-center gap-2.5">
                    <UserAvatar
                      :name="req.user?.full_name || req.user?.email || 'User'"
                      :avatar-url="req.user?.avatar_url"
                      size="sm"
                    />
                    <div>
                      <div class="font-bold text-slate-900 dark:text-white">
                        {{ req.user?.full_name || 'Member' }}
                      </div>
                      <div class="text-[11px] text-slate-400 font-mono">
                        {{ req.user?.email }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-4">
                  <span
                    v-if="req.request_type === 'CREATE_WORKSPACE'"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    Create Workspace
                  </span>
                  <span
                    v-else
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                  >
                    Join: {{ req.workspace?.name || 'Workspace' }}
                  </span>
                </td>
                <td class="py-3 px-4 max-w-xs truncate text-xs text-slate-600 dark:text-slate-400">
                  {{ req.reason || req.decision_reason || '—' }}
                </td>
                <td class="py-3 px-4">
                  <span
                    v-if="req.status === 'PENDING'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  >
                    Pending
                  </span>
                  <span
                    v-else-if="req.status === 'APPROVED'"
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  >
                    Approved
                  </span>
                  <span
                    v-else
                    class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  >
                    {{ req.status }}
                  </span>
                </td>
                <td class="py-3 px-4 text-right">
                  <div v-if="req.status === 'PENDING'" class="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      class="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-md transition-colors cursor-pointer"
                      @click="promptApproveRequest(req)"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      class="px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-md transition-colors cursor-pointer"
                      @click="promptRejectRequest(req)"
                    >
                      Reject
                    </button>
                  </div>
                  <span v-else class="text-xs text-slate-400">
                    —
                  </span>
                </td>
              </tr>

              <tr v-if="workspaceRequests.length === 0">
                <td colspan="5" class="py-8 text-center text-xs text-slate-400">
                  No workspace access requests found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal: Add Member Directly -->
    <div
      v-if="showAddMemberModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-3">Add Existing User</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Add an existing registered user directly to your organization.
        </p>

        <form @submit.prevent="handleAddMember" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              User Email Address
            </label>
            <input
              v-model="newMemberEmail"
              type="email"
              required
              placeholder="user@example.com"
              class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Role in Company
            </label>
            <select
              v-model="newMemberRole"
              class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="MEMBER">MEMBER (Standard Collaborator)</option>
              <option value="COMPANY_ADMIN">COMPANY ADMIN (Can manage members & workspaces)</option>
              <option value="VIEWER">VIEWER (Read-only access)</option>
            </select>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              @click="showAddMemberModal = false"
            >
              Cancel
            </button>
            <BaseButton type="submit" variant="primary" :loading="isAddingMember">
              Add Member
            </BaseButton>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Send Invitation -->
    <div
      v-if="showInviteModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6">
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">Invite New Member</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Generate an expiring invitation token that the invitee can use to join your company.
        </p>

        <div v-if="generatedToken" class="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
          <p class="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-2">
            Invitation Token Created!
          </p>
          <div class="flex items-center gap-2">
            <input
              type="text"
              readonly
              :value="generatedToken"
              class="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-800 dark:text-slate-200 select-all"
            />
            <button
              type="button"
              class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
              @click="copyTokenToClipboard(generatedToken)"
            >
              <LucideCheck v-if="copiedToken" class="w-3.5 h-3.5" />
              <LucideCopy v-else class="w-3.5 h-3.5" />
              <span>{{ copiedToken ? 'Copied' : 'Copy' }}</span>
            </button>
          </div>
          <p class="text-[11px] text-emerald-700 dark:text-emerald-400 mt-2">
            Share this token with the invitee to join via the onboarding screen.
          </p>
        </div>

        <form @submit.prevent="handleSendInvitation" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Invitee Email
            </label>
            <input
              v-model="inviteEmail"
              type="email"
              required
              placeholder="teammate@example.com"
              class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Role
            </label>
            <select
              v-model="inviteRole"
              class="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="MEMBER">MEMBER (Standard Collaborator)</option>
              <option value="COMPANY_ADMIN">COMPANY ADMIN (Can manage members & workspaces)</option>
              <option value="VIEWER">VIEWER (Read-only access)</option>
            </select>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              @click="showInviteModal = false; generatedToken = null"
            >
              Close
            </button>
            <BaseButton type="submit" variant="primary" :loading="isSendingInvite">
              Generate Invitation Token
            </BaseButton>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model="showConfirmDialog"
      :title="confirmTitle"
      :message="confirmMessage"
      confirm-text="Proceed"
      variant="danger"
      @confirm="confirmAction"
    />
  </div>
</template>
