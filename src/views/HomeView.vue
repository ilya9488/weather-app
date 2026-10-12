<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { DetectStatus, useBlocksStore } from '@/stores/blocks'
import { MAX_BLOCKS } from '@/constants'
import { getCityName } from '@/utils/city'
import WeatherBlock from '@/components/weather/WeatherBlock.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const { t, locale } = useI18n()
const blocksStore = useBlocksStore()
const { blocks, canAdd, canRemove, detectStatus } = storeToRefs(blocksStore)

const listEl = ref(null)
const addButton = ref(null)
const pendingRemoval = ref(null)

const removalText = computed(() => {
  const city = pendingRemoval.value?.city
  return city
    ? t('confirm.removeText', { city: getCityName(city, locale.value) })
    : t('confirm.removeEmptyText')
})

onMounted(() => blocksStore.detectDefaultCity())

async function addBlock() {
  if (!blocksStore.addBlock()) return
  // Move focus to the new block's city input
  await nextTick()
  const inputs = listEl.value?.querySelectorAll('input[role="combobox"]')
  inputs?.[inputs.length - 1]?.focus()
}

function cancelRemoval() {
  pendingRemoval.value = null
}

async function confirmRemoval() {
  blocksStore.removeBlock(pendingRemoval.value.id)
  pendingRemoval.value = null
  // The focused "remove" button is gone — keep focus in a predictable place
  await nextTick()
  addButton.value?.focus()
}
</script>

<template>
  <section class="home">
    <h1 class="visually-hidden">{{ t('nav.home') }}</h1>

    <div ref="listEl">
      <TransitionGroup tag="div" name="block-list" class="home__blocks">
        <WeatherBlock
          v-for="(block, index) in blocks"
          :key="block.id"
          searchable
          :removable="canRemove"
          :city="block.city"
          :mode="block.mode"
          :detecting="index === 0 && detectStatus === DetectStatus.PENDING"
          :notice="index === 0 && detectStatus === DetectStatus.FAILED ? t('errors.ipDetect') : ''"
          @update:city="blocksStore.setCity(block.id, $event)"
          @update:mode="blocksStore.setMode(block.id, $event)"
          @remove="pendingRemoval = block"
        />
      </TransitionGroup>
    </div>

    <div class="home__add">
      <button
        ref="addButton"
        type="button"
        class="add-block"
        :disabled="!canAdd"
        :aria-describedby="canAdd ? undefined : 'add-block-hint'"
        @click="addBlock"
      >
        <span class="add-block__icon"><AppIcon name="plus" :size="20" /></span>
        <span class="add-block__text">{{ t('block.add') }}</span>
        <span class="add-block__counter">
          {{ t('block.counter', { count: blocks.length, max: MAX_BLOCKS }) }}
        </span>
      </button>
      <p v-if="!canAdd" id="add-block-hint" class="home__hint">
        {{ t('block.limit', { max: MAX_BLOCKS }) }}
      </p>
    </div>

    <BaseModal :open="!!pendingRemoval" :title="t('confirm.removeTitle')" @close="cancelRemoval">
      <p>{{ removalText }}</p>
      <template #footer>
        <button type="button" class="btn btn--ghost" @click="cancelRemoval">
          {{ t('confirm.cancel') }}
        </button>
        <button type="button" class="btn btn--danger" @click="confirmRemoval">
          {{ t('confirm.confirm') }}
        </button>
      </template>
    </BaseModal>
  </section>
</template>

<style scoped>
.home__blocks {
  position: relative;
  display: grid;
  gap: 44px;
}

.home__add {
  margin-top: 44px;
}

.add-block {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 64px;
  padding: 12px 18px;
  border: 1.5px dashed color-mix(in srgb, var(--accent-solid) 45%, transparent);
  border-radius: var(--radius-lg);
  background: var(--surface);
  -webkit-backdrop-filter: var(--blur);
  backdrop-filter: var(--blur);
  color: var(--accent);
  font-size: 16px;
  font-weight: 600;
  text-align: left;
  transition:
    border-color var(--dur) var(--ease),
    background-color var(--dur) var(--ease);
}

.add-block:hover:not(:disabled) {
  border-color: var(--accent-solid);
  background: var(--surface-strong);
}

.add-block:disabled {
  border-color: var(--line);
  color: var(--muted);
}

.add-block__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-tint-strong);
  color: var(--accent);
}

.add-block:disabled .add-block__icon {
  background: var(--fill);
  color: var(--muted);
}

.add-block__counter {
  margin-left: auto;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: var(--fill);
  color: var(--muted);
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.home__hint {
  margin-top: 8px;
  color: var(--muted);
  font-size: 14px;
  text-align: center;
}

/* Add / remove block */
.block-list-enter-active,
.block-list-leave-active {
  transition:
    opacity 220ms var(--ease),
    transform 220ms var(--ease);
}

.block-list-enter-from,
.block-list-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.block-list-leave-active {
  position: absolute;
  width: 100%;
}

.block-list-move {
  transition: transform 220ms var(--ease);
}

@media (max-width: 519px) {
  .home__blocks {
    gap: 36px;
  }

  .home__add {
    margin-top: 36px;
  }
}
</style>
