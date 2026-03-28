interface User {
  id: number
  login: string
  name: string
  role: 'admin' | 'head' | 'employee'
  departmentId?: number
}

export const useAuth = () => {
  const user = useState<User | null>('auth_user', () => null)
  const isLoggedIn = computed(() => !!user.value)

  const login = async (loginStr: string, password: string) => {
    const data = await $fetch<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: { login: loginStr, password },
    })
    user.value = data.user
    return data.user
  }

  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    navigateTo('/login')
  }

  const fetchUser = async () => {
    try {
      const data = await $fetch<{ user: User }>('/api/auth/me')
      user.value = data.user
    } catch {
      user.value = null
    }
  }

  const isAdmin = computed(() => user.value?.role === 'admin')
  const isHead = computed(() => user.value?.role === 'head')
  const isEmployee = computed(() => user.value?.role === 'employee')

  return { user, isLoggedIn, login, logout, fetchUser, isAdmin, isHead, isEmployee }
}
