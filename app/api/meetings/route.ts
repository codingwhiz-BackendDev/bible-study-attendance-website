import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireAdminResponse } from '@/lib/admin-auth'
import { isSundayIsoDate, normalizeIsoDate } from '@/lib/date-only'

export const runtime = 'nodejs'

export async function GET() {
  const result = await pool.query(`SELECT id, title, center_id AS "centerId", to_char(meeting_date, 'YYYY-MM-DD') AS date, meeting_type AS "meetingType", status FROM meetings ORDER BY meeting_date DESC`)
  return NextResponse.json(result.rows)
}

export async function POST(request: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied
  const body = await request.json()
  const title = String(body.title ?? '').trim()
  const date = normalizeIsoDate(body.date)
  const meetingType = body.meetingType === 'weekly' ? 'weekly' : 'center'
  const centerId = body.centerId ? Number(body.centerId) : null
  if (!title || !date) return NextResponse.json({ error: 'Title and date are required.' }, { status: 400 })
  if (body.centerId && (!centerId || Number.isNaN(centerId))) {
    return NextResponse.json({ error: 'Center selection is invalid.' }, { status: 400 })
  }
  if (meetingType === 'center' && !centerId) return NextResponse.json({ error: 'Choose a center for Sunday attendance.' }, { status: 400 })
  if (meetingType === 'center') {
    if (!isSundayIsoDate(date)) {
      return NextResponse.json({ error: 'Sunday center attendance can only be created for a Sunday date.' }, { status: 400 })
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
  const date = body.date ? normalizeIsoDate(body.date) : null
  if (!id || !title) return NextResponse.json({ error: 'Meeting title is required.' }, { status: 400 })
  if (body.date && !date) return NextResponse.json({ error: 'Meeting date must use YYYY-MM-DD format.' }, { status: 400 })
  const existing = await pool.query(`SELECT meeting_type AS "meetingType" FROM meetings WHERE id = $1`, [id])
  if (!existing.rowCount) return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 })
  if (date && existing.rows[0].meetingType === 'center' && !isSundayIsoDate(date)) {
    return NextResponse.json({ error: 'Sunday center attendance can only be created for a Sunday date.' }, { status: 400 })
  }
  const result = await pool.query(
    `UPDATE meetings SET title = $1, meeting_date = COALESCE($2, meeting_date) WHERE id = $3 RETURNING id, title, center_id AS "centerId", to_char(meeting_date, 'YYYY-MM-DD') AS date, meeting_type AS "meetingType", status`,
    [title, date, id],
  )
  return NextResponse.json(result.rows[0])
}
