<template>
  <div class="max-w-6xl mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">KPI</h1>
      <p class="text-gray-500 mt-1">Бөлімдер бойынша тиімділік көрсеткіштері</p>
    </div>

    <!-- Period selector -->
    <div class="flex flex-col sm:flex-row sm:items-end gap-4 mb-6">
      <div>
        <label class="label">Кезең</label>
        <input v-model="selectedPeriod" type="month" class="input w-auto" />
      </div>
      <button class="btn-primary" @click="fetchResults">Көру</button>
      <button class="btn-secondary" @click="showTargetModal = true">+ KPI мақсаты</button>
    </div>

    <!-- Results -->
    <div v-if="loading" class="text-center py-12 text-gray-400">Жүктелуде...</div>
    <div v-else-if="!results.length" class="card text-center py-12 text-gray-400">
      Деректер жоқ. Кезеңді таңдап, "Көру" батырмасын басыңыз.
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="dept in results" :key="dept.departmentId" class="card">
        <h3 class="text-lg font-semibold mb-4">{{ dept.departmentName }}</h3>

        <!-- Attendance Rate -->
        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-600">Келу деңгейі</span>
            <span :class="isTargetMet(dept.attendanceRate, dept.targetAttendanceRate) ? 'text-green-600' : 'text-red-600'" class="font-medium">
              {{ dept.attendanceRate ?? 0 }}% / {{ dept.targetAttendanceRate ?? 100 }}%
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div
              class="h-3 rounded-full transition-all"
              :class="isTargetMet(dept.attendanceRate, dept.targetAttendanceRate) ? 'bg-green-500' : 'bg-red-500'"
              :style="{ width: Math.min(100, dept.attendanceRate ?? 0) + '%' }"
            ></div>
          </div>
        </div>

        <!-- Avg Overtime -->
        <div class="mb-4">
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-600">Орташа үстеме (сағ.)</span>
            <span class="font-medium text-gray-800">{{ dept.avgOvertime ?? 0 }}</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div
              class="h-3 rounded-full bg-blue-500 transition-all"
              :style="{ width: Math.min(100, ((dept.avgOvertime ?? 0) / Math.max(dept.targetMaxOvertime ?? 40, 1)) * 100) + '%' }"
            ></div>
          </div>
        </div>

        <!-- Late Count -->
        <div>
          <div class="flex justify-between text-sm mb-1">
            <span class="text-gray-600">Кешіккендер саны</span>
            <span :class="isLateTargetMet(dept.lateCount, dept.targetMaxLate) ? 'text-green-600' : 'text-red-600'" class="font-medium">
              {{ dept.lateCount ?? 0 }} / {{ dept.targetMaxLate ?? 0 }} макс
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div
              class="h-3 rounded-full transition-all"
              :class="isLateTargetMet(dept.lateCount, dept.targetMaxLate) ? 'bg-green-500' : 'bg-red-500'"
              :style="{ width: Math.min(100, ((dept.lateCount ?? 0) / Math.max(dept.targetMaxLate ?? 1, 1)) * 100) + '%' }"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Target Modal -->
    <div v-if="showTargetModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showTargetModal = false">
      <div class="card w-full max-w-md mx-4">
        <h3 class="text-lg font-semibold mb-4">KPI мақсатын қосу</h3>
        <form @submit.prevent="handleAddTarget" class="space-y-4">
          <div>
            <label class="label">Бөлім</label>
            <select v-model="targetForm.departmentId" class="input" required>
              <option value="" disabled>Таңдаңыз</option>
              <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Кезең</label>
            <input v-model="targetForm.period" type="month" class="input" required />
          </div>
          <div>
            <label class="label">Келу деңгейі мақсаты (%)</label>
            <input v-model.number="targetForm.targetAttendanceRate" type="number" class="input" min="0" max="100" required />
          </div>
          <div>
            <label class="label">Макс. кешігу саны</label>
            <input v-model.number="targetForm.targetMaxLate" type="number" class="input" min="0" required />
          </div>
          <div>
            <label class="label">Макс. үстеме сағаты</label>
            <input v-model.number="targetForm.targetMaxOvertime" type="number" class="input" min="0" required />
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn-secondary" @click="showTargetModal = false">Бас тарту</button>
            <button type="submit" class="btn-primary" :disabled="savingTarget">
              {{ savingTarget ? 'Сақталуда...' : 'Сақтау' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const now = new Date()
const selectedPeriod = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

const results = ref<any[]>([])
const departments = ref<any[]>([])
const loading = ref(false)
const showTargetModal = ref(false)
const savingTarget = ref(false)

const targetForm = reactive({
  departmentId: '' as string | number,
  period: selectedPeriod.value,
  targetAttendanceRate: 95,
  targetMaxLate: 5,
  targetMaxOvertime: 40,
})

const isTargetMet = (actual: number | null, target: number | null) => {
  return (actual ?? 0) >= (target ?? 100)
}

const isLateTargetMet = (actual: number | null, target: number | null) => {
  return (actual ?? 0) <= (target ?? 0)
}

const fetchResults = async () => {
  loading.value = true
  try {
    const data = await $fetch<any>(`/api/kpi/results/${selectedPeriod.value}`)
    results.value = data.results || data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const fetchDepartments = async () => {
  try {
    departments.value = await $fetch<any[]>('/api/departments')
  } catch (e) {
    console.error(e)
  }
}

const handleAddTarget = async () => {
  savingTarget.value = true
  try {
    await $fetch('/api/kpi/targets', {
      method: 'POST',
      body: {
        departmentId: Number(targetForm.departmentId),
        period: targetForm.period,
        targetAttendanceRate: targetForm.targetAttendanceRate,
        targetMaxLate: targetForm.targetMaxLate,
        targetMaxOvertime: targetForm.targetMaxOvertime,
      },
    })
    showTargetModal.value = false
    await fetchResults()
  } catch (e) {
    console.error(e)
  } finally {
    savingTarget.value = false
  }
}

fetchDepartments()
</script>
