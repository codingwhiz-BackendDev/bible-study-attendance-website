import { pool } from '@/lib/db'
import { requireAdminResponse } from '@/lib/admin-auth'

export const runtime = 'nodejs'

function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export async function GET(request: Request) {
  const denied = await requireAdminResponse()
  if (denied) return denied
  const meetingId = Number(new URL(request.url).searchParams.get('meetingId'))
  if (!meetingId) return Response.json({ error: 'Meeting is required.' }, { status: 400 })
  const result = await pool.query(`SELECT m.title, m.meeting_date AS date, COALESCE(c.name, 'Weekly meeting') AS center_name, a.member_name AS name, a.matric_number AS matric, a.level, a.department, a.marked_at AS marked_at FROM attendance_records a JOIN meetings m ON m.title = a.meeting_name LEFT JOIN centers c ON c.name = a.center_name WHERE m.id = $1 ORDER BY a.member_name`, [meetingId])
  const rows = ['Meeting,Date,Center,Member name,Matric number,Level,Department,Marked at']
  for (const row of result.rows) rows.push([row.title, row.date, row.center_name, row.name, row.matric, row.level, row.department, row.marked_at].map(csvCell).join(','))
  return new Response(`\uFEFF${rows.join('\r\n')}`, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="attendance-${meetingId}.csv"`, 'Cache-Control': 'no-store' } })
}
