import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const result = await pool.query('SELECT id, name, matric_number AS matric, level, gender, department, attendance_code AS code FROM members ORDER BY name')
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const body = await request.json()
  const name = String(body.name ?? '').trim(); const matric = String(body.matric ?? '').trim(); const level = String(body.level ?? '').trim(); const gender = String(body.gender ?? '').trim(); const department = String(body.department ?? '').trim()
  if (!name || !matric || !level || !gender || !department) return NextResponse.json({ error: 'Complete every field.' }, { status: 400 })
  const code = String(Math.floor(1000000 + Math.random() * 9000000))
  try {
    const result = await pool.query('INSERT INTO members (name, matric_number, level, gender, department, attendance_code) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, matric_number AS matric, level, gender, department, attendance_code AS code', [name, matric, level, gender, department, code])
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'That matric number is already registered.' }, { status: 409 })
    return NextResponse.json({ error: 'Unable to register member.' }, { status: 500 })
  }
}
