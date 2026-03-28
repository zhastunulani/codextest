<template>
  <div class="space-y-4">
    <div class="card">
      <h1 class="text-xl font-bold">Admin · Employees</h1>
      <p class="text-sm text-gray-500">Барлық қызметкерлерді көру</p>
    </div>

    <div class="card">
      <div v-if="pending" class="text-gray-400">Жүктелуде...</div>
      <div v-else-if="error" class="text-red-500 text-sm">{{ error.message }}</div>
      <div v-else class="space-y-2">
        <div v-for="emp in data || []" :key="emp.id" class="p-3 rounded-lg bg-gray-50">
          <p class="font-medium">{{ emp.name }}</p>
          <p class="text-xs text-gray-500">ID: {{ emp.id }} | Dept: {{ emp.departmentId || '-' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { data, pending, error } = await useFetch<any[]>('/api/employees', { params: { active: 'false' } })
</script>
