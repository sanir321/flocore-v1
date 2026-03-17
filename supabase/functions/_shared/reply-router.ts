// @ts-nocheck
import { getValidAccessToken } from './gmail-token.ts';

export async function sendReply(
  channel: string,
  replyMetadata: any,
  replyText: string,
  supabase: any
): Promise<void> {
  console.log(`[Reply Router] Sending reply to ${channel}`);

  switch (channel) {
    case 'whatsapp':
      await sendWhatsAppMessage(supabase, replyMetadata.workspace_id, replyMetadata.phone, replyText);
      break;
    case 'gmail':
      await sendGmailReply(supabase, replyMetadata, replyText);
      break;
    case 'slack':
      await sendSlackMessage(supabase, replyMetadata, replyText);
      break;
    case 'telegram':
      await sendTelegramMessage(supabase, replyMetadata, replyText);
      break;
    case 'webchat':
      // No external API needed, message is already in DB for the widget to subscribe to
      break;
    default:
      console.warn(`[Reply Router] Unsupported channel: ${channel}`);
  }
}

async function sendGmailReply(
  supabase: any,
  replyMetadata: any,
  replyText: string
): Promise<void> {
  // 1. Get connection details
  const { data: connection } = await supabase
    .from('gmail_connections')
    .select('*')
    .eq('id', replyMetadata.gmail_connection_id)
    .single();

  if (!connection) throw new Error('Gmail connection not found');

  const accessToken = await getValidAccessToken(
    supabase,
    connection.id,
    connection.access_token,
    connection.refresh_token,
    connection.token_expiry
  );

  // 2. Build RFC 2822 email
  // Note: Gmail API handles threading automatically when threadId is provided in the request body.
  // We omit In-Reply-To and References headers since Gmail thread IDs are not valid RFC 2822 message IDs.
  const emailLines = [
    `From: ${connection.gmail_address}`,
    `To: ${replyMetadata.sender_email}`,
    `Subject: Re: ${replyMetadata.subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    replyText
  ];
  const rawEmail = emailLines.join('\r\n');

  // 3. Base64url encode
  const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 4. Send via Gmail API
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: encodedEmail,
      threadId: replyMetadata.thread_id
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gmail Send Error: ${err}`);
  }
}

async function sendWhatsAppMessage(
    supabase: any,
    workspace_id: string,
    to: string,
    message: string
): Promise<void> {
    const metaPhoneId = Deno.env.get('META_WHATSAPP_PHONE_ID')
    const metaToken = Deno.env.get('META_WHATSAPP_TOKEN')

    if (!metaPhoneId || !metaToken) {
        console.warn('[WhatsApp] Credentials missing. Skipping delivery.');
        return;
    }

    const formattedPhone = to.replace(/\D/g, '')

    const response = await fetch(`https://graph.facebook.com/v19.0/${metaPhoneId}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${metaToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
                type: 'text',
            text: {
                preview_url: false,
                body: message
            }
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Meta API error: ${errorText}`)
    }
}

async function sendSlackMessage(
  supabase: any,
  replyMetadata: any,
  replyText: string
): Promise<void> {
  const { data: connection } = await supabase
    .from('slack_connections')
    .select('*')
    .eq('id', replyMetadata.slack_connection_id)
    .single();

  if (!connection) throw new Error('Slack connection not found');

  const res = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${connection.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channel: replyMetadata.channel_id,
      text: replyText,
      thread_ts: replyMetadata.thread_ts // Optional: reply in thread if metadata has it
    })
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }
}

async function sendTelegramMessage(
  supabase: any,
  replyMetadata: any,
  replyText: string
): Promise<void> {
  let connectionId = replyMetadata.telegram_connection_id;

  // Fallback: If connection_id is missing, try to find the active connection for this workspace
  if (!connectionId) {
    console.warn(`[Telegram] Missing telegram_connection_id in metadata. Falling back to workspace search.`);
    const { data: fallbackConn, error: fallbackError } = await supabase
      .from('telegram_connections')
      .select('id')
      .eq('workspace_id', replyMetadata.workspace_id || '')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();
    
    if (fallbackConn) {
      connectionId = fallbackConn.id;
    } else {
      console.error(`[Telegram] No connection found for workspace ${replyMetadata.workspace_id}`);
      throw new Error('Telegram connection not found and fallback failed');
    }
  }

  const { data: connection, error: connError } = await supabase
    .from('telegram_connections')
    .select('*')
    .eq('id', connectionId)
    .single();

  if (connError || !connection) {
    console.error(`[Telegram] Connection error:`, connError);
    throw new Error('Telegram connection not found');
  }

  console.log(`[Telegram] Sending message to chat_id: ${replyMetadata.chat_id} using bot token tail: ...${connection.bot_token.slice(-5)}`);

  const res = await fetch(`https://api.telegram.org/bot${connection.bot_token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: replyMetadata.chat_id,
      text: replyText
    })
  });

  const data = await res.json();
  console.log(`[Telegram] API Response:`, JSON.stringify(data, null, 2));

  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description}`);
  }
}
