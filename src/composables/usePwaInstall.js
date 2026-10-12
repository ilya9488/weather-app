import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

/** iPhone / iPad (iPadOS reports itself as a Mac with touch). */
function isIos() {
  const { userAgent, platform, maxTouchPoints } = window.navigator
  return /iphone|ipad|ipod/i.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

/**
 * "Install the app":
 * - Android / desktop Chrome and Edge: the browser's own install prompt (beforeinstallprompt);
 * - iOS: there is no prompt API, the user adds the app via Share → Add to Home Screen,
 *   so we only show how to do it.
 */
export function usePwaInstall() {
  const deferredPrompt = ref(null)
  const installed = ref(isStandalone())
  const ios = isIos()

  const canPrompt = computed(() => !!deferredPrompt.value)
  const showIosHint = computed(() => ios && !installed.value)
  const available = computed(() => !installed.value && (canPrompt.value || showIosHint.value))

  function onBeforeInstallPrompt(event) {
    event.preventDefault()
    deferredPrompt.value = event
  }

  function onInstalled() {
    installed.value = true
    deferredPrompt.value = null
  }

  async function prompt() {
    const event = deferredPrompt.value
    if (!event) return
    deferredPrompt.value = null
    await event.prompt()
  }

  onMounted(() => {
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onInstalled)
  })

  return { available, canPrompt, showIosHint, prompt }
}
