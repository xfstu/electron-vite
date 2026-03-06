<template>
  <div class="app">

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

window.api.ipc('app1/test/test', { a: 1, b: 2 }, 123)


onMounted(() => {

})
</script>

<style scoped>
.app {
  width: 100%;
}
</style>