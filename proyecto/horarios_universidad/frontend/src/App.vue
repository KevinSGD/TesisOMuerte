<script setup>
import { RouterView } from 'vue-router'
import AppSidebar from './components/AppSidebar.vue'
</script>

<template>
  <div class="app-shell">
    <AppSidebar />
    <main class="main-content">
      <header class="topbar">
        <h1>Proyecto Horarios Universidad</h1>
      </header>
      <section class="page-content">
        <RouterView />
      </section>
    </main>
  </div>
</template>
