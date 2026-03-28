<template>
  <div class="space-y-4">
    <div class="card">
      <h1 class="text-xl font-bold">Head · KPI</h1>
      <p class="text-sm text-gray-500">Бөлім KPI мақсаттары мен нәтижелері</p>
    </div>

    <div class="card">
      <div v-if="pending" class="text-gray-400">Жүктелуде...</div>
      <div v-else-if="error" class="text-red-500 text-sm">{{ error.message }}</div>
      <div v-else class="space-y-2">
        <div v-for="t in targets || []" :key="t.id" class="p-3 rounded-lg bg-gray-50">
          <p class="font-medium">{{ t.metric }}: {{ t.targetValue }}</p>
          <p class="text-xs text-gray-500">{{ t.period }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'head' })

const { data: targets, pending, error } = await useFetch<any[]>('/api/kpi/targets')
</script>
