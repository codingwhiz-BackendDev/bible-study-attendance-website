import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireAdminResponse } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const NIGERIA_TIME_ZONE = 'Africa/Lagos'
const SUNDAY_MORNING_START = 6
const SUNDAY_MORNING_END = 12

function getNigeriaDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: NIGERIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    weekday: values.weekday,
    hour: Number(values.hour),
  }
}

function isSundayMorningInNigeria() {
  const now = getNigeriaDateParts()
  return now.weekday === 'Sun' && now.hour >= SUNDAY_MORNING_START && now.hour < SUNDAY_MORNING_END
}

export async function GET() {
  const result = await pool.query(`SELECT id, title, center_id AS "centerId", to_char(meeting_date, 'YYYY-MM-DD') AS date, meeting_type AS "meetingType", status FROM meetings ORDER BY meeting_date DESC`)
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied
  const body = await request.json()
  const title = String(body.title ?? '').trim()
  const date = String(body.date ?? '').trim()
  const meetingType = body.meetingType === 'weekly' ? 'weekly' : 'center'
  const centerId = body.centerId ? Number(body.centerId) : null
  if (!title || !date) return NextResponse.json({ error: 'Title and date are required.' }, { status: 400 })
  if (meetingType === 'center' && !centerId) return NextResponse.json({ error: 'Choose a center for Sunday attendance.' }, { status: 400 })
  if (meetingType === 'center') {
    const nigeriaNow = getNigeriaDateParts()
    if (!isSundayMorningInNigeria() || date !== nigeriaNow.date) {
      return NextResponse.json({ error: 'Sunday center attendance can only be created on the current Sunday between 6:00 AM and 12:00 PM Nigeria time.' }, { status: 400 })
    }
  }
  if (meetingType === 'weekly' && centerId) return NextResponse.json({ error: 'Weekly meetings are not attached to a center.' }, { status: 400 })
  const result = await pool.query(`INSERT INTO meetings (title, meeting_date, center_id, meeting_type) VALUES ($1,$2,$3,$4) RETURNING id, title, center_id AS "centerId", to_char(meeting_date, 'YYYY-MM-DD') AS date, meeting_type AS "meetingType", status`, [title, date, meetingType === 'center' ? centerId : null, meetingType])
  return NextResponse.json(result.rows[0], { status: 201 })
}

export async function DELETE(request: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied
  const id = Number(new URL(request.url).searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'Meeting id is required.' }, { status: 400 })
  const result = await pool.query('DELETE FROM meetings WHERE id = $1 RETURNING id', [id])
  return result.rowCount ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Meeting not found.' }, { status: 404 })
}

export async function PATCH(request: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied
  const body = await request.json()
  const id = Number(body.id)
  const title = String(body.title ?? '').trim()
  if (!id || !title) return NextResponse.json({ error: 'Meeting title is required.' }, { status: 400 })
  const result = await pool.query(`UPDATE meetings SET title = $1 WHERE id = $2 RETURNING id, title, center_id AS "centerId", to_char(meeting_date, 'YYYY-MM-DD') AS date, meeting_type AS "meetingType", status`, [title, id])
  return NextResponse.json(result.rows[0])
}
