<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Табель</h1>
      <p class="text-gray-500 mt-1">Қызметкерлердің келу-кету есебі</p>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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

    <!-- Tabs -->
    <div class="flex gap-2 mb-6">
      <button
        :class="[activeTab === 'today' ? 'btn-primary' : 'btn-secondary']"
        @click="activeTab = 'today'"
      >
        Бүгін
      </button>
      <button
        :class="[activeTab === 'monthly' ? 'btn-primary' : 'btn-secondary']"
        @click="activeTab = 'monthly'"
      >
        Айлық
      </button>
    </div>

    <!-- Today tab -->
    <div v-if="activeTab === 'today'" class="card">
      <h2 class="text-lg font-semibold mb-4">Бүгінгі есеп</h2>
      <div v-if="loadingToday" class="text-center py-8 text-gray-400">Жүктелуде...</div>
      <div v-else-if="!todayRecords.length" class="text-center py-8 text-gray-400">Деректер жоқ</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 text-left">
              <th class="pb-3 font-semibold text-gray-600">Қызметкер</th>
              <th class="pb-3 font-semibold text-gray-600">Келу</th>
              <th class="pb-3 font-semibold text-gray-600">Кету</th>
              <th class="pb-3 font-semibold text-gray-600">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in todayRecords" :key="record.id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
                    {{ record.employeeName?.charAt(0) }}
                  </div>
                  <span class="font-medium">{{ record.employeeName }}</span>
                </div>
              </td>
              <td class="py-3">{{ record.checkIn || '-' }}</td>
              <td class="py-3">{{ record.checkOut || '-' }}</td>
              <td class="py-3">
                <span v-if="record.isLate" class="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">
                  Кешікті {{ record.lateMinutes }} мин
                </span>
                <span v-else-if="record.checkIn" class="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                  Уақытында
                </span>
                <span v-else class="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                  Келмеді
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Monthly tab -->
    <div v-if="activeTab === 'monthly'" class="card">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 class="text-lg font-semibold">Айлық есеп</h2>
        <div class="flex items-center gap-2">
          <input v-model="selectedMonth" type="month" class="input w-auto" @change="fetchMonthly" />
          <button class="btn-secondary text-sm" @click="exportCSV">CSV</button>
          <button class="btn-primary text-sm" @click="exportExcel">Excel</button>
        </div>
      </div>

      <div v-if="loadingMonthly" class="text-center py-8 text-gray-400">Жүктелуде...</div>
      <div v-else-if="!monthlyRecords.length" class="text-center py-8 text-gray-400">Деректер жоқ</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 text-left">
              <th class="pb-3 font-semibold text-gray-600">Қызметкер</th>
              <th class="pb-3 font-semibold text-gray-600">Жұмыс күндері</th>
              <th class="pb-3 font-semibold text-gray-600">Кешіккен</th>
              <th class="pb-3 font-semibold text-gray-600">Келмеген</th>
              <th class="pb-3 font-semibold text-gray-600">Жұмыс сағаты</th>
              <th class="pb-3 font-semibold text-gray-600">Үстеме сағат</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in monthlyRecords" :key="record.employeeId" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 font-medium">{{ record.employeeName }}</td>
              <td class="py-3">{{ record.workDays }}</td>
              <td class="py-3">
                <span v-if="record.lateDays > 0" class="text-yellow-600">{{ record.lateDays }}</span>
                <span v-else>0</span>
              </td>
              <td class="py-3">
                <span v-if="record.absentDays > 0" class="text-red-600">{{ record.absentDays }}</span>
                <span v-else>0</span>
              </td>
              <td class="py-3">{{ record.totalHours }}</td>
              <td class="py-3">{{ record.overtimeHours }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const activeTab = ref<'today' | 'monthly'>('today')

const now = new Date()
const selectedMonth = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

const loadingToday = ref(true)
const todayRecords = ref<any[]>([])
const stats = ref<any>(null)

const loadingMonthly = ref(false)
const monthlyRecords = ref<any[]>([])

const fetchToday = async () => {
  loadingToday.value = true
  try {
    const data = await $fetch<any>('/api/attendance/today')
    todayRecords.value = [...(data.present || []), ...(data.absent || [])]
    stats.value = data.stats
  } catch (e) {
    console.error('Бүгінгі деректерді жүктеу қатесі:', e)
  } finally {
    loadingToday.value = false
  }
}

const fetchMonthly = async () => {
  loadingMonthly.value = true
  try {
    const [year, month] = selectedMonth.value.split('-')
    const data = await $fetch<any>(`/api/attendance/month/${year}/${month}`)
    monthlyRecords.value = data.records || data || []
  } catch (e) {
    console.error('Айлық деректерді жүктеу қатесі:', e)
  } finally {
    loadingMonthly.value = false
  }
}

const exportCSV = () => {
  if (!monthlyRecords.value.length) return
  const headers = ['Қызметкер', 'Жұмыс күндері', 'Кешіккен', 'Келмеген', 'Жұмыс сағаты', 'Үстеме сағат']
  const rows = monthlyRecords.value.map(r => [
    r.employeeName, r.workDays, r.lateDays, r.absentDays, r.totalHours, r.overtimeHours
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `attendance_${selectedMonth.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const exportExcel = () => {
  const [year, month] = selectedMonth.value.split('-')
  window.open(`/api/attendance/export-excel?year=${year}&month=${month}`, '_blank')
}

watch(activeTab, (tab) => {
  if (tab === 'monthly' && !monthlyRecords.value.length) fetchMonthly()
})

fetchToday()
</script>
