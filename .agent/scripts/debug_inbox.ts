
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Manually load env from project root to avoid 'dotenv' dependency
const envPath = path.resolve(__dirname, '../../.env.local')
let env: Record<string, string> = {}

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8')
        envContent.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/)
            if (match) {
                const key = match[1].trim()
                const value = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1').replace(/\r$/, '')
                env[key] = value
            }
        })
    } else {
        console.warn('⚠️  .env.local not found at:', envPath)
    }
} catch (e) {
    console.error('Could not read .env file at:', envPath)
}

const supabaseUrl = env.VITE_SUPABASE_URL
// Fallback to Anon Key if Service Role is missing
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
    console.log('Current Env Keys:', Object.keys(env))
    process.exit(1)
}

if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️  WARNING: Using Anon Key. RLS policies may hide data. Add SUPABASE_SERVICE_ROLE_KEY to .env.local for full access.')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyInbox() {
    console.log('--- DIAGNOSTIC START ---')

    // 1. Check Workspaces
    console.log('Checking Workspaces...')
    const { data: workspaces, error: wsError } = await supabase.from('workspaces').select('id, name, owner_id')

    if (wsError) {
        console.error('Error fetching workspaces:', wsError)
        // If error is 401/403, it's definitely RLS/Auth
        return
    }

    console.log(`Found ${workspaces?.length || 0} workspaces.`)
    if (workspaces) {
        workspaces.forEach(w => console.log(` - Workspace: ${w.name} (${w.id}) Owner: ${w.owner_id}`))
    }

    if (!workspaces || workspaces.length === 0) {
        console.log('NO WORKSPACES FOUND visible to this key.')
        return
    }

    const wsId = workspaces[0].id

    // 2. Check Conversations for this Workspace
    console.log(`\nChecking Conversations for Workspace: ${wsId}...`)
    const { data: convs, error: convError } = await supabase
        .from('conversations')
        .select('id, contact_id, status, assigned_to_human, messages(count)')
        .eq('workspace_id', wsId)

    if (convError) {
        console.error('Error fetching conversations:', convError)
    } else {
        console.log(`Found ${convs?.length || 0} conversations.`)
        if (convs) {
            convs.forEach(c => {
                console.log(` - Conv ${c.id}: Status=${c.status}, Human=${c.assigned_to_human}, MsgCount=${c.messages?.[0]?.count || 'N/A'}`)
            })
        }
    }

    // 3. Check Messages specifically
    console.log(`\nChecking Messages for Workspace: ${wsId}...`)
    const { data: msgs, error: msgError } = await supabase.from('messages').select('id, content, conversation_id').limit(5)
    if (msgError) console.error(msgError)
    else {
        console.log(`Sample of ${msgs?.length || 0} recent messages in DB (Global):`)
        if (msgs) {
            msgs.forEach(m => console.log(` - [${m.conversation_id}] ${m.content}`))
        }
    }

    console.log('--- DIAGNOSTIC END ---')
}

verifyInbox()
