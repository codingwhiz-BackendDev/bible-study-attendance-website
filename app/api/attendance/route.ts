import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'

const meetingName = 'Sunday Bible Study'

export async function GET() {
  const result = await pool.query(
    `SELECT id, member_code AS code, member_name AS name, matric_number AS matric, department AS dept, level, marked_at AS "markedAt"
     FROM attendance_records WHERE meeting_name = $1 ORDER BY marked_at DESC`,
    [meetingName],
  )
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const body = await request.json()
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!/^\d{7}$/.test(code)) return NextResponse.json({ error: 'Enter a valid seven-digit attendance code.' }, { status: 400 })

  const result = await pool.query(
    `INSERT INTO attendance_records (member_code, member_name, matric_number, department, level, meeting_name)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (member_code, meeting_name) DO NOTHING
     RETURNING id, member_code AS code, member_name AS name, matric_number AS matric, department AS dept, level, marked_at AS "markedAt"`,
    [code, body.name ?? 'Member', body.matric ?? `RUN/GEN/${code}`, body.dept ?? 'General', body.level ?? 'Member', meetingName],
  )

  if (result.rowCount === 0) return NextResponse.json({ error: 'This member has already been marked present.' }, { status: 409 })
  return NextResponse.json(result.rows[0], { status: 201 })
}
