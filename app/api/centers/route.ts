import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
export const runtime = 'nodejs'
export async function GET() { return NextResponse.json((await pool.query('SELECT id, name, location, is_active AS active FROM centers ORDER BY name')).rows) }
export async function POST(request: Request) { const body = await request.json(); const name = String(body.name ?? '').trim(); const location = String(body.location ?? '').trim(); if (!name) return NextResponse.json({ error: 'Center name is required.' }, { status: 400 }); try { return NextResponse.json((await pool.query('INSERT INTO centers (name, location) VALUES ($1,$2) RETURNING id, name, location, is_active AS active', [name, location])).rows[0], { status: 201 }) } catch { return NextResponse.json({ error: 'That center already exists.' }, { status: 409 }) } }
