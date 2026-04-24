import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')

const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const idx = line.indexOf('=')
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()]
    })
)

const admin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const tables = [
  'profiles',
  'doctor_profiles',
  'medical_records',
  'appointments',
  'prescriptions',
  'prescription_items',
  'medicine_reminders',
  'adherence_logs',
  'symptom_analyses',
]

console.log('Table'.padEnd(22), 'Status'.padEnd(12), 'Rows')
console.log('-'.repeat(50))

for (const t of tables) {
  const { error, count } = await admin
    .from(t)
    .select('*', { count: 'exact', head: true })
  if (error) {
    console.log(t.padEnd(22), 'MISSING'.padEnd(12), `(${error.message})`)
  } else {
    console.log(t.padEnd(22), 'EXISTS'.padEnd(12), count ?? 0)
  }
}
