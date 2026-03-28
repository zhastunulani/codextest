export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()

  const publicPages = ['/login', '/register', '/admin/login', '/scan']
  if (publicPages.includes(to.path)) {
    if (!user.value) {
      await fetchUser()
    }
    if (!user.value) return

    if (user.value.role === 'admin') return navigateTo('/admin/dashboard')
    if (user.value.role === 'head') return navigateTo('/head/dashboard')
    return navigateTo('/')
  }

  if (!user.value) {
    await fetchUser()
  }

  if (!user.value) {
    return navigateTo('/login')
  }

  if (to.path.startsWith('/admin') && user.value.role !== 'admin') {
    if (user.value.role === 'head') return navigateTo('/head/dashboard')
    return navigateTo('/')
  }

  if (to.path.startsWith('/head') && user.value.role !== 'head' && user.value.role !== 'admin') {
    if (user.value.role === 'admin') return navigateTo('/admin/dashboard')
    return navigateTo('/')
  }

  if (!to.path.startsWith('/admin') && !to.path.startsWith('/head')) {
    if (user.value.role === 'admin') return navigateTo('/admin/dashboard')
    if (user.value.role === 'head' && to.path === '/') return navigateTo('/head/dashboard')
  }
})
