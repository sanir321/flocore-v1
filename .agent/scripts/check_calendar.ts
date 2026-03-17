
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPath = path.resolve(__dirname, '../../.env.local')
let env: Record<string, string> = {}

try {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            env[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').replace(/\r$/, '')
        }
    })
} catch (e) { console.error('Env error') }

// Fallback to Anon Key if Service Role is missing
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(env.VITE_SUPABASE_URL, supabaseKey)

async function checkCalendar() {
    // 1. Get Workspace
    const { data: workspaces } = await supabase.from('workspaces').select('id').limit(1)
    if (!workspaces?.length) return console.log('No workspace')
    const wsId = workspaces[0].id

    // 2. Check Calendar
    const { data: calendar, error } = await supabase.from('calendar_connections').select('*').eq('workspace_id', wsId)

    console.log(`Workspace: ${wsId}`)
    console.log('Calendar Connection:', calendar?.length ? 'CONNECTED' : 'MISSING')
    if (error) console.error('Error:', error)
}

checkCalendar()
