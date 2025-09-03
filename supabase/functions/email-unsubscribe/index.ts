Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const token = url.searchParams.get('token');

        if (!token) {
            throw new Error('Unsubscribe token is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        if (!serviceRoleKey || !supabaseUrl || !resendApiKey) {
            throw new Error('Missing required environment variables');
        }

        // Find subscriber by unsubscribe token
        const findResponse = await fetch(`${supabaseUrl}/rest/v1/email_subscribers?unsubscribe_token=eq.${token}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        const subscribers = await findResponse.json();
        
        if (subscribers.length === 0) {
            throw new Error('Invalid unsubscribe token');
        }

        const subscriber = subscribers[0];

        // Update subscriber to inactive
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/email_subscribers?unsubscribe_token=eq.${token}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                is_active: false,
                updated_at: new Date().toISOString()
            })
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to unsubscribe');
        }

        // Send unsubscribe confirmation email
        const confirmationHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Unsubscribe Confirmation - Atelier Blanc</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #0c0a09; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .confirmation-section { background: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .resubscribe { background: #ecfccb; padding: 15px; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Atelier Blanc</h1>
        <p>Unsubscribe Confirmation</p>
    </div>
    
    <div class="content">
        <p>Dear ${subscriber.first_name || 'Art Lover'},</p>
        
        <div class="confirmation-section">
            <h3>You've been successfully unsubscribed</h3>
            <p>We're sorry to see you go! You will no longer receive newsletters from Atelier Blanc.</p>
        </div>
        
        <div class="resubscribe">
            <h4>Changed your mind?</h4>
            <p>You can always resubscribe by visiting our website and signing up again.</p>
        </div>
        
        <p>Thank you for being part of our community.</p>
        
        <p>Best regards,<br>The Atelier Blanc Team</p>
    </div>
    
    <div class="footer">
        <p>© 2025 Atelier Blanc. All rights reserved.</p>
    </div>
</body>
</html>
        `;

        // Send confirmation email
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Atelier Blanc <onboarding@resend.dev>',
                to: [subscriber.email],
                subject: 'Unsubscribe Confirmation - Atelier Blanc',
                html: confirmationHtml
            })
        });

        const emailResult = await emailResponse.json();

        if (emailResponse.ok) {
            // Log email sending
            await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipient_email: subscriber.email,
                    subject: 'Unsubscribe Confirmation - Atelier Blanc',
                    template_type: 'unsubscribe',
                    status: 'sent',
                    resend_id: emailResult.id
                })
            });
        }

        // Return HTML response for direct browser access
        const successHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Unsubscribed - Atelier Blanc</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .success { background: #ecfccb; padding: 20px; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="success">
        <h2>Successfully Unsubscribed</h2>
        <p>You have been unsubscribed from Atelier Blanc newsletters.</p>
        <p>A confirmation email has been sent to ${subscriber.email}</p>
    </div>
</body>
</html>
        `;

        return new Response(successHtml, {
            headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        });

    } catch (error) {
        console.error('Unsubscribe error:', error);

        const errorHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Unsubscribe Error - Atelier Blanc</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .error { background: #fecaca; padding: 20px; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="error">
        <h2>Unsubscribe Error</h2>
        <p>${error.message}</p>
    </div>
</body>
</html>
        `;

        return new Response(errorHtml, {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'text/html' }
        });
    }
});