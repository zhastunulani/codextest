export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()

  // Public pages
  const publicPages = ['/login', '/scan']
  if (publicPages.includes(to.path)) return

  // Fetch user if not loaded
  if (!user.value) {
    await fetchUser()
  }

  // Redirect to login if not authenticated
  if (!user.value) {
    return navigateTo('/login')
  }
})
