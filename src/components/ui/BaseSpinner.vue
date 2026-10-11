<script setup>
defineProps({
  size: { type: Number, default: 24 },
  label: { type: String, default: '' },
})
</script>

<template>
  <span class="spinner" :role="label ? 'status' : undefined">
    <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle class="spinner__track" cx="12" cy="12" r="9" fill="none" stroke-width="3" />
      <circle
        class="spinner__arc"
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke-width="3"
        stroke-linecap="round"
        stroke-dasharray="42 100"
      />
    </svg>
    <span v-if="label" class="spinner__label">{{ label }}</span>
  </span>
</template>

<style scoped>
.spinner {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
}

.spinner svg {
  animation: spin 0.9s linear infinite;
}

.spinner__track {
  stroke: var(--line);
}

.spinner__arc {
  stroke: var(--accent);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner svg {
    animation-duration: 2.4s !important;
    animation-iteration-count: infinite !important;
  }
}
</style>
