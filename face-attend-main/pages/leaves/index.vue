<template>
  <div class="max-w-5xl mx-auto px-4 py-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Демалыс өтініштері</h1>
        <p class="text-gray-500 mt-1">Демалыс және босату өтініштері</p>
      </div>
      <button class="btn-primary" @click="openCreateModal()">+ Жаңа өтініш</button>
    </div>

    <!-- Filter -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <button
        v-for="f in statusFilters"
        :key="f.value"
        :class="[statusFilter === f.value ? 'btn-primary' : 'btn-secondary']"
        class="text-sm"
        @click="statusFilter = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-400">Жүктелуде...</div>
      <div v-else-if="!filteredLeaves.length" class="text-center py-8 text-gray-400">Өтініштер жоқ</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 text-left">
              <th class="pb-3 font-semibold text-gray-600">Қызметкер</th>
              <th class="pb-3 font-semibold text-gray-600">Түрі</th>
              <th class="pb-3 font-semibold text-gray-600">Басталуы</th>
              <th class="pb-3 font-semibold text-gray-600">Аяқталуы</th>
              <th class="pb-3 font-semibold text-gray-600">Себебі</th>
              <th class="pb-3 font-semibold text-gray-600">Статус</th>
              <th class="pb-3 font-semibold text-gray-600 text-right">Әрекеттер</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="leave in filteredLeaves" :key="leave.id" class="border-b border-gray-100 hover:bg-gray-50">
              <td class="py-3 font-medium">{{ leave.employeeName }}</td>
              <td class="py-3">{{ leaveTypeLabel(leave.type) }}</td>
              <td class="py-3">{{ leave.startDate }}</td>
              <td class="py-3">{{ leave.endDate }}</td>
              <td class="py-3 text-gray-600 max-w-[200px] truncate">{{ leave.reason || '-' }}</td>
              <td class="py-3">
                <span :class="statusBadgeClass(leave.status)" class="text-xs px-2 py-0.5 rounded-full">
                  {{ statusLabel(leave.status) }}
                </span>
              </td>
              <td class="py-3 text-right">
                <template v-if="leave.status === 'pending'">
                  <button class="text-green-600 hover:underline text-sm mr-2" @click="updateStatus(leave.id, 'approved')">
                    Бекіту
                  </button>
                  <button class="text-red-600 hover:underline text-sm" @click="updateStatus(leave.id, 'rejected')">
                    Қабылдамау
                  </button>
                </template>
                <span v-else class="text-gray-400 text-xs">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showModal = false">
      <div class="card w-full max-w-lg mx-4">
        <h3 class="text-lg font-semibold mb-4">Жаңа өтініш</h3>
        <form @submit.prevent="handleCreate" class="space-y-4">
          <div>
            <label class="label">Қызметкер</label>
            <select v-model="form.employeeId" class="input" required>
              <option value="" disabled>Таңдаңыз</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.id">{{ emp.fullName || emp.name }}</option>
            </select>
          </div>
          <div>
            <label class="label">Түрі</label>
            <select v-model="form.type" class="input" required>
              <option value="" disabled>Таңдаңыз</option>
              <option v-for="t in leaveTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Басталуы</label>
              <input v-model="form.startDate" type="date" class="input" required />
            </div>
            <div>
              <label class="label">Аяқталуы</label>
              <input v-model="form.endDate" type="date" class="input" required />
            </div>
          </div>
          <div>
            <label class="label">Себебі</label>
            <textarea v-model="form.reason" class="input" rows="3" placeholder="Себебін жазыңыз..."></textarea>
          </div>
          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn-secondary" @click="showModal = false">Бас тарту</button>
            <button type="submit" class="btn-primary" :disabled="saving">
              {{ saving ? 'Жіберілуде...' : 'Жіберу' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const leaveTypes = [
  { value: 'vacation', label: 'Демалыс' },
  { value: 'sick', label: 'Ауру' },
  { value: 'maternity', label: 'Декрет' },
  { value: 'other', label: 'Басқа' },
]

const statusFilters = [
  { value: 'all', label: 'Барлығы' },
  { value: 'pending', label: 'Күтілуде' },
  { value: 'approved', label: 'Бекітілген' },
  { value: 'rejected', label: 'Қабылданбаған' },
]

const leaveTypeLabel = (type: string) => leaveTypes.find(t => t.value === type)?.label || type

const statusLabel = (status: string) => {
  const map: Record<string, string> = { pending: 'Күтілуде', approved: 'Бекітілген', rejected: 'Қабылданбаған' }
  return map[status] || status
}

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  }
  return map[status] || 'bg-gray-100 text-gray-700'
}

const leaves = ref<any[]>([])
const employees = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const showModal = ref(false)
const statusFilter = ref('all')

const form = reactive({
  employeeId: '' as string | number,
  type: '' as string,
  startDate: '',
  endDate: '',
  reason: '',
})

const filteredLeaves = computed(() => {
  if (statusFilter.value === 'all') return leaves.value
  return leaves.value.filter(l => l.status === statusFilter.value)
})

const fetchData = async () => {
  loading.value = true
  try {
    const [leavesData, empData] = await Promise.all([
      $fetch<any[]>('/api/leaves'),
      $fetch<any[]>('/api/employees'),
    ])
    leaves.value = leavesData
    employees.value = empData
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  form.employeeId = ''
  form.type = ''
  form.startDate = ''
  form.endDate = ''
  form.reason = ''
  showModal.value = true
}

const handleCreate = async () => {
  saving.value = true
  try {
    await $fetch('/api/leaves', {
      method: 'POST',
      body: {
        employeeId: Number(form.employeeId),
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      },
    })
    showModal.value = false
    await fetchData()
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

const updateStatus = async (id: number, status: string) => {
  const label = status === 'approved' ? 'бекітуге' : 'қабылдамауға'
  if (!confirm(`Өтінішті ${label} сенімдісіз бе?`)) return
  try {
    await $fetch(`/api/leaves/${id}`, { method: 'PUT', body: { status } })
    await fetchData()
  } catch (e) {
    console.error(e)
  }
}

fetchData()
</script>
