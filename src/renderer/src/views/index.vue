<template>
  <div class="index">
    <el-button type="success" @click="test">测试</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

async function test() {
  await new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, 1000)
  })
}


onMounted(() => {

})
</script>

<style scoped>
.index {}
</style>