import { createHash } from 'node:crypto'
import postgres from 'postgres'

const connection = process.env.POSTGRES_URL
const sql = connection ? postgres(connection, { max: 1, idle_timeout: 20, connect_timeout: 10 }) : null

function pinHash(pin) {
  return createHash('sha256').update(`${process.env.SUPABASE_JWT_SECRET || 'jaekyung-study'}:${pin}`).digest('hex')
}

function validState(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  return JSON.stringify(value).length <= 100_000
}

async function ensureTable() {
  await sql`CREATE TABLE IF NOT EXISTS jaekyung_study_sync (
    pin_hash text PRIMARY KEY,
    state jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`
}

export default async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'POST 요청만 지원합니다.' })
  if (!sql) return response.status(503).json({ error: '동기화 저장소가 아직 연결되지 않았습니다.' })

  const body = typeof request.body === 'string' ? JSON.parse(request.body || '{}') : request.body || {}
  const pin = String(body.pin || '')
  if (!/^\d{4}$/.test(pin)) return response.status(400).json({ error: 'PIN은 숫자 4자리여야 합니다.' })

  try {
    await ensureTable()
    const hash = pinHash(pin)
    if (body.action === 'load') {
      const rows = await sql`SELECT state, updated_at FROM jaekyung_study_sync WHERE pin_hash = ${hash}`
      const record = rows[0]
      return response.status(200).json({ state: record?.state || null, updatedAt: record?.updated_at || null })
    }
    if (body.action === 'save' && validState(body.state)) {
      await sql`INSERT INTO jaekyung_study_sync (pin_hash, state, updated_at)
        VALUES (${hash}, ${JSON.stringify(body.state)}::jsonb, now())
        ON CONFLICT (pin_hash) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`
      return response.status(200).json({ saved: true })
    }
    return response.status(400).json({ error: '지원하지 않는 동기화 요청입니다.' })
  } catch (error) {
    console.error('Study sync failed', error)
    return response.status(500).json({ error: '기록을 동기화하지 못했습니다. 잠시 후 다시 시도해 주세요.' })
  }
}
