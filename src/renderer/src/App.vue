<script setup lang="ts">
/**
 * App.vue — Root component (Light mode only)
 */
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import bgImage from './assets/bg-aquaponics.webp'

const route = useRoute()

import { computed } from 'vue'
const titleComputed = computed(() => {
  return (route.meta?.title as string) || 'Dashboard'
})

// === Bottom Navigation Toggle ===
const showSidebar = ref(true)

function toggleSidebar(): void {
  showSidebar.value = !showSidebar.value
}
</script>

<template>
  <div class="relative h-screen w-screen overflow-hidden transition-colors duration-500 text-slate-800">
    <!-- Immersive Fullscreen Background -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${bgImage})` }"
    >
      <div class="absolute inset-0 bg-white/60 backdrop-blur-sm"></div>
    </div>

    <!-- Main Layout (over background) -->
    <div class="relative z-10 flex flex-col h-full w-full">
      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <!-- Header -->
        <Header>
          <template #title>{{ titleComputed }}</template>
        </Header>

        <!-- Page Content with transition -->
        <main class="flex-1 overflow-hidden pb-4 relative">
          <router-view v-slot="{ Component }">
            <transition name="page" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
          
          <!-- Floating Toggle Sidebar Button -->
          <button
            @click="toggleSidebar"
            class="absolute bottom-4 right-6 z-[60] w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border backdrop-blur-md"
            :class="showSidebar ? 'bg-white/80 text-slate-400 border-slate-200 hover:bg-white hover:text-slate-600' : 'bg-teal-500/20 text-teal-600 border-teal-300 shadow-md hover:bg-teal-500/30'"
            :title="showSidebar ? 'Sembunyikan Navigasi' : 'Tampilkan Navigasi'"
          >
            <svg v-if="showSidebar" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9l6 6 6-6"/>
            </svg>
            <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 15l-6-6-6 6"/>
            </svg>
          </button>
        </main>
      </div>

      <!-- Bottom Nav -->
      <transition name="sidebar">
        <Sidebar v-show="showSidebar" class="z-50 shrink-0" />
      </transition>
    </div>

    <!-- Ambient glow -->
    <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-teal-400/5 animate-pulse-slow pointer-events-none"></div>
    <div class="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl bg-cyan-400/5 animate-pulse-slow pointer-events-none" style="animation-delay: 1s;"></div>
  </div>
</template>
