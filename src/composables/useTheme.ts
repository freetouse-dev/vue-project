import { ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'pm_theme'

// Shared singleton state
const theme = ref<ThemeMode>('system')
const isDark = ref(false)
let isInitialized = false

function getSystemPreference(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(mode: ThemeMode) {
  theme.value = mode

  let shouldBeDark = false
  if (mode === 'dark') {
    shouldBeDark = true
  } else if (mode === 'light') {
    shouldBeDark = false
  } else {
    shouldBeDark = getSystemPreference()
  }

  isDark.value = shouldBeDark

  if (typeof document !== 'undefined') {
    const root = document.documentElement
    if (shouldBeDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    // Also set color-scheme style for browser scrollbars and native controls
    root.style.colorScheme = shouldBeDark ? 'dark' : 'light'
  }
}

export function useTheme() {
  function initTheme() {
    if (isInitialized || typeof window === 'undefined') return
    isInitialized = true

    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
    if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
      theme.value = saved
    } else {
      theme.value = 'system'
    }

    applyTheme(theme.value)

    // Listen for OS theme changes when in 'system' mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'system') {
        applyTheme('system')
      }
    })
  }

  function setTheme(mode: ThemeMode) {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
    applyTheme(mode)
  }

  function toggleTheme() {
    if (theme.value === 'light') {
      setTheme('dark')
    } else if (theme.value === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  return {
    theme,
    isDark,
    initTheme,
    setTheme,
    toggleTheme,
  }
}
