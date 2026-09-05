<script setup lang="ts">
const ping = window.anka.ping()
</script>

<template>
  <main>
    <h1>Anka</h1>
    <p>preload : {{ ping }}</p>
  </main>
</template>
