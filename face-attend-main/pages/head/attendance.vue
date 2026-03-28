<template>
  <div class="space-y-4">
    <div class="card">
      <h1 class="text-xl font-bold">Head · Attendance</h1>
      <p class="text-sm text-gray-500">Бөлімнің бүгінгі қатысуы</p>
    </div>

    <div class="card">
      <div v-if="pending" class="text-gray-400">Жүктелуде...</div>
      <div v-else-if="error" class="text-red-500 text-sm">{{ error.message }}</div>
      <div v-else>
        <p class="text-sm text-gray-600">Жалпы: {{ data?.stats?.total ?? 0 }}</p>
        <p class="text-sm text-gray-600">Келген: {{ data?.stats?.presentCount ?? 0 }}</p>
        <p class="text-sm text-gray-600">Келмеген: {{ data?.stats?.absentCount ?? 0 }}</p>
        <p class="text-sm text-gray-600">Кешіккен: {{ data?.stats?.lateCount ?? 0 }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'head' })

const { data, pending, error } = await useFetch<any>('/api/attendance/today')
</script>
