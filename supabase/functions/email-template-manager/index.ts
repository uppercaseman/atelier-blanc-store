Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Missing required environment variables');
        }

        const url = new URL(req.url);
        const templateId = url.searchParams.get('id');

        // GET - List all templates or get specific template
        if (req.method === 'GET') {
            let fetchUrl = `${supabaseUrl}/rest/v1/email_templates`;
            if (templateId) {
                fetchUrl += `?id=eq.${templateId}`;
            }

            const response = await fetch(fetchUrl, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            const templates = await response.json();

            return new Response(JSON.stringify({ data: templates }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // POST - Create new template
        if (req.method === 'POST') {
            const { name, subject, html_content, text_content, template_type } = await req.json();

            if (!name || !subject || !html_content || !template_type) {
                throw new Error('Missing required fields: name, subject, html_content, template_type');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/email_templates`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    subject,
                    html_content,
                    text_content,
                    template_type
                })
            });

            if (!response.ok) {
                throw new Error('Failed to create template');
            }

            const newTemplate = await response.json();

            return new Response(JSON.stringify({
                data: {
                    success: true,
                    template: newTemplate,
                    message: 'Template created successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // PUT - Update existing template
        if (req.method === 'PUT') {
            if (!templateId) {
                throw new Error('Template ID is required for updates');
            }

            const { name, subject, html_content, text_content, template_type } = await req.json();

            const response = await fetch(`${supabaseUrl}/rest/v1/email_templates?id=eq.${templateId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    subject,
                    html_content,
                    text_content,
                    template_type,
                    updated_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update template');
            }

            return new Response(JSON.stringify({
                data: {
                    success: true,
                    message: 'Template updated successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // DELETE - Delete template
        if (req.method === 'DELETE') {
            if (!templateId) {
                throw new Error('Template ID is required for deletion');
            }

            const response = await fetch(`${supabaseUrl}/rest/v1/email_templates?id=eq.${templateId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete template');
            }

            return new Response(JSON.stringify({
                data: {
                    success: true,
                    message: 'Template deleted successfully'
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw new Error('Method not allowed');

    } catch (error) {
        console.error('Email template manager error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'TEMPLATE_OPERATION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});