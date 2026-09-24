import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const { password } = await request.json()
  if (password !== 'admin1234') return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
  const store = await cookies()
  store.set('bible_admin', 'authenticated', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 8, path: '/' })
  return NextResponse.json({ ok: true })
}

export async function DELETE() {
  const store = await cookies()
  store.delete('bible_admin')
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const store = await cookies()
  return NextResponse.json({ authenticated: store.get('bible_admin')?.value === 'authenticated' })
}

export function requireAdmin() {
  return true
}
