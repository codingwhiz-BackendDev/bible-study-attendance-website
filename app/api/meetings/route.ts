import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const result = await pool.query(`SELECT id, title, center_id AS "centerId", meeting_date AS date, meeting_type AS "meetingType", status FROM meetings ORDER BY meeting_date DESC`)
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const body = await request.json()
  const title = String(body.title ?? '').trim()
  const date = String(body.date ?? '').trim()
  const meetingType = body.meetingType === 'weekly' ? 'weekly' : 'center'
  const centerId = body.centerId ? Number(body.centerId) : null
  if (!title || !date) return NextResponse.json({ error: 'Title and date are required.' }, { status: 400 })
  if (meetingType === 'center' && !centerId) return NextResponse.json({ error: 'Choose a center for Sunday attendance.' }, { status: 400 })
  if (meetingType === 'center' && new Date(`${date}T12:00:00`).getDay() !== 0) return NextResponse.json({ error: 'Center attendance is only available on Sundays.' }, { status: 400 })
  if (meetingType === 'weekly' && centerId) return NextResponse.json({ error: 'Weekly meetings are not attached to a center.' }, { status: 400 })
  const result = await pool.query(`INSERT INTO meetings (title, meeting_date, center_id, meeting_type) VALUES ($1,$2,$3,$4) RETURNING id, title, center_id AS "centerId", meeting_date AS date, meeting_type AS "meetingType", status`, [title, date, meetingType === 'center' ? centerId : null, meetingType])
  return NextResponse.json(result.rows[0], { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const id = Number(body.id)
  const title = String(body.title ?? '').trim()
  if (!id || !title) return NextResponse.json({ error: 'Meeting title is required.' }, { status: 400 })
  const result = await pool.query(`UPDATE meetings SET title = $1 WHERE id = $2 RETURNING id, title, center_id AS "centerId", meeting_date AS date, meeting_type AS "meetingType", status`, [title, id])
  return NextResponse.json(result.rows[0])
}
