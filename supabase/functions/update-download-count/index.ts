Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { token, format } = await req.json();

        if (!token) {
            throw new Error('Download token is required');
        }

        console.log('Updating download count for token:', token, 'format:', format);

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Get current download count
        const tokenResponse = await fetch(
            `${supabaseUrl}/rest/v1/download_tokens?token=eq.${token}&select=*`, 
            {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey
                }
            }
        );

        if (!tokenResponse.ok) {
            throw new Error('Failed to validate download token');
        }

        const tokens = await tokenResponse.json();
        
        if (tokens.length === 0) {
            throw new Error('Invalid download token');
        }

        const tokenData = tokens[0];
        
        // Check if token is expired
        if (new Date(tokenData.expires_at) < new Date()) {
            throw new Error('Download link has expired');
        }

        // Check download limit
        if (tokenData.download_count >= tokenData.max_downloads) {
            throw new Error('Download limit exceeded');
        }

        // Increment download count
        const newCount = tokenData.download_count + 1;
        
        const updateResponse = await fetch(
            `${supabaseUrl}/rest/v1/download_tokens?token=eq.${token}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    download_count: newCount,
                    last_downloaded_at: new Date().toISOString()
                })
            }
        );

        if (!updateResponse.ok) {
            throw new Error('Failed to update download count');
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                downloadCount: newCount,
                remaining: tokenData.max_downloads - newCount,
                format: format
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Download count update error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'UPDATE_COUNT_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});