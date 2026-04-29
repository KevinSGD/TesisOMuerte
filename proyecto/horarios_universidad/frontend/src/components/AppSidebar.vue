<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const expanded = ref(true)

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/scheduler', label: 'Generar Horario' },
]
</script>

<template>
  <aside class="sidebar" :class="{ collapsed: !expanded }">
    <div class="sidebar-header">
      <div class="brand">TesisOMuerte</div>
      <button class="ghost-btn" @click="expanded = !expanded">{{ expanded ? '◀' : '▶' }}</button>
    </div>

    <nav class="nav-links">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="nav-link"
        :class="{ active: route.path === link.to }"
      >
        {{ link.label }}
      </RouterLink>
    </nav>
  </aside>
</template>
