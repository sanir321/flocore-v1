// @ts-nocheck
// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { table, id, content } = await req.json()

    if (!table || !id || !content) {
      console.error('[Embeddings] Missing required fields:', { table, id, hasContent: !!content })
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log(`[Embeddings] Generating for ${table}:${id}`)

    // Initialize Supabase AI Session
    // @ts-ignore: Supabase AI is available in the Edge Runtime
    const model = new Supabase.ai.Session('gte-small')

    // Generate embedding
    const embedding = await model.run(content, {
      mean_pool: true,
      normalize: true,
    })

    // Update the record in Supabase
    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from(table)
      .update({ embedding: JSON.stringify(embedding) })
      .eq(table === 'agent_wiki' ? 'workspace_id' : 'id', id)

    if (error) {
      console.error(`[Embeddings] Database update failed for ${table}:${id}:`, error)
      throw error
    }

    console.log(`[Embeddings] Successfully updated ${table}:${id}`)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('[Embeddings] Fatal error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
