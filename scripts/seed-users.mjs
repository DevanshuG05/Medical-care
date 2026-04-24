import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')

if (!fs.existsSync(envPath)) {
  console.error(`Missing ${envPath}`)
  process.exit(1)
}

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

const url = env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!url) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}

if (!serviceKey) {
  console.error(
    'Missing SUPABASE_SERVICE_ROLE_KEY in .env.local.\n' +
      'Get it from: Supabase Dashboard -> Project Settings -> API -> service_role key.\n' +
      'Add a line to .env.local:\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...'
  )
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const users = [
  {
    email: 'patient123@gmail.com',
    password: '123456789',
    full_name: 'Test Patient',
    role: 'patient',
  },
  {
    email: 'doctor123@gmail.com',
    password: '123456789',
    full_name: 'Dr. Test',
    role: 'doctor',
  },
]

async function findUserByEmail(email) {
  let page = 1
  const perPage = 1000
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (match) return match
    if (data.users.length < perPage) return null
    page += 1
  }
}

for (const u of users) {
  const existing = await findUserByEmail(u.email)
  if (existing) {
    const { error: delErr } = await admin.auth.admin.deleteUser(existing.id)
    if (delErr) {
      console.error(`[FAIL] delete ${u.email}: ${delErr.message}`)
      continue
    }
    console.log(`[DEL]  ${u.email} (old id=${existing.id})`)
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: {
      full_name: u.full_name,
      role: u.role,
    },
  })
  if (error) {
    console.error(`[FAIL] create ${u.email}: ${error.message}`)
    continue
  }
  console.log(
    `[OK]   ${u.email} (${u.role}) -> id=${data.user?.id}, email confirmed`
  )
}
