<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CommentAttachment } from '@/features/tasks/types/comment.types'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import {
  LucideFileText,
  LucideFile,
  LucideDownload,
  LucideTrash2,
  LucideMaximize2,
  LucideX,
} from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    attachments: CommentAttachment[]
    canDelete?: boolean
  }>(),
  {
    canDelete: false,
  }
)

const emit = defineEmits<{
  (e: 'delete', attachmentId: number): void
}>()

const activePreviewAttachment = ref<CommentAttachment | null>(null)
const attachmentToDelete = ref<CommentAttachment | null>(null)
const showDeleteConfirm = ref(false)

const images = computed(() =>
  props.attachments.filter((a) => a.mime_type.startsWith('image/'))
)

const documents = computed(() =>
  props.attachments.filter((a) => !a.mime_type.startsWith('image/'))
)

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getAuthenticatedUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return ''
  const token = localStorage.getItem('pm_access_token')
  const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:8000'
  const origin = apiBase.replace(/\/api\/v1\/?$/, '')
  const fullUrl = pathOrUrl.startsWith('http') || pathOrUrl.startsWith('blob:')
    ? pathOrUrl
    : `${origin}${pathOrUrl}`
  if (!token) return fullUrl
  const sep = fullUrl.includes('?') ? '&' : '?'
  return `${fullUrl}${sep}token=${encodeURIComponent(token)}`
}

function promptDelete(att: CommentAttachment) {
  attachmentToDelete.value = att
  showDeleteConfirm.value = true
}

function confirmDelete() {
  if (attachmentToDelete.value) {
    emit('delete', attachmentToDelete.value.id)
    showDeleteConfirm.value = false
    attachmentToDelete.value = null
  }
}
</script>

<template>
  <div v-if="attachments.length > 0" class="mt-2.5 space-y-2.5">
    <!-- Image Gallery -->
    <div v-if="images.length > 0" class="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <div
        v-for="img in images"
        :key="img.id"
        class="group relative aspect-video sm:aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 cursor-pointer shadow-2xs"
        @click="activePreviewAttachment = img"
      >
        <img
          :src="getAuthenticatedUrl(img.preview_url)"
          :alt="img.original_filename"
          class="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />

        <!-- Hover Overlay -->
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between p-2 text-white">
          <span class="text-[11px] font-medium truncate max-w-[80%] drop-shadow-sm">
            {{ img.original_filename }}
          </span>
          <div class="flex items-center gap-1">
            <button
              v-if="canDelete"
              type="button"
              class="p-1 rounded bg-black/40 hover:bg-rose-600 text-white transition-colors"
              title="Delete attachment"
              @click.stop="promptDelete(img)"
            >
              <LucideTrash2 class="w-3.5 h-3.5" />
            </button>
            <span class="p-1 rounded bg-black/40">
              <LucideMaximize2 class="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Document Attachments List -->
    <div v-if="documents.length > 0" class="space-y-1.5">
      <div
        v-for="doc in documents"
        :key="doc.id"
        class="flex items-center justify-between p-2 sm:p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
      >
        <div class="flex items-center gap-2.5 min-w-0 pr-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <LucideFileText v-if="doc.mime_type.includes('pdf')" class="w-4 h-4" />
            <LucideFile v-else class="w-4 h-4" />
          </div>

          <div class="min-w-0">
            <p class="font-medium text-slate-800 dark:text-slate-200 truncate" :title="doc.original_filename">
              {{ doc.original_filename }}
            </p>
            <span class="text-[10px] text-slate-400 dark:text-slate-500">
              {{ formatFileSize(doc.file_size) }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <a
            :href="getAuthenticatedUrl(doc.download_url)"
            target="_blank"
            download
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <LucideDownload class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">Download</span>
          </a>

          <button
            v-if="canDelete"
            type="button"
            class="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Delete attachment"
            @click="promptDelete(doc)"
          >
            <LucideTrash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>

    <!-- Image Preview Lightbox Modal -->
    <div
      v-if="activePreviewAttachment"
      class="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      @click.self="activePreviewAttachment = null"
    >
      <div class="max-w-4xl w-full max-h-[90vh] flex flex-col items-center space-y-3">
        <div class="w-full flex items-center justify-between text-white px-2">
          <div class="min-w-0 pr-4">
            <p class="font-medium text-sm truncate">{{ activePreviewAttachment.original_filename }}</p>
            <span class="text-xs text-slate-400">{{ formatFileSize(activePreviewAttachment.file_size) }}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <a
              :href="getAuthenticatedUrl(activePreviewAttachment.download_url)"
              target="_blank"
              download
              class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              <LucideDownload class="w-4 h-4" />
              <span>Download</span>
            </a>
            <button
              type="button"
              class="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              @click="activePreviewAttachment = null"
            >
              <LucideX class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="max-h-[80vh] overflow-hidden rounded-xl border border-white/10 shadow-2xl bg-black/40 flex items-center justify-center">
          <img
            :src="getAuthenticatedUrl(activePreviewAttachment.preview_url)"
            :alt="activePreviewAttachment.original_filename"
            class="max-h-[78vh] max-w-full object-contain"
          />
        </div>
      </div>
    </div>

    <!-- Confirm Delete Attachment Dialog -->
    <ConfirmDialog
      v-model="showDeleteConfirm"
      title="Delete Attachment"
      :message="`Are you sure you want to remove &quot;${attachmentToDelete?.original_filename}&quot;? This reference file will be soft-deleted.`"
      confirm-text="Delete Attachment"
      variant="danger"
      @confirm="confirmDelete"
    />
  </div>
</template>
