<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Қызметкерлер</h1>
        <p class="text-gray-500 mt-1">Барлығы: {{ filteredEmployees.length }}</p>
      </div>
      <button v-if="isAdmin || isHead" @click="openCreateModal" class="btn-primary flex items-center gap-2 self-start">
        <span class="text-lg leading-none">+</span>
        Қосу
      </button>
    </div>

    <!-- Search & Filters -->
    <div class="card mb-6">
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="flex-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Аты бойынша іздеу..."
            class="input"
          />
        </div>
        <div class="sm:w-48">
          <select v-model="filterDepartment" class="input">
            <option :value="null">Барлық бөлімдер</option>
            <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
          </select>
        </div>
        <div class="sm:w-40">
          <select v-model="filterStatus" class="input">
            <option value="all">Барлық статус</option>
            <option value="active">Белсенді</option>
            <option value="inactive">Белсенді емес</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loadingEmployees" class="text-center py-12 text-gray-400">Жүктелуде...</div>

    <!-- Empty state -->
    <div v-else-if="filteredEmployees.length === 0" class="text-center py-12 text-gray-400">
      <p class="text-4xl mb-2">👥</p>
      <p>Қызметкер табылмады</p>
    </div>

    <!-- Desktop Table -->
    <div v-else class="hidden md:block card overflow-hidden !p-0">
      <table class="w-full">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Қызметкер</th>
            <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Бөлім</th>
            <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Лауазым</th>
            <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Кесте</th>
            <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Айлық</th>
            <th class="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Статус</th>
            <th class="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Әрекет</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="emp in filteredEmployees" :key="emp.id" class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <img
                    v-if="emp.photoPath"
                    :src="emp.photoPath"
                    :alt="emp.name"
                    class="w-10 h-10 rounded-full object-cover"
                  />
                  <div v-else class="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
                    {{ emp.name?.charAt(0) }}
                  </div>
                  <span
                    v-if="hasFace(emp)"
                    class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
                    title="Face descriptor бар"
                  >
                    <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
                  </span>
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ emp.name }}</p>
                  <p v-if="!hasFace(emp)" class="text-xs text-orange-500">Face descriptor жоқ</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ getDeptName(emp.departmentId) }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ getPositionName(emp.positionId) }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ getScheduleName(emp.scheduleId) }}</td>
            <td class="px-6 py-4 text-sm text-gray-600">{{ formatSalary(emp.salaryRate) }}</td>
            <td class="px-6 py-4">
              <span
                class="text-xs px-2.5 py-1 rounded-full font-medium"
                :class="emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
              >
                {{ emp.isActive ? 'Белсенді' : 'Белсенді емес' }}
              </span>
            </td>
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <button
                  v-if="isAdmin || isHead"
                  @click="openEditModal(emp)"
                  class="text-sm text-primary-600 hover:text-primary-800 font-medium"
                >
                  Өзгерту
                </button>
                <button
                  v-if="isAdmin"
                  @click="confirmDelete(emp)"
                  class="text-sm text-red-500 hover:text-red-700 font-medium"
                >
                  Жою
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="md:hidden space-y-3">
      <div
        v-for="emp in filteredEmployees"
        :key="emp.id"
        class="card"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="relative">
              <img
                v-if="emp.photoPath"
                :src="emp.photoPath"
                :alt="emp.name"
                class="w-12 h-12 rounded-full object-cover"
              />
              <div v-else class="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-lg font-bold text-primary-600">
                {{ emp.name?.charAt(0) }}
              </div>
              <span
                v-if="hasFace(emp)"
                class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
              >
                <svg class="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
              </span>
            </div>
            <div>
              <p class="font-semibold text-gray-900">{{ emp.name }}</p>
              <p class="text-sm text-gray-500">{{ getPositionName(emp.positionId) }}</p>
            </div>
          </div>
          <span
            class="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
            :class="emp.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
          >
            {{ emp.isActive ? 'Белсенді' : 'Белсенді емес' }}
          </span>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-gray-400">Бөлім:</span>
            <span class="ml-1 text-gray-700">{{ getDeptName(emp.departmentId) }}</span>
          </div>
          <div>
            <span class="text-gray-400">Кесте:</span>
            <span class="ml-1 text-gray-700">{{ getScheduleName(emp.scheduleId) }}</span>
          </div>
          <div>
            <span class="text-gray-400">Айлық:</span>
            <span class="ml-1 text-gray-700">{{ formatSalary(emp.salaryRate) }}</span>
          </div>
          <div>
            <span class="text-gray-400">Face:</span>
            <span class="ml-1" :class="hasFace(emp) ? 'text-green-600' : 'text-orange-500'">
              {{ hasFace(emp) ? 'Бар' : 'Жоқ' }}
            </span>
          </div>
        </div>

        <div v-if="isAdmin || isHead" class="mt-3 pt-3 border-t border-gray-100 flex gap-3">
          <button @click="openEditModal(emp)" class="text-sm text-primary-600 hover:text-primary-800 font-medium">
            Өзгерту
          </button>
          <button v-if="isAdmin" @click="confirmDelete(emp)" class="text-sm text-red-500 hover:text-red-700 font-medium">
            Жою
          </button>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="closeModal" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900">
              {{ editingEmployee ? 'Қызметкерді өзгерту' : 'Жаңа қызметкер' }}
            </h2>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          <form @submit.prevent="saveEmployee" class="p-6 space-y-4">
            <!-- Name -->
            <div>
              <label class="label">Аты-жөні *</label>
              <input v-model="form.name" type="text" class="input" required placeholder="Толық аты" />
            </div>

            <!-- Department -->
            <div>
              <label class="label">Бөлім</label>
              <select v-model="form.departmentId" class="input">
                <option :value="null">-- Таңдау --</option>
                <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
              </select>
            </div>

            <!-- Position -->
            <div>
              <label class="label">Лауазым</label>
              <select v-model="form.positionId" class="input">
                <option :value="null">-- Таңдау --</option>
                <option v-for="pos in filteredPositions" :key="pos.id" :value="pos.id">{{ pos.name }}</option>
              </select>
            </div>

            <!-- Schedule -->
            <div>
              <label class="label">Жұмыс кестесі</label>
              <select v-model="form.scheduleId" class="input">
                <option :value="null">-- Таңдау --</option>
                <option v-for="sch in schedules" :key="sch.id" :value="sch.id">
                  {{ sch.name }} ({{ sch.workStart }}-{{ sch.workEnd }})
                </option>
              </select>
            </div>

            <!-- Salary -->
            <div>
              <label class="label">Айлық ставка (KZT)</label>
              <input v-model.number="form.salaryRate" type="number" class="input" min="0" step="1000" placeholder="0" />
            </div>

            <!-- Photo -->
            <div>
              <label class="label">Фото</label>

              <!-- Current photo preview -->
              <div v-if="photoPreview" class="mb-3 relative inline-block">
                <img :src="photoPreview" class="w-32 h-32 rounded-xl object-cover border border-gray-200" />
                <button
                  type="button"
                  @click="clearPhoto"
                  class="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >&times;</button>
              </div>

              <!-- Camera & Upload buttons -->
              <div v-if="!cameraActive" class="flex gap-2">
                <button type="button" @click="startCamera" class="btn-secondary text-sm flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>
                  Камера
                </button>
                <label class="btn-secondary text-sm flex items-center gap-1 cursor-pointer">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  Файл жүктеу
                  <input type="file" accept="image/*" class="hidden" @change="onFileUpload" />
                </label>
              </div>

              <!-- Camera view -->
              <div v-if="cameraActive" class="space-y-2">
                <div class="relative rounded-xl overflow-hidden border border-gray-200 bg-black">
                  <video ref="videoRef" autoplay playsinline class="w-full" />
                </div>
                <div class="flex gap-2">
                  <button type="button" @click="capturePhoto" class="btn-primary text-sm">Суретке түсіру</button>
                  <button type="button" @click="stopCamera" class="btn-secondary text-sm">Болдырмау</button>
                </div>
              </div>
              <canvas ref="canvasRef" class="hidden" />

              <!-- Face descriptor status -->
              <div v-if="form.faceDescriptor" class="mt-2 text-sm text-green-600 flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Face descriptor алынды (128 dim)
              </div>
              <div v-if="faceError" class="mt-2 text-sm text-red-500">{{ faceError }}</div>
              <div v-if="faceLoading" class="mt-2 text-sm text-gray-500">Face descriptor алынуда...</div>
            </div>

            <!-- Actions -->
            <div class="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button type="button" @click="closeModal" class="btn-secondary">Болдырмау</button>
              <button type="submit" :disabled="saving" class="btn-primary">
                {{ saving ? 'Сақталуда...' : (editingEmployee ? 'Сақтау' : 'Қосу') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50" @click="showDeleteModal = false" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 p-6">
          <div class="text-center">
            <div class="w-14 h-14 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg class="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-2">Қызметкерді жою</h3>
            <p class="text-gray-500 mb-6">
              <span class="font-medium text-gray-700">{{ deletingEmployee?.name }}</span> қызметкерін жоюға сенімдісіз бе?
              Бұл әрекетті кейін қалпына келтіруге болады.
            </p>
            <div class="flex gap-3 justify-center">
              <button @click="showDeleteModal = false" class="btn-secondary">Болдырмау</button>
              <button @click="deleteEmployee" :disabled="deleting" class="btn-danger">
                {{ deleting ? 'Жойылуда...' : 'Жою' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

let faceapi: any = null

const { isAdmin, isHead } = useAuth()

// ==================== Data fetching ====================

interface Employee {
  id: number
  name: string
  departmentId: number | null
  positionId: number | null
  photoPath: string | null
  scheduleId: number | null
  salaryRate: number
  vacationDaysLeft: number
  isActive: boolean
  createdAt: string
}

interface Department { id: number; name: string }
interface Position { id: number; name: string; departmentId: number | null }
interface Schedule { id: number; name: string; type: string; workStart: string; workEnd: string; workDays: string }

const loadingEmployees = ref(true)
const employees = ref<Employee[]>([])
const departments = ref<Department[]>([])
const positions = ref<Position[]>([])
const schedules = ref<Schedule[]>([])

const fetchEmployees = async () => {
  try {
    loadingEmployees.value = true
    employees.value = await $fetch<Employee[]>('/api/employees', { query: { active: 'false' } })
  } catch (e: any) {
    console.error('Failed to load employees:', e)
  } finally {
    loadingEmployees.value = false
  }
}

const fetchDropdowns = async () => {
  const [depts, poss, schs] = await Promise.all([
    $fetch<Department[]>('/api/departments').catch(() => []),
    $fetch<Position[]>('/api/positions').catch(() => []),
    $fetch<Schedule[]>('/api/schedules').catch(() => []),
  ])
  departments.value = depts
  positions.value = poss
  schedules.value = schs
}

onMounted(() => {
  fetchEmployees()
  fetchDropdowns()
})

// ==================== Search & Filter ====================

const searchQuery = ref('')
const filterDepartment = ref<number | null>(null)
const filterStatus = ref<'all' | 'active' | 'inactive'>('all')

const filteredEmployees = computed(() => {
  let list = employees.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(e => e.name.toLowerCase().includes(q))
  }

  if (filterDepartment.value !== null) {
    list = list.filter(e => e.departmentId === filterDepartment.value)
  }

  if (filterStatus.value === 'active') {
    list = list.filter(e => e.isActive)
  } else if (filterStatus.value === 'inactive') {
    list = list.filter(e => !e.isActive)
  }

  return list
})

// ==================== Helpers ====================

const getDeptName = (id: number | null) => {
  if (!id) return '-'
  return departments.value.find(d => d.id === id)?.name ?? '-'
}

const getPositionName = (id: number | null) => {
  if (!id) return '-'
  return positions.value.find(p => p.id === id)?.name ?? '-'
}

const getScheduleName = (id: number | null) => {
  if (!id) return '-'
  return schedules.value.find(s => s.id === id)?.name ?? '-'
}

const formatSalary = (rate: number) => {
  if (!rate) return '-'
  return new Intl.NumberFormat('kk-KZ').format(rate) + ' ₸'
}

const hasFace = (emp: Employee) => {
  // We don't have faceDescriptor in the list response, so check via a known list
  return faceStatusMap.value.has(emp.id)
}

// Track which employees have face descriptors
const faceStatusMap = ref<Set<number>>(new Set())

const fetchFaceStatus = async () => {
  try {
    const withFace = await $fetch<{ id: number }[]>('/api/employees', { query: { withFace: 'true' } })
    faceStatusMap.value = new Set(withFace.map(e => e.id))
  } catch {
    // ignore
  }
}

onMounted(() => {
  fetchFaceStatus()
})

// ==================== Positions filtered by dept ====================

const filteredPositions = computed(() => {
  if (!form.departmentId) return positions.value
  return positions.value.filter(p => !p.departmentId || p.departmentId === form.departmentId)
})

// ==================== Modal ====================

const showModal = ref(false)
const editingEmployee = ref<Employee | null>(null)
const saving = ref(false)

const form = reactive({
  name: '',
  departmentId: null as number | null,
  positionId: null as number | null,
  scheduleId: null as number | null,
  salaryRate: 0,
  photo: '' as string,
  faceDescriptor: '' as string,
})

const photoPreview = ref<string | null>(null)

const resetForm = () => {
  form.name = ''
  form.departmentId = null
  form.positionId = null
  form.scheduleId = null
  form.salaryRate = 0
  form.photo = ''
  form.faceDescriptor = ''
  photoPreview.value = null
  faceError.value = ''
  faceLoading.value = false
}

const openCreateModal = () => {
  editingEmployee.value = null
  resetForm()
  showModal.value = true
}

const openEditModal = (emp: Employee) => {
  editingEmployee.value = emp
  form.name = emp.name
  form.departmentId = emp.departmentId
  form.positionId = emp.positionId
  form.scheduleId = emp.scheduleId
  form.salaryRate = emp.salaryRate
  form.photo = ''
  form.faceDescriptor = ''
  photoPreview.value = emp.photoPath
  faceError.value = ''
  faceLoading.value = false
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  stopCamera()
  editingEmployee.value = null
}

const saveEmployee = async () => {
  if (!form.name.trim()) return

  saving.value = true
  try {
    const body: Record<string, any> = {
      name: form.name,
      departmentId: form.departmentId,
      positionId: form.positionId,
      scheduleId: form.scheduleId,
      salaryRate: form.salaryRate,
    }

    if (form.photo) body.photo = form.photo
    if (form.faceDescriptor) body.faceDescriptor = form.faceDescriptor

    if (editingEmployee.value) {
      await $fetch(`/api/employees/${editingEmployee.value.id}`, {
        method: 'PUT',
        body,
      })
    } else {
      await $fetch('/api/employees', {
        method: 'POST',
        body,
      })
    }

    closeModal()
    await Promise.all([fetchEmployees(), fetchFaceStatus()])
  } catch (e: any) {
    alert(e.data?.statusMessage || e.message || 'Қате орын алды')
  } finally {
    saving.value = false
  }
}

// ==================== Delete ====================

const showDeleteModal = ref(false)
const deletingEmployee = ref<Employee | null>(null)
const deleting = ref(false)

const confirmDelete = (emp: Employee) => {
  deletingEmployee.value = emp
  showDeleteModal.value = true
}

const deleteEmployee = async () => {
  if (!deletingEmployee.value) return

  deleting.value = true
  try {
    await $fetch(`/api/employees/${deletingEmployee.value.id}`, { method: 'DELETE' })
    showDeleteModal.value = false
    deletingEmployee.value = null
    await Promise.all([fetchEmployees(), fetchFaceStatus()])
  } catch (e: any) {
    alert(e.data?.statusMessage || e.message || 'Қате орын алды')
  } finally {
    deleting.value = false
  }
}

// ==================== Camera & Face Detection ====================

const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const cameraActive = ref(false)
const faceError = ref('')
const faceLoading = ref(false)
let mediaStream: MediaStream | null = null
let faceModelsLoaded = false

const loadFaceModels = async () => {
  if (faceModelsLoaded) return
  try {
    faceapi = await import('@vladmandic/face-api')
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    faceModelsLoaded = true
  } catch (e) {
    console.error('Failed to load face-api models:', e)
    faceError.value = 'Face модельдерін жүктеу мүмкін болмады'
  }
}

const startCamera = async () => {
  faceError.value = ''
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
    })
    cameraActive.value = true
    await nextTick()
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
  } catch (e) {
    faceError.value = 'Камераға рұқсат берілмеді'
    console.error(e)
  }
}

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
  cameraActive.value = false
}

const capturePhoto = async () => {
  if (!videoRef.value || !canvasRef.value) return

  const video = videoRef.value
  const canvas = canvasRef.value
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.drawImage(video, 0, 0)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

  form.photo = dataUrl
  photoPreview.value = dataUrl
  stopCamera()

  // Extract face descriptor
  await extractFaceDescriptor(canvas)
}

const onFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    const dataUrl = e.target?.result as string
    form.photo = dataUrl
    photoPreview.value = dataUrl

    // Create image element for face detection
    const img = new Image()
    img.onload = async () => {
      const canvas = canvasRef.value
      if (!canvas) return
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      await extractFaceDescriptor(canvas)
    }
    img.src = dataUrl
  }
  reader.readAsDataURL(file)

  // Reset file input
  target.value = ''
}

const extractFaceDescriptor = async (canvas: HTMLCanvasElement) => {
  faceLoading.value = true
  faceError.value = ''
  form.faceDescriptor = ''

  try {
    await loadFaceModels()
    if (!faceModelsLoaded) {
      faceError.value = 'Face модельдері жүктелмеді'
      return
    }

    const detection = await faceapi
      .detectSingleFace(canvas)
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (!detection) {
      faceError.value = 'Бет табылмады. Басқа фото қолданыңыз.'
      return
    }

    const descriptor = Array.from(detection.descriptor)
    form.faceDescriptor = JSON.stringify(descriptor)
  } catch (e) {
    console.error('Face detection error:', e)
    faceError.value = 'Face descriptor алу кезінде қате орын алды'
  } finally {
    faceLoading.value = false
  }
}

const clearPhoto = () => {
  form.photo = ''
  form.faceDescriptor = ''
  photoPreview.value = null
  faceError.value = ''
}

// Cleanup on unmount
onUnmounted(() => {
  stopCamera()
})
</script>
