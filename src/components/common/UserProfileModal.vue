<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authService } from '@/features/auth/services/authService'
import { useNotification } from '@/composables/useNotification'
import { formatApiError } from '@/services/apiClient'
import UserAvatar from '@/components/common/UserAvatar.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import {
  LucideX,
  LucideCamera,
  LucideTrash2,
  LucideShield,
  LucideCheckCircle2,
  LucideUpload,
} from 'lucide-vue-next'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const authStore = useAuthStore()
const notify = useNotification()

const user = computed(() => authStore.user)

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const isUploading = ref(false)
const isRemoving = ref(false)
const showRemoveConfirm = ref(false)
const errorMessage = ref('')

function close() {
  clearSelectedFile()
  emit('update:modelValue', false)
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  processSelectedFile(file)
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return
  processSelectedFile(event.dataTransfer.files[0])
}

function processSelectedFile(file: File) {
  errorMessage.value = ''
  // 5MB limit check
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Profile picture must be under 5MB.'
    return
  }

  // Allowed image type check
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    errorMessage.value = 'Only JPEG, PNG, WebP, or GIF images are allowed.'
    return
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function clearSelectedFile() {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  selectedFile.value = null
  previewUrl.value = null
  errorMessage.value = ''
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

async function handleSaveAvatar() {
  if (!selectedFile.value) return
  isUploading.value = true
  errorMessage.value = ''
  try {
    const updatedUser = await authService.uploadAvatar(selectedFile.value)
    // Add cache-busting timestamp to refresh immediately
    if (updatedUser.avatar_url) {
      updatedUser.avatar_url = `${updatedUser.avatar_url}?t=${Date.now()}`
    }
    authStore.user = updatedUser
    notify.success('Profile picture updated successfully')
    clearSelectedFile()
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
    notify.error(errorMessage.value)
  } finally {
    isUploading.value = false
  }
}

async function confirmRemoveAvatar() {
  isRemoving.value = true
  errorMessage.value = ''
  try {
    const updatedUser = await authService.removeAvatar()
    authStore.user = updatedUser
    notify.success('Profile picture removed')
    showRemoveConfirm.value = false
    clearSelectedFile()
  } catch (err: unknown) {
    errorMessage.value = formatApiError(err)
    notify.error(errorMessage.value)
  } finally {
    isRemoving.value = false
  }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div
    v-if="modelValue && user"
    class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    role="dialog"
    aria-modal="true"
    @click.self="close"
  >
    <div
      class="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-all space-y-5"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 class="text-base font-bold text-slate-900 dark:text-white">User Profile</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">View and update your personal account details</p>
        </div>
        <button
          type="button"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
          @click="close"
        >
          <LucideX class="w-5 h-5" />
        </button>
      </div>

      <!-- Avatar Section with Live Preview & Drag-and-Drop -->
      <div
        class="flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center space-y-3"
        @dragover.prevent
        @drop.prevent="handleDrop"
      >
        <div class="relative group">
          <!-- UserAvatar or Local Preview -->
          <UserAvatar
            :user="user"
            :avatar-url="previewUrl || user.avatar_url"
            size="xl"
            class="shadow-md"
          />

          <!-- Overlay Camera Button -->
          <button
            type="button"
            class="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
            title="Change photo"
            @click="triggerFileInput"
          >
            <LucideCamera class="w-6 h-6" />
          </button>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="hidden"
          @change="handleFileSelect"
        />

        <!-- Staged File Actions -->
        <div v-if="selectedFile" class="space-y-2 w-full pt-1">
          <p class="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate px-4">
            New image selected: {{ selectedFile.name }}
          </p>
          <div class="flex items-center justify-center gap-2">
            <BaseButton
              size="sm"
              variant="outline"
              :disabled="isUploading"
              @click="clearSelectedFile"
            >
              Cancel
            </BaseButton>
            <BaseButton
              size="sm"
              :loading="isUploading"
              @click="handleSaveAvatar"
            >
              <LucideUpload class="w-3.5 h-3.5 mr-1" />
              Save Photo
            </BaseButton>
          </div>
        </div>

        <!-- Default Avatar Actions -->
        <div v-else class="flex items-center gap-2 pt-1">
          <BaseButton
            size="sm"
            variant="outline"
            @click="triggerFileInput"
          >
            <LucideCamera class="w-3.5 h-3.5 mr-1" />
            <span>Upload Photo</span>
          </BaseButton>

          <BaseButton
            v-if="user.avatar_url"
            size="sm"
            variant="outline"
            class="hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-300 dark:hover:border-rose-800 text-rose-600 dark:text-rose-400"
            @click="showRemoveConfirm = true"
          >
            <LucideTrash2 class="w-3.5 h-3.5 mr-1" />
            <span>Remove</span>
          </BaseButton>
        </div>

        <p class="text-[11px] text-slate-400 dark:text-slate-500">
          JPEG, PNG, WebP or GIF up to 5MB.
        </p>
      </div>

      <!-- Error message -->
      <div
        v-if="errorMessage"
        class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300"
      >
        {{ errorMessage }}
      </div>

      <!-- User Details Card -->
      <div class="space-y-3">
        <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">Full Name</span>
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ user.full_name }}</p>
          </div>
          <span
            v-if="user.is_superuser"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 uppercase font-mono"
          >
            <LucideShield class="w-3 h-3" />
            Superuser
          </span>
        </div>

        <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span class="text-xs text-slate-400 dark:text-slate-500 font-medium">Email Address</span>
            <p class="text-xs font-mono font-medium text-slate-700 dark:text-slate-300 mt-0.5">{{ user.email }}</p>
          </div>
          <span
            v-if="user.is_verified"
            class="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium"
          >
            <LucideCheckCircle2 class="w-3.5 h-3.5" />
            Verified
          </span>
        </div>

        <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span class="text-slate-400 dark:text-slate-500">Member Since</span>
          <span class="font-medium text-slate-700 dark:text-slate-300">{{ formatDate(user.created_at) }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <BaseButton size="sm" variant="outline" @click="close">
          Close
        </BaseButton>
      </div>
    </div>

    <!-- Confirm Remove Avatar Dialog -->
    <ConfirmDialog
      v-model="showRemoveConfirm"
      title="Remove Profile Picture"
      message="Are you sure you want to remove your profile picture? Your initials will be displayed instead."
      confirm-text="Remove Photo"
      variant="danger"
      :loading="isRemoving"
      @confirm="confirmRemoveAvatar"
    />
  </div>
</template>
