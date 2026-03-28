<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4">
    <div class="card w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-primary-600">FaceAttend</h1>
        <p class="text-gray-500 mt-2">Жүйеге кіру</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="label">Логин</label>
          <input v-model="form.login" type="text" class="input" placeholder="admin" required />
        </div>
        <div>
          <label class="label">Пароль</label>
          <input v-model="form.password" type="password" class="input" placeholder="••••••••" required />
        </div>
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        <button type="submit" :disabled="loading" class="btn-primary w-full">
          {{ loading ? 'Кіру...' : 'Кіру' }}
        </button>
      </form>

      <div class="mt-6 text-center">
        <NuxtLink to="/scan" class="text-primary-600 text-sm hover:underline">
          Сканерлеу бетіне өту →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { login } = useAuth()
const form = reactive({ login: '', password: '' })
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  try {
    const user = await login(form.login, form.password)
    navigateTo('/')
  } catch (e: any) {
    error.value = e.data?.statusMessage || 'Кіру кезінде қате пайда болды'
  } finally {
    loading.value = false
  }
}
</script>
