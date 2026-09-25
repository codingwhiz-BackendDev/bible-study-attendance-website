import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { pool } from '@/lib/db'

export const runtime = 'nodejs'

function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export async function GET(request: Request) {
  const isAdmin = (await cookies()).get('bible_admin')?.value === 'authenticated'
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const meetingId = Number(new URL(request.url).searchParams.get('meetingId'))
  if (!Number.isInteger(meetingId) || meetingId < 1) return NextResponse.json({ error: 'A valid meeting is required.' }, { status: 400 })

  const result = await pool.query(`
    SELECT m.title, m.meeting_date, m.meeting_type, c.name AS center_name,
           a.member_name, a.matric_number, a.department, a.level, a.marked_at
    FROM meetings m
    LEFT JOIN centers c ON c.id = m.center_id
    LEFT JOIN attendance_records a ON a.meeting_name = m.title
    WHERE m.id = $1
    ORDER BY a.member_name NULLS LAST
  `, [meetingId])
  if (!result.rowCount) return NextResponse.json({ error: 'Meeting not found.' }, { status: 404 })

  const first = result.rows[0]
  const lines = [
    ['Meeting', 'Date', 'Type', 'Center', 'Member name', 'Matric number', 'Department', 'Level', 'Marked at'],
    ...result.rows.map(row => [row.title, row.meeting_date.toISOString().slice(0, 10), row.meeting_type === 'center' ? 'Sunday center attendance' : 'Weekly meeting', row.center_name || 'Independent weekly meeting', row.member_name || '', row.matric_number || '', row.department || '', row.level || '', row.marked_at ? new Date(row.marked_at).toISOString() : ''])
  ].map(row => row.map(csvCell).join(','))

  const filename = `${String(first.title).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'attendance'}-${new Date(first.meeting_date).toISOString().slice(0, 10)}.csv`
  return new NextResponse(`\ufeff${lines.join('\r\n')}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store'
    }
  })
}

export async function OPTIONS() { return new NextResponse(null, { status: 204 }) }
