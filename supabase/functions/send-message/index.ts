// supabase/functions/send-message/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        const { workspace_id, conversation_id, message, customer_phone } = await req.json()

        if (!workspace_id || !message || !customer_phone) {
            throw new Error('Missing required fields: workspace_id, message, or customer_phone')
        }

        console.log(`[Send Message] Sending to ${customer_phone} in workspace ${workspace_id}`)

        // Fetch Twilio credentials
        const { data: whatsapp, error: credentialError } = await supabase
            .from('whatsapp_connections')
            .select('twilio_account_sid, twilio_auth_token, twilio_phone_number, mode')
            .eq('workspace_id', workspace_id)
            .single()

        if (credentialError || !whatsapp) {
            console.error('[Send Message] No WhatsApp connection found:', credentialError)
            throw new Error('WhatsApp not connected for this workspace')
        }

        const fromNumber = whatsapp.mode === 'sandbox'
            ? 'whatsapp:+14155238886'
            : `whatsapp:${whatsapp.twilio_phone_number}`

        const toNumber = customer_phone.startsWith('whatsapp:') ? customer_phone : `whatsapp:${customer_phone}`

        // Call Twilio API
        const response = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${whatsapp.twilio_account_sid}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(`${whatsapp.twilio_account_sid}:${whatsapp.twilio_auth_token}`),
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    From: fromNumber,
                    To: toNumber,
                    Body: message
                })
            }
        )

        if (!response.ok) {
            const errorText = await response.text()
            console.error('[Twilio] Send error:', errorText)
            throw new Error(`Twilio error: ${errorText}`)
        }

        const result = await response.json()
        console.log('[Twilio] Message sent successfully:', result.sid)

        return new Response(JSON.stringify({ success: true, sid: result.sid }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error: any) {
        console.error('[Send Message] Error:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
