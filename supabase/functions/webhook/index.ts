// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VERIFY_TOKEN = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN')!
const META_TOKEN = Deno.env.get('META_WHATSAPP_TOKEN')!
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req: Request) => {
    try {
        const url = new URL(req.url)

        // 1. Webhook Verification (GET)
        if (req.method === 'GET') {
            const mode = url.searchParams.get('hub.mode')
            const token = url.searchParams.get('hub.verify_token')
            const challenge = url.searchParams.get('hub.challenge')

            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('[Webhook] Verification successful')
                return new Response(challenge, { status: 200 })
            }
            return new Response('Forbidden', { status: 403 })
        }

        // 2. Webhook Event Processing (POST)
        if (req.method === 'POST') {
            const body = await req.json()
            console.log('[Webhook] Received payload:', JSON.stringify(body, null, 2))

            // Acknowledge receipt to Meta immediately
            // We do the processing in the background (or blockingly, but fast enough)
            // Deno Deploy isolate might suspend if we return immediately without using waitUntil
            // However, Supabase Edge Functions don't natively support waitUntil yet.
            // But we must return 200 OK fast. The logic below is very fast (< 2s).

            if (body.object !== 'whatsapp_business_account') {
                return new Response('Not a whatsapp event', { status: 404 })
            }

            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    const value = change.value
                    if (!value || !value.messages || value.messages.length === 0) continue

                    // Get workspace ID mapped to this WhatsApp connection
                    // Since it's a global Meta App for now, just grab the first connected workspace.
                    const { data: connection } = await supabase
                        .from('whatsapp_connections')
                        .select('workspace_id')
                        .eq('connected', true)
                        .limit(1)
                        .single()

                    if (!connection) {
                        console.error('[Webhook] No active WhatsApp connection found in DB.')
                        continue
                    }

                    const workspaceId = connection.workspace_id

                    for (const msg of value.messages) {
                        const fromPhone = msg.from
                        const customerName = value.contacts?.[0]?.profile?.name || 'Customer'
                        const messageId = msg.id

                        // Ensure contact exists
                        let { data: contact } = await supabase
                            .from('contacts')
                            .select('id')
                            .eq('workspace_id', workspaceId)
                            .eq('phone', fromPhone)
                            .single()

                        if (!contact) {
                            const { data: newContact } = await supabase
                                .from('contacts')
                                .insert({
                                    workspace_id: workspaceId,
                                    phone: fromPhone,
                                    name: customerName,
                                    channel: 'whatsapp'
                                })
                                .select('id')
                                .single()
                            contact = newContact
                        }

                        // Ensure conversation exists
                        let { data: conversation } = await supabase
                            .from('conversations')
                            .select('id, status')
                            .eq('workspace_id', workspaceId)
                            .eq('contact_id', contact.id)
                            .single()

                        if (!conversation) {
                            const { data: newConv } = await supabase
                                .from('conversations')
                                .insert({
                                    workspace_id: workspaceId,
                                    contact_id: contact.id,
                                    channel: 'whatsapp',
                                    status: 'todo',
                                    unread_count: 0
                                })
                                .select('id')
                                .single()
                            conversation = newConv
                        } else {
                            // Update last_message_at
                            await supabase
                                .from('conversations')
                                .update({ last_message_at: new Date().toISOString() })
                                .eq('id', conversation.id)
                        }

                        let messageContent = ''

                        if (msg.type === 'text') {
                            messageContent = msg.text.body
                        } else if (msg.type === 'audio' && msg.audio?.id) {
                            // Process voice note
                            messageContent = await processVoiceNote(msg.audio.id, META_TOKEN, GROQ_API_KEY)
                        } else {
                            // Unsupported type
                            messageContent = `[Received unsupported message type: ${msg.type}]`
                        }

                        // Insert message (this triggers the queue enqueue logic)
                        await supabase.from('messages').insert({
                            conversation_id: conversation.id,
                            sender: 'customer',
                            content: messageContent,
                            provider_message_id: messageId,
                            metadata: {
                                type: msg.type,
                                raw: msg
                            }
                        })
                    }
                }
            }

            return new Response('OK', { status: 200 })
        }

        return new Response('Method not allowed', { status: 405 })
    } catch (error: any) {
        console.error('[Webhook] Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})

async function processVoiceNote(mediaId: string, metaToken: string, groqKey: string): Promise<string> {
    try {
        console.log(`[Audio] Fetching media info for ID: ${mediaId}`);
        // 1. Get media URL
        const mediaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
            headers: { 'Authorization': `Bearer ${metaToken}` }
        });
        if (!mediaRes.ok) throw new Error(`Meta API error: ${await mediaRes.text()}`);
        const mediaData = await mediaRes.json();
        
        console.log(`[Audio] Downloading from URL: ${mediaData.url}`);
        // 2. Download media binary
        const downloadRes = await fetch(mediaData.url, {
            headers: { 'Authorization': `Bearer ${metaToken}` }
        });
        if (!downloadRes.ok) throw new Error('Failed to download audio from Meta');
        
        const audioBlob = await downloadRes.blob();
        
        console.log(`[Audio] Audio downloaded, size: ${audioBlob.size} bytes. Transcribing via Groq...`);
        // 3. Send to Groq Whisper
        const formData = new FormData();
        // The WhatsApp audio is typically audio/ogg; codecs=opus. We just name it audio.ogg
        // Groq requires standard file name + extension
        formData.append('file', audioBlob, 'audio.ogg');
        formData.append('model', 'whisper-large-v3');
        formData.append('response_format', 'json');

        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`
            },
            body: formData
        });

        if (!groqRes.ok) {
            const err = await groqRes.text();
            throw new Error(`Groq Whisper error: ${err}`);
        }

        const transcription = await groqRes.json();
        console.log(`[Audio] Transcription complete: "${transcription.text}"`);
        
        return `[Voice Note] ${transcription.text}`;
    } catch (e: any) {
        console.error('[Audio] Voice note processing failed:', e.message);
        return `[Voice note transcription failed]`;
    }
}
