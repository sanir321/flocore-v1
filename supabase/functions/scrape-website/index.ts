
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { url } = await req.json()

        if (!url) {
            throw new Error('URL is required')
        }

        console.log(`Scraping URL: ${url}`)

        // Validate URL
        try {
            new URL(url);
        } catch (_) {
            throw new Error('Invalid URL format');
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        if (!response.ok) {
            throw new Error(`Failed to fetch website: ${response.statusText}`)
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // Remove scripts, styles, and other non-content elements
        $('script').remove()
        $('style').remove()
        $('noscript').remove()
        $('iframe').remove()
        $('nav').remove()
        $('footer').remove()
        $('header').remove()

        // Get title
        const title = $('title').text().trim()

        // Get body text
        // We try to find the main content first
        let content = $('main').text() || $('article').text() || $('body').text()

        // Clean up whitespace
        content = content
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 8000) // Limit to 8000 chars to avoid token limits

        return new Response(
            JSON.stringify({ title, content }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
