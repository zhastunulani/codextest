<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Desktop top nav -->
    <nav class="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center gap-2">
            <NuxtLink to="/" class="text-xl font-bold text-primary-600">FaceAttend</NuxtLink>
          </div>
          <div class="flex items-center gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="isActive(item.path) ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100'"
            >
              {{ item.label }}
            </NuxtLink>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600">{{ user?.name }}</span>
            <span class="text-xs px-2 py-1 rounded-full"
              :class="{
                'bg-red-100 text-red-700': user?.role === 'admin',
                'bg-blue-100 text-blue-700': user?.role === 'head',
                'bg-green-100 text-green-700': user?.role === 'manager',
              }">
              {{ roleLabel }}
            </span>
            <button @click="logout" class="text-sm text-gray-500 hover:text-red-600 transition-colors">
              Шығу
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <main class="pb-20 md:pb-6">
      <slot />
    </main>

    <!-- Mobile bottom nav -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div class="flex justify-around">
        <NuxtLink
          v-for="item in mobileNavItems"
          :key="item.path"
          :to="item.path"
          class="flex flex-col items-center py-2 px-3 text-xs transition-colors"
          :class="isActive(item.path) ? 'text-primary-600' : 'text-gray-500'"
        >
          <span class="text-lg mb-0.5">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { user, logout } = useAuth()

const roleLabel = computed(() => {
  const labels: Record<string, string> = { admin: 'Админ', head: 'Басшы', manager: 'Менеджер' }
  return user.value ? labels[user.value.role] || user.value.role : ''
})

const navItems = computed(() => {
  const items = [
    { path: '/', label: 'Басты бет' },
    { path: '/scan', label: 'Сканерлеу' },
    { path: '/attendance', label: 'Табель' },
    { path: '/employees', label: 'Қызметкерлер' },
  ]
  if (user.value?.role === 'admin') {
    items.push(
      { path: '/departments', label: 'Бөлімдер' },
      { path: '/schedules', label: 'Кестелер' },
      { path: '/leaves', label: 'Демалыс' },
      { path: '/payroll', label: 'Айлық' },
      { path: '/kpi', label: 'KPI' },
      { path: '/settings', label: 'Баптау' },
    )
  } else if (user.value?.role === 'head') {
    items.push(
      { path: '/leaves', label: 'Демалыс' },
      { path: '/kpi', label: 'KPI' },
    )
  }
  return items
})

const mobileNavItems = computed(() => [
  { path: '/', label: 'Басты', icon: '🏠' },
  { path: '/scan', label: 'Скан', icon: '📸' },
  { path: '/attendance', label: 'Табель', icon: '📊' },
  { path: '/employees', label: 'Жұмыскер', icon: '👥' },
  { path: '/settings', label: 'Ещё', icon: '⚙️' },
])

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
