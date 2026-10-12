<script setup>
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'

/**
 * Modal built on the native <dialog>: focus trap, Esc to close, inert page
 * and focus restore come from the browser.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
})

const emit = defineEmits(['close'])

const { t } = useI18n()
const dialog = ref(null)
const titleId = useId()

function sync(isOpen) {
  const el = dialog.value
  if (!el) return
  if (isOpen && !el.open) el.showModal()
  if (!isOpen && el.open) el.close()
}

watch(() => props.open, sync, { flush: 'post' })
onMounted(() => sync(props.open))

function requestClose() {
  emit('close')
}

/** Click on the backdrop: the target is the <dialog> itself, not its content. */
function onClick(event) {
  if (event.target === dialog.value) requestClose()
}

/** Esc: let the parent decide, keep the state in sync. */
function onCancel(event) {
  event.preventDefault()
  requestClose()
}

onBeforeUnmount(() => {
  if (dialog.value?.open) dialog.value.close()
})
</script>

<template>
  <dialog ref="dialog" class="modal" :aria-labelledby="titleId" @click="onClick" @cancel="onCancel">
    <div class="modal__content">
      <header class="modal__header">
        <h2 :id="titleId" class="modal__title headline">{{ title }}</h2>
        <button type="button" class="icon-btn" :aria-label="t('modal.close')" @click="requestClose">
          <AppIcon name="close" />
        </button>
      </header>
      <div class="modal__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="modal__footer">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped>
.modal {
  width: min(440px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow);
  opacity: 0;
  transform: translateY(8px) scale(0.98);
  transition:
    opacity var(--dur) var(--ease),
    transform var(--dur) var(--ease),
    overlay var(--dur) allow-discrete,
    display var(--dur) allow-discrete;
}

.modal[open] {
  opacity: 1;
  transform: none;
}

@starting-style {
  .modal[open] {
    opacity: 0;
    transform: translateY(8px) scale(0.98);
  }
}

.modal::backdrop {
  background: var(--overlay);
}

.modal__content {
  padding: 24px;
}

.modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.modal__title {
  padding-top: 6px;
  font-size: 22px;
}

.modal__header .icon-btn {
  margin: -4px -8px 0 0;
}

.modal__body {
  color: var(--muted);
}

.modal__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
</style>

<style>
html:has(dialog[open]) {
  overflow: hidden;
}
</style>
