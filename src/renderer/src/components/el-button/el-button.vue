<template>
  <ELementButton v-bind="omit(attrs, 'onClick')" @click="handleClick" :loading="mergedLoading" v-if="hasSlotContent">
    <slot></slot>
  </ELementButton>
  <ELementButton v-bind="omit(attrs, 'onClick')" @click="handleClick" :loading="mergedLoading" v-else></ELementButton>
</template>

<script setup lang="ts">
import { computed, ref, useAttrs, useSlots, watch } from 'vue'
import { ElButton as ELementButton } from 'element-plus'

defineOptions({
  inheritAttrs: false
})

const loading = ref(false)
const attrs = useAttrs()
const slots = useSlots()
const props = withDefaults(defineProps<{
  loading?: boolean
}>(), {
  loading: undefined
})

const hasSlotContent = computed(() => {
  return !!slots.default
})

const mergedLoading = computed(() => {
  // 外部优先
  if (props.loading !== undefined) {
    if (typeof props.loading === 'boolean') {
      return props.loading
    }
  }
  return loading.value
})


function omit<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  const clone = { ...obj }
  keys.forEach((key) => delete clone[key])
  return clone
}

async function handleClick() {
  loading.value = true
  try {
    await (attrs.onClick as (() => any) | undefined)?.()
  } finally {
    loading.value = false
  }
}
</script>
