import { ref } from 'vue'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface NotificationItem {
  id: string
  type: NotificationType
  title?: string
  message: string
  duration: number
}

const notifications = ref<NotificationItem[]>([])

export function useNotification() {
  function show(
    message: string,
    type: NotificationType = 'info',
    options?: { title?: string; duration?: number }
  ) {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const duration = options?.duration ?? 4000

    const item: NotificationItem = {
      id,
      type,
      title: options?.title,
      message,
      duration,
    }

    notifications.value.push(item)

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }

    return id
  }

  function success(message: string, options?: { title?: string; duration?: number }) {
    return show(message, 'success', options)
  }

  function error(message: string, options?: { title?: string; duration?: number }) {
    return show(message, 'error', options)
  }

  function info(message: string, options?: { title?: string; duration?: number }) {
    return show(message, 'info', options)
  }

  function warning(message: string, options?: { title?: string; duration?: number }) {
    return show(message, 'warning', options)
  }

  function dismiss(id: string) {
    const index = notifications.value.findIndex((n) => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  function clearAll() {
    notifications.value = []
  }

  return {
    notifications,
    show,
    success,
    error,
    info,
    warning,
    dismiss,
    clearAll,
  }
}
