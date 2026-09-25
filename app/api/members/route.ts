import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireAdminResponse } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const MATRIC_PREFIX = 'RUN/CMP/23/'

function normalizeMatric(value: unknown) {
  const raw = String(value ?? '').trim().toUpperCase()
  if (!raw) return ''
  if (/^\d+$/.test(raw)) return `${MATRIC_PREFIX}${raw}`
  return raw.replace(/\\s+/g, '')
}

export async function GET() {
  const denied = await requireAdminResponse()
  if (denied) return denied
  const result = await pool.query('SELECT id, name, matric_number AS matric, level, gender, department, attendance_code AS code FROM members ORDER BY name')
  return NextResponse.json(result.rows)
}

export async function PATCH(request: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied
  const body = await request.json()
  const id = Number(body.id)
  const name = String(body.name ?? '').trim()
  const matric = normalizeMatric(body.matric)
  const level = String(body.level ?? '').trim()
  const gender = String(body.gender ?? '').trim()
  const department = String(body.department ?? '').trim()
  if (!id || !name || !matric || !level || !gender || !department) return NextResponse.json({ error: 'Complete every field.' }, { status: 400 })
  try {
    const result = await pool.query('UPDATE members SET name=$1, matric_number=$2, level=$3, gender=$4, department=$5 WHERE id=$6 RETURNING id, name, matric_number AS matric, level, gender, department, attendance_code AS code', [name, matric, level, gender, department, id])
    return result.rowCount ? NextResponse.json(result.rows[0]) : NextResponse.json({ error: 'Member not found.' }, { status: 404 })
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'That matric number is already registered.' }, { status: 409 })
    return NextResponse.json({ error: 'Unable to update member.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied
  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'Member id is required.' }, { status: 400 })
  const result = await pool.query('DELETE FROM members WHERE id=$1 RETURNING id', [id])
  return result.rowCount ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Member not found.' }, { status: 404 })
}

export async function POST(request: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied
  const body = await request.json()
  const name = String(body.name ?? '').trim(); const matric = normalizeMatric(body.matric); const level = String(body.level ?? '').trim(); const gender = String(body.gender ?? '').trim(); const department = String(body.department ?? '').trim()
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
