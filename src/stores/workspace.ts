import { defineStore } from 'pinia'
import { ref } from 'vue'
import { workspaceService } from '@/features/workspaces/services/workspaceService'
import type {
  Workspace,
  WorkspaceCreatePayload,
} from '@/features/workspaces/types/workspace.types'

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<Workspace[]>([])
  const currentWorkspace = ref<Workspace | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  /**
   * Fetches the user's workspaces
   */
  async function fetchWorkspaces() {
    isLoading.value = true
    error.value = null
    try {
      const data = await workspaceService.getWorkspaces()
      workspaces.value = data
      // If current workspace is not set, set it to the first one if available
      if (!currentWorkspace.value && data.length > 0) {
        currentWorkspace.value = data[0]
      }
      return data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch workspaces'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Sets current active workspace by slug
   */
  async function selectWorkspaceBySlug(slug: string) {
    // Check if already in cache
    const existing = workspaces.value.find((w) => w.slug === slug)
    if (existing) {
      currentWorkspace.value = existing
      return existing
    }

    isLoading.value = true
    try {
      const ws = await workspaceService.getWorkspace(slug)
      currentWorkspace.value = ws
      return ws
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Creates a new workspace and updates state
   */
  async function createWorkspace(payload: WorkspaceCreatePayload) {
    isLoading.value = true
    try {
      const newWs = await workspaceService.createWorkspace(payload)
      workspaces.value.unshift(newWs)
      currentWorkspace.value = newWs
      return newWs
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Resets workspace state (e.g. on logout)
   */
  function reset() {
    workspaces.value = []
    currentWorkspace.value = null
    error.value = null
  }

  return {
    workspaces,
    currentWorkspace,
    isLoading,
    error,
    fetchWorkspaces,
    selectWorkspaceBySlug,
    createWorkspace,
    reset,
  }
})
