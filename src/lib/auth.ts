import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const { userId } = auth()
  
  if (!userId) {
    redirect('/sign-in')
  }
  
  return userId
}

export async function getUserId() {
  const { userId } = auth()
  return userId
}

export function getAuthHeaders() {
  const { userId } = auth()
  return {
    'x-user-id': userId || '',
  }
}