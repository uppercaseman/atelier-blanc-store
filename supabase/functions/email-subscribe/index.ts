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
        const { email, firstName, lastName, preferences = {} } = await req.json();

        if (!email) {
            throw new Error('Email is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        if (!serviceRoleKey || !supabaseUrl || !resendApiKey) {
            throw new Error('Missing required environment variables');
        }

        // Check if email already exists
        const checkResponse = await fetch(`${supabaseUrl}/rest/v1/email_subscribers?email=eq.${encodeURIComponent(email)}`, {
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            }
        });

        const existingSubscribers = await checkResponse.json();
        
        if (existingSubscribers.length > 0) {
            // Update existing subscriber
            const updateResponse = await fetch(`${supabaseUrl}/rest/v1/email_subscribers?email=eq.${encodeURIComponent(email)}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    is_active: true,
                    preferences,
                    subscribed_at: new Date().toISOString()
                })
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update subscriber');
            }
        } else {
            // Create new subscriber
            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/email_subscribers`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    first_name: firstName,
                    last_name: lastName,
                    preferences,
                    is_active: true
                })
            });

            if (!insertResponse.ok) {
                throw new Error('Failed to create subscriber');
            }
        }

        // Send welcome email
        const welcomeEmailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Atelier Blanc Newsletter</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #0c0a09; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .welcome-section { background: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .unsubscribe { font-size: 12px; color: #999; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Atelier Blanc</h1>
        <p>Welcome to Our Community</p>
    </div>
    
    <div class="content">
        <p>Dear ${firstName || 'Art Lover'},</p>
        
        <p>Thank you for subscribing to the Atelier Blanc newsletter! We're delighted to welcome you to our community of art enthusiasts.</p>
        
        <div class="welcome-section">
            <h3>What to Expect:</h3>
            <ul>
                <li>Monthly curated collections of minimalist art prints</li>
                <li>Exclusive previews of new artwork</li>
                <li>Interior design tips and inspiration</li>
                <li>Special subscriber-only offers</li>
                <li>Behind-the-scenes insights into our creative process</li>
            </ul>
        </div>
        
        <p>Our next newsletter will arrive soon with our latest collection of Scandinavian-inspired wall art.</p>
        
        <p>Thank you for joining us on this artistic journey.</p>
        
        <p>Best regards,<br>The Atelier Blanc Team</p>
    </div>
    
    <div class="footer">
        <p>© 2025 Atelier Blanc. All rights reserved.</p>
        <div class="unsubscribe">
            <p>You can <a href="https://www.atelierblanc.shop/unsubscribe?token=${existingSubscribers[0]?.unsubscribe_token || 'TOKEN'}">unsubscribe</a> at any time.</p>
        </div>
    </div>
</body>
</html>
        `;

        // Send welcome email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Atelier Blanc <onboarding@resend.dev>',
                to: [email],
                subject: 'Welcome to Atelier Blanc Newsletter',
                html: welcomeEmailHtml
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
                    recipient_email: email,
                    subject: 'Welcome to Atelier Blanc Newsletter',
                    template_type: 'welcome',
                    status: 'sent',
                    resend_id: emailResult.id
                })
            });
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: 'Successfully subscribed to newsletter',
                emailSent: emailResponse.ok
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Newsletter subscription error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'SUBSCRIPTION_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});