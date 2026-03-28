<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Баптаулар</h1>
      <p class="text-gray-500 mt-1">Жүйе параметрлерін басқару</p>
    </div>

    <!-- User info -->
    <div class="card mb-6">
      <h2 class="text-lg font-semibold mb-4">Пайдаланушы</h2>
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-600">
          {{ userInfo?.name?.charAt(0) || '?' }}
        </div>
        <div>
          <p class="font-semibold text-lg">{{ userInfo?.name || '-' }}</p>
          <p class="text-gray-500 text-sm">{{ userInfo?.login || '-' }}</p>
          <p class="text-gray-400 text-xs mt-0.5">Рөлі: {{ userInfo?.role || '-' }}</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Salary settings -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Жалақы параметрлері</h2>
        <div v-if="loadingSalary" class="text-center py-4 text-gray-400">Жүктелуде...</div>
        <form v-else @submit.prevent="saveSalarySettings" class="space-y-4">
          <div>
            <label class="label">Үстеме коэффициенті</label>
            <input v-model.number="salarySettings.overtimeCoefficient" type="number" step="0.1" min="1" class="input" required />
          </div>
          <div>
            <label class="label">Демалыс күн коэффициенті</label>
            <input v-model.number="salarySettings.weekendCoefficient" type="number" step="0.1" min="1" class="input" required />
          </div>
          <div>
            <label class="label">Стандарт жұмыс сағаты (күніне)</label>
            <input v-model.number="salarySettings.standardHoursPerDay" type="number" min="1" max="24" class="input" required />
          </div>
          <button type="submit" class="btn-primary w-full" :disabled="savingSalary">
            {{ savingSalary ? 'Сақталуда...' : 'Сақтау' }}
          </button>
          <p v-if="salarySuccess" class="text-green-600 text-sm text-center">Сәтті сақталды!</p>
        </form>
      </div>

      <!-- Change password -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Құпия сөзді өзгерту</h2>
        <form @submit.prevent="changePassword" class="space-y-4">
          <div>
            <label class="label">Ағымдағы құпия сөз</label>
            <input v-model="passwordForm.oldPassword" type="password" class="input" placeholder="••••••••" required />
          </div>
          <div>
            <label class="label">Жаңа құпия сөз</label>
            <input v-model="passwordForm.newPassword" type="password" class="input" placeholder="••••••••" required />
          </div>
          <div>
            <label class="label">Жаңа құпия сөзді растау</label>
            <input v-model="passwordForm.confirmPassword" type="password" class="input" placeholder="••••••••" required />
          </div>
          <p v-if="passwordError" class="text-red-500 text-sm">{{ passwordError }}</p>
          <p v-if="passwordSuccess" class="text-green-600 text-sm">Құпия сөз сәтті өзгертілді!</p>
          <button type="submit" class="btn-primary w-full" :disabled="savingPassword">
            {{ savingPassword ? 'Өзгертілуде...' : 'Өзгерту' }}
          </button>
        </form>
      </div>
    </div>

    <!-- Quick links -->
    <div class="card mt-6">
      <h2 class="text-lg font-semibold mb-4">Жылдам сілтемелер</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <NuxtLink to="/departments" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">🏢</div>
          <div>
            <p class="font-medium text-sm">Бөлімдер</p>
            <p class="text-xs text-gray-400">Басқару</p>
          </div>
        </NuxtLink>
        <NuxtLink to="/positions" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
          <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-lg">💼</div>
          <div>
            <p class="font-medium text-sm">Лауазымдар</p>
            <p class="text-xs text-gray-400">Басқару</p>
          </div>
        </NuxtLink>
        <NuxtLink to="/schedules" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
          <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg">🕐</div>
          <div>
            <p class="font-medium text-sm">Жұмыс кестелері</p>
            <p class="text-xs text-gray-400">Басқару</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const userInfo = ref<any>(null)
const loadingSalary = ref(true)
const savingSalary = ref(false)
const salarySuccess = ref(false)
const savingPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)

const salarySettings = reactive({
  overtimeCoefficient: 1.5,
  weekendCoefficient: 2.0,
  standardHoursPerDay: 8,
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const fetchUserInfo = async () => {
  try {
    userInfo.value = await $fetch<any>('/api/auth/me')
  } catch (e) {
    console.error(e)
  }
}

const fetchSalarySettings = async () => {
  loadingSalary.value = true
  try {
    const data = await $fetch<any>('/api/settings/salary')
    if (data) {
      salarySettings.overtimeCoefficient = data.overtimeCoefficient ?? 1.5
      salarySettings.weekendCoefficient = data.weekendCoefficient ?? 2.0
      salarySettings.standardHoursPerDay = data.standardHoursPerDay ?? 8
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingSalary.value = false
  }
}

const saveSalarySettings = async () => {
  savingSalary.value = true
  salarySuccess.value = false
  try {
    await $fetch('/api/settings/salary', {
      method: 'PUT',
      body: { ...salarySettings },
    })
    salarySuccess.value = true
    setTimeout(() => { salarySuccess.value = false }, 3000)
  } catch (e) {
    console.error(e)
  } finally {
    savingSalary.value = false
  }
}

const changePassword = async () => {
  passwordError.value = ''
  passwordSuccess.value = false

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Жаңа құпия сөздер сәйкес келмейді'
    return
  }

  if (passwordForm.newPassword.length < 6) {
    passwordError.value = 'Құпия сөз кемінде 6 таңбадан тұруы керек'
    return
  }

  savingPassword.value = true
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      },
    })
    passwordSuccess.value = true
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    setTimeout(() => { passwordSuccess.value = false }, 3000)
  } catch (e: any) {
    passwordError.value = e.data?.statusMessage || 'Құпия сөзді өзгерту кезінде қате пайда болды'
  } finally {
    savingPassword.value = false
  }
}

fetchUserInfo()
fetchSalarySettings()
</script>
