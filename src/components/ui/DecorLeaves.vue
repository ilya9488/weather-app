<script setup>
/**
 * Decorative leaves (pure SVG, colors follow the theme).
 * - cluster: three leaves growing from the bottom-left corner of the box,
 *   used peeking out from behind a block's corner;
 * - sprout: a small seedling for empty states.
 */
defineProps({
  variant: {
    type: String,
    default: 'cluster',
    validator: (value) => ['cluster', 'sprout'].includes(value),
  },
})

// One leaf pointing right: base at (0, 0), tip at (60, 0); two halves give volume
const LEAF_TOP = 'M0 0 C 14 -19, 40 -21, 60 0 Z'
const LEAF_BOTTOM = 'M0 0 C 16 17, 42 19, 60 0 Z'
const LEAF_RIB = 'M3 0 Q 30 -1.5 57 0'
const LEAF_VEINS = 'M18 -1 L26 -9 M30 -1 L38 -10 M42 -1 L49 -7 M22 0 L29 7 M34 0 L41 8'

const CLUSTER = [
  { transform: 'translate(30 70) rotate(-38)', top: 'mid', bottom: 'dark' },
  { transform: 'translate(33 67) rotate(-82) scale(0.78)', top: 'light', bottom: 'mid' },
  { transform: 'translate(35 72) rotate(4) scale(0.66)', top: 'light', bottom: 'mid' },
]

const SPROUT = [
  { transform: 'translate(50 58) rotate(-140) scale(0.55)', top: 'mid', bottom: 'dark' },
  { transform: 'translate(50 50) rotate(-35) scale(0.62)', top: 'light', bottom: 'mid' },
]
</script>

<template>
  <svg
    class="leaves"
    viewBox="0 0 100 100"
    aria-hidden="true"
    focusable="false"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      v-if="variant === 'sprout'"
      class="leaves__stem"
      d="M50 92 C 50 78, 49 66, 50 50"
      fill="none"
      stroke-width="3.5"
      stroke-linecap="round"
    />
    <g
      v-for="(leaf, index) in variant === 'sprout' ? SPROUT : CLUSTER"
      :key="index"
      :transform="leaf.transform"
    >
      <path :d="LEAF_TOP" :class="`leaves__${leaf.top}`" />
      <path :d="LEAF_BOTTOM" :class="`leaves__${leaf.bottom}`" />
      <path
        :d="LEAF_RIB"
        class="leaves__vein"
        fill="none"
        stroke-width="1.6"
        stroke-linecap="round"
      />
      <path
        :d="LEAF_VEINS"
        class="leaves__vein"
        fill="none"
        stroke-width="1"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>

<style scoped>
.leaves {
  overflow: visible;
}

.leaves__light {
  fill: var(--leaf-light);
}

.leaves__mid {
  fill: var(--leaf-mid);
}

.leaves__dark {
  fill: var(--leaf-dark);
}

.leaves__vein {
  stroke: var(--leaf-vein);
}

.leaves__stem {
  stroke: var(--leaf-mid);
}
</style>
