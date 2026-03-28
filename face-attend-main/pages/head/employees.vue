<template>
  <div class="space-y-4">
    <div class="card">
      <h1 class="text-xl font-bold">Head · Employees</h1>
      <p class="text-sm text-gray-500">Өз бөліміңіздің қызметкерлері</p>
    </div>

    <div class="card">
      <div v-if="pending" class="text-gray-400">Жүктелуде...</div>
      <div v-else-if="error" class="text-red-500 text-sm">{{ error.message }}</div>
      <div v-else class="space-y-2">
        <div v-for="emp in data || []" :key="emp.id" class="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <div>
            <p class="font-medium">{{ emp.name }}</p>
            <p class="text-xs text-gray-500">ID: {{ emp.id }} · Department: {{ emp.departmentId || '-' }}</p>
          </div>
          <span class="text-xs px-2 py-1 rounded-full" :class="emp.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'">
            {{ emp.isActive ? 'active' : 'inactive' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'head' })

const { data, pending, error } = await useFetch<any[]>('/api/employees')
</script>
