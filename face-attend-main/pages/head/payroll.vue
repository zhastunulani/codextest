<template>
  <div class="space-y-4">
    <div class="card">
      <h1 class="text-xl font-bold">Head · Payroll</h1>
      <p class="text-sm text-gray-500">Бөлім айлығын есептеу</p>
    </div>

    <div class="card space-y-3">
      <div class="flex gap-2">
        <input v-model.number="month" type="number" min="1" max="12" class="input" placeholder="Ай" />
        <input v-model.number="year" type="number" class="input" placeholder="Жыл" />
        <button class="btn-primary" @click="calculate" :disabled="loading">Есептеу</button>
      </div>
      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
      <div v-if="results.length" class="space-y-2">
        <div v-for="row in results" :key="row.employeeId" class="p-3 rounded-lg bg-gray-50 flex justify-between">
          <span>{{ row.employeeName }}</span>
          <span class="font-semibold">{{ row.totalAmount }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'head' })

const now = new Date()
const month = ref(now.getMonth() + 1)
const year = ref(now.getFullYear())
const loading = ref(false)
const error = ref('')
const results = ref<any[]>([])

const calculate = async () => {
  error.value = ''
  loading.value = true
  try {
    const res = await $fetch<any>('/api/payroll/calculate', {
      method: 'POST',
      body: { month: month.value, year: year.value },
    })
    results.value = res.results || []
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Есептеу кезінде қате'
  } finally {
    loading.value = false
  }
}
</script>
