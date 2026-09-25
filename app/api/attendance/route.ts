import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const meetingId = Number(new URL(request.url).searchParams.get('meetingId'))
  if (!meetingId) return NextResponse.json([])
  const result = await pool.query(`SELECT a.id, a.member_name AS name, a.matric_number AS matric, a.department AS dept, a.level, a.marked_at AS "markedAt" FROM attendance_records a JOIN meetings m ON m.title = a.meeting_name WHERE m.id = $1 ORDER BY a.marked_at DESC`, [meetingId])
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const body = await request.json()
  const matric = String(body.matric ?? '').trim()
  const meetingId = Number(body.meetingId)
  if (!matric || !meetingId) return NextResponse.json({ error: 'Select a meeting and enter a matric number.' }, { status: 400 })
  const meeting = await pool.query(`SELECT m.title, m.meeting_type, m.meeting_date, c.name AS center_name FROM meetings m LEFT JOIN centers c ON c.id = m.center_id WHERE m.id = $1`, [meetingId])
  if (!meeting.rowCount) return NextResponse.json({ error: 'That meeting was not found.' }, { status: 404 })
  const session = meeting.rows[0]
  if (session.meeting_type === 'center' && new Date(`${session.meeting_date.toISOString().slice(0, 10)}T12:00:00`).getDay() !== 0) return NextResponse.json({ error: 'Center attendance can only be marked for Sunday sessions.' }, { status: 400 })
  const member = await pool.query('SELECT name, matric_number AS matric, department, level, attendance_code AS code FROM members WHERE LOWER(matric_number) = LOWER($1)', [matric])
  if (!member.rowCount) return NextResponse.json({ error: 'No registered member has that matric number.' }, { status: 404 })
  const m = member.rows[0]
  const result = await pool.query(`INSERT INTO attendance_records (member_code, member_name, matric_number, department, level, meeting_name, center_name) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (member_code, meeting_name) DO NOTHING RETURNING id, member_name AS name, matric_number AS matric, department AS dept, level, marked_at AS "markedAt"`, [m.code, m.name, m.matric, m.department, m.level, session.title, session.center_name || 'Weekly meeting'])
  if (!result.rowCount) return NextResponse.json({ error: 'This member is already marked present for this meeting.' }, { status: 409 })
  return NextResponse.json(result.rows[0], { status: 201 })
}
