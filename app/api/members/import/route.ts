import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { requireAdminResponse } from '@/lib/admin-auth'

const SOURCE_URL = 'https://blobs.vusercontent.net/blob/ruc-bible-study-members-2026-09-28-GPxkDo0ZFPXFkrQOj6uBxXF8I7trcG.csv'

function parseCsvLine(line: string) {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (quoted && line[i + 1] === '"') { cell += '"'; i++ } else quoted = !quoted
    } else if (char === ',' && !quoted) { cells.push(cell.trim()); cell = '' } else cell += char
  }
  cells.push(cell.trim())
  return cells
}

function normalizeMatric(value: string) {
  return value.trim().replace(/^\"+|\"+$/g, '').toUpperCase().replace(/\s+/g, '')
}

export async function POST() {
  const denied = await requireAdminResponse()
  if (denied) return denied
  const response = await fetch(SOURCE_URL, { cache: 'no-store' })
  if (!response.ok) return NextResponse.json({ error: 'Could not read the roster file.' }, { status: 502 })
  const lines = (await response.text()).split(/\r?\n/).filter(Boolean)
  const headers = parseCsvLine(lines.shift() ?? '')
  const index = (name: string) => headers.findIndex(header => header.toLowerCase() === name.toLowerCase())
  const surname = index('Surname'), otherNames = index('Other Names'), department = index('Department'), level = index('Level'), gender = index('Gender'), matric = index('Matric Number'), worshipCentre = index('Worship Centre')
  if ([surname, otherNames, department, level, gender, matric, worshipCentre].some(value => value < 0)) return NextResponse.json({ error: 'Roster columns are incomplete.' }, { status: 400 })

  const client = await pool.connect()
  let imported = 0
  const centers = new Set<string>()
  try {
    await client.query('BEGIN')
    for (const line of lines) {
      const row = parseCsvLine(line)
      const name = `${row[surname]} ${row[otherNames]}`.trim().replace(/\s+/g, ' ')
      const matricNumber = normalizeMatric(row[matric])
      if (!name || !matricNumber) continue
      const attendanceCode = `IMPORT-${matricNumber.replace(/[^A-Z0-9]/g, '')}`
      const centerName = String(row[worshipCentre] ?? '').trim()
      if (centerName) {
        centers.add(centerName)
        await client.query('INSERT INTO centers (name, location) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING', [centerName, 'Imported from roster'])
      }
      await client.query(`INSERT INTO members (name, matric_number, level, gender, department, attendance_code, role)
        VALUES ($1, $2, $3, $4, $5, $6, 'teacher')
        ON CONFLICT (matric_number) DO UPDATE SET name = EXCLUDED.name, level = EXCLUDED.level, gender = EXCLUDED.gender, department = EXCLUDED.department, role = 'teacher'`,
        [name, matricNumber, row[level], row[gender], row[department], attendanceCode])
      imported++
    }
    await client.query('COMMIT')
    return NextResponse.json({ imported, centers: centers.size })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('[v0] roster import failed', error)
    return NextResponse.json({ error: 'Roster import failed.' }, { status: 500 })
  } finally { client.release() }
}

export const runtime = 'nodejs'
export const maxDuration = 60
