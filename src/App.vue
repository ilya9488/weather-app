<script setup>
import { watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '@/stores/settings'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppTabs from '@/components/layout/AppTabs.vue'

// Applies the saved language and theme to the document
useSettingsStore()

const { t } = useI18n()
watchEffect(() => {
  document.title = t('app.title')
})
</script>

<template>
  <AppHeader />
  <main class="container main">
    <AppTabs />
    <div class="panel">
      <RouterView v-slot="{ Component }">
        <!-- Keep tab state (scroll, charts) when switching between tabs -->
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </div>
  </main>
</template>

<style scoped>
.main {
  padding-bottom: 48px;
}

.panel {
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-2);
}

@media (max-width: 519px) {
  .main {
    padding-inline: 8px;
  }

  .panel {
    padding: 10px;
    border-radius: var(--radius-md);
  }
}
</style>
