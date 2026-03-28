<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <NuxtLink to="/admin/dashboard" class="font-bold text-red-600">Admin Panel</NuxtLink>
        <nav class="flex items-center gap-4 text-sm">
          <NuxtLink to="/admin/dashboard" class="text-gray-600 hover:text-gray-900">Dashboard</NuxtLink>
          <NuxtLink to="/employees" class="text-gray-600 hover:text-gray-900">Employees</NuxtLink>
          <NuxtLink to="/departments" class="text-gray-600 hover:text-gray-900">Departments</NuxtLink>
          <NuxtLink to="/settings" class="text-gray-600 hover:text-gray-900">Settings</NuxtLink>
        </nav>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>
