<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Жалақы есебі</h1>
      <p class="text-gray-500 mt-1">Ай сайынғы жалақы есептеу</p>
    </div>

    <!-- Controls -->
    <div class="card mb-6">
      <div class="flex flex-col sm:flex-row sm:items-end gap-4">
        <div>
          <label class="label">Ай</label>
          <select v-model="selectedMonth" class="input w-auto">
            <option v-for="m in 12" :key="m" :value="m">{{ monthNames[m - 1] }}</option>
          </select>
        </div>
        <div>
          <label class="label">Жыл</label>
          <select v-model="selectedYear" class="input w-auto">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div class="flex gap-2">
          <button class="btn-secondary" @click="fetchHistory">Көру</button>
          <button class="btn-primary" :disabled="calculating" @click="calculate">
            {{ calculating ? 'Есептелуде...' : 'Есептеу' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-400">Жүктелуде...</div>
      <div v-else-if="!records.length" class="text-center py-8 text-gray-400">
        Деректер жоқ. "Есептеу" батырмасын басыңыз.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 text-left">
              <th class="pb-3 font-semibold text-gray-600">Қызметкер</th>
              <th class="pb-3 font-semibold text-gray-600 text-right">Жұмыс күн</th>
              <th class="pb-3 font-semibold text-gray-600 text-right">Жұмыс сағ.</th>
              <th class="pb-3 font-semibold text-gray-600 text-right">Үстеме сағ.</th>
              <th class="pb-3 font-semibold text-gray-600 text-right">Негізгі</th>
              <th class="pb-3 font-semibold text-gray-600 text-right">Үстеме</th>
              <th class="pb-3 font-semibold text-gray-600 text-right">Жиыны</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in records" :key="r.employeeId" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 font-medium">{{ r.employeeName }}</td>
              <td class="py-3 text-right">{{ r.workDays }}</td>
              <td class="py-3 text-right">{{ r.workHours }}</td>
              <td class="py-3 text-right">{{ r.overtimeHours }}</td>
              <td class="py-3 text-right">{{ formatKZT(r.baseAmount) }}</td>
              <td class="py-3 text-right">{{ formatKZT(r.overtimeAmount) }}</td>
              <td class="py-3 text-right font-semibold">{{ formatKZT(r.total) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t-2 border-gray-300">
              <td class="py-3 font-bold">Барлығы</td>
              <td class="py-3 text-right font-bold">{{ totals.workDays }}</td>
              <td class="py-3 text-right font-bold">{{ totals.workHours }}</td>
              <td class="py-3 text-right font-bold">{{ totals.overtimeHours }}</td>
              <td class="py-3 text-right font-bold">{{ formatKZT(totals.baseAmount) }}</td>
              <td class="py-3 text-right font-bold">{{ formatKZT(totals.overtimeAmount) }}</td>
              <td class="py-3 text-right font-bold text-primary-600">{{ formatKZT(totals.total) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const monthNames = [
  'Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым',
  'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан',
]

const now = new Date()
const selectedMonth = ref(now.getMonth() + 1)
const selectedYear = ref(now.getFullYear())
const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i)

const records = ref<any[]>([])
const loading = ref(false)
const calculating = ref(false)

const formatKZT = (amount: number | null | undefined) => {
  if (amount == null) return '0 ₸'
  return new Intl.NumberFormat('ru-KZ', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' ₸'
}

const totals = computed(() => {
  return records.value.reduce(
    (acc, r) => ({
      workDays: acc.workDays + (r.workDays || 0),
      workHours: acc.workHours + (r.workHours || 0),
      overtimeHours: acc.overtimeHours + (r.overtimeHours || 0),
      baseAmount: acc.baseAmount + (r.baseAmount || 0),
      overtimeAmount: acc.overtimeAmount + (r.overtimeAmount || 0),
      total: acc.total + (r.total || 0),
    }),
    { workDays: 0, workHours: 0, overtimeHours: 0, baseAmount: 0, overtimeAmount: 0, total: 0 }
  )
})

const fetchHistory = async () => {
  loading.value = true
  try {
    const data = await $fetch<any>('/api/payroll/history', {
      params: { month: selectedMonth.value, year: selectedYear.value },
    })
    records.value = data.records || data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const calculate = async () => {
  calculating.value = true
  try {
    const data = await $fetch<any>('/api/payroll/calculate', {
      method: 'POST',
      body: { month: selectedMonth.value, year: selectedYear.value },
    })
    records.value = data.records || data || []
  } catch (e) {
    console.error(e)
  } finally {
    calculating.value = false
  }
}
</script>
