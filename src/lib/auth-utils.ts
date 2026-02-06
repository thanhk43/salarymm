import { auth } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export async function getSession() {
  return await auth()
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role as UserRole)) {
    throw new Error('Forbidden')
  }
  return user
}

export async function requireAdmin() {
  return requireRole([UserRole.ADMIN])
}

export function isAdmin(role: string | UserRole) {
  return role === UserRole.ADMIN
}

export function isEmployee(role: string | UserRole) {
  return role === UserRole.EMPLOYEE
}
