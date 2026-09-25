import { cookies } from 'next/headers'

export async function isAdminAuthenticated() {
  const store = await cookies()
  return store.get('bible_admin')?.value === 'authenticated'
}

export async function requireAdminResponse() {
  if (await isAdminAuthenticated()) return null
  return Response.json({ error: 'Admin authentication required.' }, { status: 401 })
}
