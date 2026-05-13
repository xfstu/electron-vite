<template>
  <div class="app">

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

window.api.ipc.send('app1/test/test', { a: 1, b: 2, c: 3 })
window.api.ipc.on('ping', (e) => console.log(e))

onMounted(() => {

})
</script>

<style scoped>
.app {
  width: 100%;
}
</style>