import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getValidAccessToken } from '../_shared/gmail-token.ts';
import { applyLabelToMessage, ensureLabelExists } from '../_shared/gmail-api.ts';

Deno.serve(async (req) => {
  console.log(`[Poller] Request received: ${req.method} at ${new Date().toISOString()}`);
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { data: connections, error: dbErr } = await supabase
      .from('gmail_connections')
      .select('*')
      .eq('is_active', true);

    if (dbErr) {
        console.error('[Poller] DB Error fetching connections:', dbErr);
        return new Response(JSON.stringify({ error: dbErr }), { status: 500 });
    }
    
    if (!connections?.length) {
        console.log('[Poller] No active connections found');
        return new Response('No connections');
    }

    console.log(`[Poller] Found ${connections.length} active connections`);

    const results = [];
    for (const connection of connections) {
      console.log(`[Poller] Processing connection for: ${connection.gmail_address}`);
      const status: any = { id: connection.id, gmail: connection.gmail_address, message_details: [] };
      try {
        const authResult = await getValidAccessToken(
          supabase,
          connection.id,
          connection.access_token,
          connection.refresh_token,
          connection.token_expiry
        );

        if (authResult.error) {
          console.error(`[Poller] Auth error for ${connection.gmail_address}:`, authResult.error);
          status.auth_error = authResult.error;
          results.push(status);
          continue;
        }

        const accessToken = authResult.token!;
        
        console.log(`[Poller] Listing messages for ${connection.gmail_address}...`);
        const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=is:unread -category:promotions -category:social', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const listData = await listRes.json();
        
        if (!listData.messages) {
          console.log(`[Poller] No unread messages for ${connection.gmail_address}`);
          status.messages_found = 0;
        } else {
          console.log(`[Poller] Found ${listData.messages.length} messages for ${connection.gmail_address}`);
          status.messages_found = listData.messages.length;
          let processed = 0;
          for (const msgRef of listData.messages) {
            console.log(`[Poller] Processing message ID: ${msgRef.id}`);
            const detail = await processGmailMessage(supabase, connection, accessToken, msgRef.id);
            status.message_details.push({ id: msgRef.id, ...detail });
            if (detail.success) processed++;
          }
          status.processed = processed;
        }

      } catch (e: any) {
        console.error(`[Poller] Connection loop exception:`, e.message);
        status.exception = e.message;
      }
      results.push(status);
    }

    return new Response(JSON.stringify(results), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (globalErr: any) {
      console.error('[Poller] global exception:', globalErr.message);
      return new Response(globalErr.message, { status: 500 });
  }
});

async function analyzeEmailWithAI(subject: string, body: string, sender: string) {
  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (!groqKey) return { category: 'Other', importance: 5, summary: 'AI Analysis skipped' };

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Analyze email. Category, importance 0-10, brief summary. JSON only.`
          },
          {
            role: 'user',
            content: `Subject: ${subject}\nFrom: ${sender}\nBody: ${body}\n\nReturn JSON: {"category": "...", "importance": 0-10, "summary": "brief summary"}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });
    
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (e: any) {
    console.error(`[AI] Exception during analysis:`, e.message);
    return { category: 'Other', importance: 5, summary: 'AI Analysis failed' };
  }
}

async function sendTelegramAlert(supabase: any, workspaceId: string, text: string) {
  console.log(`[Telegram] Attempting alert for workspace: ${workspaceId}`);
  
  try {
    const { data: settings, error: sErr } = await supabase
        .from('notification_settings')
        .select('telegram_chat_id')
        .eq('workspace_id', workspaceId)
        .single();

    if (sErr) throw new Error(`Settings DB error: ${sErr.message}`);
    if (!settings?.telegram_chat_id) {
        console.warn(`[Telegram] No chat_id for ${workspaceId}`);
        return;
    }

    const { data: connection, error: cErr } = await supabase
        .from('telegram_connections')
        .select('bot_token')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

    if (cErr) throw new Error(`Connection DB error: ${cErr.message}`);
    if (!connection?.bot_token) {
        console.warn(`[Telegram] No bot_token for ${workspaceId}`);
        return;
    }

    console.log(`[Telegram] Posting to API for Chat ${settings.telegram_chat_id}...`);
    const res = await fetch(`https://api.telegram.org/bot${connection.bot_token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: settings.telegram_chat_id,
            text: text,
            parse_mode: 'Markdown'
        })
    });
    
    const data = await res.json();
    console.log(`[Telegram] API Success:`, data.ok);
    if (!data.ok) console.error(`[Telegram] API Error:`, JSON.stringify(data));
  } catch (err: any) {
      console.error(`[Telegram] Exception:`, err.message);
  }
}

async function processGmailMessage(
  supabase: any,
  connection: any,
  accessToken: string,
  messageId: string
): Promise<{ success: boolean, reason?: string, importance?: number }> {
  try {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!msgRes.ok) return { success: false, reason: `Gmail fetch fail: ${msgRes.status}` };
    const msg = await msgRes.json();

    const headers = msg.payload.headers;
    const fromHeader = headers.find((h: any) => h.name === 'From')?.value || '';
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';

    // Simple body extraction
    let emailBody = '';
    const extractBody = (part: any) => {
        if (part.body?.data) {
            emailBody += atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
        if (part.parts) part.parts.forEach(extractBody);
    };
    extractBody(msg.payload);

    console.log(`[AI] Analyzing: ${subject.substring(0, 30)}...`);
    const analysis = await analyzeEmailWithAI(subject, emailBody.substring(0, 500), fromHeader);
    console.log(`[AI] Result - Importance: ${analysis.importance}`);

    if (analysis.importance >= 6) {
        console.log(`[Telegram] Alerting for high importance (${analysis.importance}) email`);
        await sendTelegramAlert(supabase, connection.workspace_id, `🤖 *Openstyrer Assistant*\n\n🔥 *High Priority Email*\n*Subject*: ${subject}\n*From*: ${fromHeader}\n*Summary*: ${analysis.summary}`);
    }

    return { success: true, importance: analysis.importance };
  } catch (err: any) {
      console.error(`[Poller] Message processing failed:`, err.message);
      return { success: false, reason: err.message };
  }
}
