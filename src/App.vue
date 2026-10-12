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
    <AppTabs class="main__tabs" />
    <RouterView v-slot="{ Component }">
      <!-- Keep tab state (scroll, charts) when switching between tabs -->
      <KeepAlive>
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </main>
</template>

<style scoped>
.main {
  padding-top: 20px;
  padding-bottom: 72px;
}

/* Room for the leaves that peek out of the first block */
.main__tabs {
  margin-bottom: 40px;
}

@media (max-width: 519px) {
  .main {
    padding-top: 14px;
  }

  .main__tabs {
    margin-bottom: 30px;
  }
}
</style>
