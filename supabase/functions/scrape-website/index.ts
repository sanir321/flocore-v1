

// @ts-nocheck
import { load } from "cheerio"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
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
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            throw new Error('Invalid URL format');
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error('Invalid protocol. Only HTTP and HTTPS are allowed.');
        }

        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error('Invalid protocol. Only HTTP and HTTPS are allowed.');
        }

        // SSRF Protection: Resolve hostname and check IPs
        // Use node:dns and node:net from Deno (requires --allow-net --allow-read for node compat, usually available in Supabase Edge Runtime)
        // If node: APIs strictly fail, we might need a fallback, but Supabase Edge Runtime supports them.
        try {
            // @ts-ignore: Deno types vs Node types
            const dns = await import('node:dns/promises');
            // @ts-ignore: Deno types vs Node types
            const net = await import('node:net');

            const hostname = parsedUrl.hostname;

            // Resolve all addresses (IPv4 and IPv6)
            const addresses = await dns.lookup(hostname, { all: true });

            for (const { address, family } of addresses) {
                // Check if IP is private/internal
                const isPrivate = (addr: string) => {
                    // IPv4 Checks
                    if (net.isIPv4(addr)) {
                        const parts = addr.split('.').map(Number);
                        // 0.0.0.0/8
                        if (parts[0] === 0) return true;
                        // 10.0.0.0/8
                        if (parts[0] === 10) return true;
                        // 127.0.0.0/8 (Loopback)
                        if (parts[0] === 127) return true;
                        // 169.254.0.0/16 (Link-local)
                        if (parts[0] === 169 && parts[1] === 254) return true;
                        // 172.16.0.0/12
                        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
                        // 192.168.0.0/16
                        if (parts[0] === 192 && parts[1] === 168) return true;
                        return false;
                    }

                    // IPv6 Checks
                    if (net.isIPv6(addr)) {
                        // ::1 (Loopback)
                        if (addr === '::1' || addr === '::ffff:127.0.0.1') return true;
                        // Unique Local Addresses (fc00::/7) -> fc00... to fdff...
                        const firstBlock = parseInt(addr.split(':')[0], 16);
                        if ((firstBlock & 0xfe00) === 0xfc00) return true;
                        // Link-local (fe80::/10)
                        if ((firstBlock & 0xffc0) === 0xfe80) return true;
                        return false;
                    }

                    return false;
                };

                if (isPrivate(address)) {
                    throw new Error(`Restricted access to local/private network address: ${address}`);
                }
            }
        } catch (err: any) {
            // If DNS lookup fails or validation fails headers
            if (err.message && err.message.includes('Restricted access')) {
                throw err;
            }
            // Be careful not to block valid external sites if DNS lookup is weird, 
            // but for security "fail closed" is better.
            console.error('DNS/SSRF check failed:', err);
            // If we can't resolve it, we probably shouldn't fetch it if we are being strict.
            // But let's assume if it fails lookup here, fetch might also fail or it's a transient issue.
            // We will re-throw to be safe.
            throw new Error(`DNS resolution failed or blocked: ${err.message}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Failed to fetch website: ${response.statusText}`)
        }

        const html = await response.text()
        const $ = load(html)

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

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
