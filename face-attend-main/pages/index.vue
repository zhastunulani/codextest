<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Басты бет</h1>
      <p class="text-gray-500 mt-1">Бүгінгі жалпы статистика</p>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="card text-center">
        <p class="text-3xl font-bold text-green-600">{{ stats?.presentCount ?? '-' }}</p>
        <p class="text-sm text-gray-500 mt-1">Келгендер</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl font-bold text-red-500">{{ stats?.absentCount ?? '-' }}</p>
        <p class="text-sm text-gray-500 mt-1">Келмегендер</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl font-bold text-yellow-500">{{ stats?.lateCount ?? '-' }}</p>
        <p class="text-sm text-gray-500 mt-1">Кешіккендер</p>
      </div>
      <div class="card text-center">
        <p class="text-3xl font-bold text-primary-600">{{ stats?.total ?? '-' }}</p>
        <p class="text-sm text-gray-500 mt-1">Барлығы</p>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <NuxtLink to="/scan" class="card hover:shadow-md transition-shadow flex items-center gap-4">
        <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-2xl">📸</div>
        <div>
          <p class="font-semibold">Сканерлеу</p>
          <p class="text-sm text-gray-500">Check-in / Check-out</p>
        </div>
      </NuxtLink>
      <NuxtLink to="/attendance" class="card hover:shadow-md transition-shadow flex items-center gap-4">
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">📊</div>
        <div>
          <p class="font-semibold">Табель</p>
          <p class="text-sm text-gray-500">Бүгінгі / айлық есеп</p>
        </div>
      </NuxtLink>
      <NuxtLink to="/employees" class="card hover:shadow-md transition-shadow flex items-center gap-4">
        <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">👥</div>
        <div>
          <p class="font-semibold">Қызметкерлер</p>
          <p class="text-sm text-gray-500">Басқару</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Today's list -->
    <div class="card">
      <h2 class="text-lg font-semibold mb-4">Бүгін келгендер</h2>
      <div v-if="!todayData" class="text-center py-8 text-gray-400">Жүктелуде...</div>
      <div v-else-if="todayData.present.length === 0" class="text-center py-8 text-gray-400">Әлі ешкім келген жоқ</div>
      <div v-else class="space-y-2">
        <div v-for="record in todayData.present" :key="record.id"
          class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
              {{ record.employeeName?.charAt(0) }}
            </div>
            <div>
              <p class="font-medium text-sm">{{ record.employeeName }}</p>
              <p class="text-xs text-gray-400">{{ record.checkIn }} — {{ record.checkOut || '...' }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="record.isLate" class="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
              -{{ record.lateMinutes }} мин
            </span>
            <span v-if="record.overtimeMinutes > 0" class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              +{{ record.overtimeMinutes }} мин
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: todayData } = await useFetch('/api/attendance/today')
const stats = computed(() => todayData.value?.stats)
</script>
