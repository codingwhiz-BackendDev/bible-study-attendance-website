import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
export const runtime = 'nodejs'
export async function GET() { return NextResponse.json((await pool.query('SELECT id, title, center_id AS "centerId", meeting_date AS date, status FROM meetings ORDER BY meeting_date DESC')).rows) }
export async function POST(request: Request) { const body = await request.json(); const title = String(body.title ?? '').trim(); const date = String(body.date ?? '').trim(); const centerId = body.centerId ? Number(body.centerId) : null; if (!title || !date) return NextResponse.json({ error: 'Title and date are required.' }, { status: 400 }); return NextResponse.json((await pool.query('INSERT INTO meetings (title, meeting_date, center_id) VALUES ($1,$2,$3) RETURNING id, title, center_id AS "centerId", meeting_date AS date, status', [title, date, centerId])).rows[0], { status: 201 }) }
