<template>
  <div class="max-w-6xl mx-auto px-4 py-6 space-y-6">
    <div class="card">
      <h1 class="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      <p class="text-gray-500 mt-1">Жүйелік басқару панелі (skeleton)</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <NuxtLink to="/employees" class="card hover:shadow-md transition-shadow">
        <p class="font-semibold">Қызметкерлер</p>
        <p class="text-sm text-gray-500 mt-1">Барлық қызметкерлерді көру</p>
      </NuxtLink>
      <NuxtLink to="/departments" class="card hover:shadow-md transition-shadow">
        <p class="font-semibold">Бөлімдер</p>
        <p class="text-sm text-gray-500 mt-1">Бөлімдер CRUD</p>
      </NuxtLink>
      <NuxtLink to="/settings" class="card hover:shadow-md transition-shadow">
        <p class="font-semibold">Баптаулар</p>
        <p class="text-sm text-gray-500 mt-1">Жүйелік параметрлер</p>
      </NuxtLink>
    </div>
  </div>
</template>
