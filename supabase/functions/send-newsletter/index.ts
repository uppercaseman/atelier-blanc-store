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
        const { campaignId, templateId, testEmail } = await req.json();

        if (!campaignId && !templateId) {
            throw new Error('Campaign ID or Template ID is required');
        }

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        if (!serviceRoleKey || !supabaseUrl || !resendApiKey) {
            throw new Error('Missing required environment variables');
        }

        let template;
        let campaign;

        // Get template content
        if (templateId) {
            const templateResponse = await fetch(`${supabaseUrl}/rest/v1/email_templates?id=eq.${templateId}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });
            const templates = await templateResponse.json();
            if (templates.length === 0) {
                throw new Error('Template not found');
            }
            template = templates[0];
        }

        // Get campaign details if campaignId provided
        if (campaignId) {
            const campaignResponse = await fetch(`${supabaseUrl}/rest/v1/newsletter_campaigns?id=eq.${campaignId}`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });
            const campaigns = await campaignResponse.json();
            if (campaigns.length === 0) {
                throw new Error('Campaign not found');
            }
            campaign = campaigns[0];

            // Get template for campaign
            if (campaign.template_id) {
                const templateResponse = await fetch(`${supabaseUrl}/rest/v1/email_templates?id=eq.${campaign.template_id}`, {
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    }
                });
                const templates = await templateResponse.json();
                if (templates.length > 0) {
                    template = templates[0];
                }
            }
        }

        // Get recipients (active subscribers only)
        let recipients = [];
        if (testEmail) {
            recipients = [{ email: testEmail, first_name: 'Test', last_name: 'User' }];
        } else {
            const subscribersResponse = await fetch(`${supabaseUrl}/rest/v1/email_subscribers?is_active=eq.true`, {
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                }
            });
            recipients = await subscribersResponse.json();
        }

        if (recipients.length === 0) {
            throw new Error('No active subscribers found');
        }

        // Default newsletter template if none provided
        if (!template) {
            template = {
                subject: 'Atelier Blanc Newsletter - New Art Collection',
                html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Atelier Blanc Newsletter</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #0c0a09; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .featured-section { background: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .product-grid { display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0; }
        .product-item { flex: 1; min-width: 250px; background: white; padding: 15px; border-radius: 6px; }
        .cta-button { display: inline-block; background: #0c0a09; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .unsubscribe { font-size: 12px; color: #999; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Atelier Blanc</h1>
        <p>Minimalist Art for Modern Living</p>
    </div>
    
    <div class="content">
        <p>Dear {{firstName}},</p>
        
        <p>We're excited to share our latest collection of minimalist wall art, carefully curated to bring serenity and style to your space.</p>
        
        <div class="featured-section">
            <h3>New This Month: Scandinavian Abstracts</h3>
            <p>Discover our newest collection featuring soft, neutral tones and organic shapes inspired by Nordic design principles.</p>
            
            <div class="product-grid">
                <div class="product-item">
                    <h4>Minimalist Beige Abstract</h4>
                    <p>Perfect for creating a calming atmosphere in any room.</p>
                    <p><strong>$29.99</strong></p>
                </div>
                
                <div class="product-item">
                    <h4>Geometric Neutral Tones</h4>
                    <p>Contemporary design with clean lines and balanced composition.</p>
                    <p><strong>$34.99</strong></p>
                </div>
            </div>
            
            <a href="https://www.atelierblanc.shop/shop" class="cta-button">View Full Collection</a>
        </div>
        
        <h3>Interior Design Tip</h3>
        <p>When hanging abstract art, consider the rule of thirds: position your artwork so the center is at eye level, typically 57-60 inches from the floor.</p>
        
        <p>Thank you for being part of our community of art lovers.</p>
        
        <p>Best regards,<br>The Atelier Blanc Team</p>
    </div>
    
    <div class="footer">
        <p>© 2025 Atelier Blanc. All rights reserved.</p>
        <div class="unsubscribe">
            <p>You can <a href="{{unsubscribeUrl}}">unsubscribe</a> at any time.</p>
        </div>
    </div>
</body>
</html>
                `
            };
        }

        let sentCount = 0;
        const errors = [];

        // Send emails in batches to avoid rate limits
        const batchSize = 10;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (recipient) => {
                try {
                    // Personalize email content
                    let personalizedHtml = template.html_content
                        .replace(/{{firstName}}/g, recipient.first_name || 'Art Lover')
                        .replace(/{{lastName}}/g, recipient.last_name || '')
                        .replace(/{{unsubscribeUrl}}/g, `https://www.atelierblanc.shop/unsubscribe?token=${recipient.unsubscribe_token}`);

                    const emailResponse = await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${resendApiKey}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            from: 'Atelier Blanc <onboarding@resend.dev>',
                            to: [recipient.email],
                            subject: template.subject,
                            html: personalizedHtml
                        })
                    });

                    const emailResult = await emailResponse.json();

                    if (emailResponse.ok) {
                        sentCount++;
                        
                        // Log successful sending
                        await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                recipient_email: recipient.email,
                                subject: template.subject,
                                template_type: 'newsletter',
                                status: 'sent',
                                resend_id: emailResult.id
                            })
                        });
                    } else {
                        errors.push({
                            email: recipient.email,
                            error: emailResult.message || 'Unknown error'
                        });
                        
                        // Log failed sending
                        await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${serviceRoleKey}`,
                                'apikey': serviceRoleKey,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                recipient_email: recipient.email,
                                subject: template.subject,
                                template_type: 'newsletter',
                                status: 'failed',
                                error_message: emailResult.message || 'Unknown error'
                            })
                        });
                    }
                } catch (error) {
                    errors.push({
                        email: recipient.email,
                        error: error.message
                    });
                }
            });

            await Promise.all(batchPromises);
            
            // Small delay between batches
            if (i + batchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        // Update campaign status if campaignId provided
        if (campaignId) {
            await fetch(`${supabaseUrl}/rest/v1/newsletter_campaigns?id=eq.${campaignId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    recipient_count: sentCount
                })
            });
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                message: 'Newsletter sent successfully',
                totalRecipients: recipients.length,
                sentCount,
                errorCount: errors.length,
                errors: errors.length > 0 ? errors : undefined
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Newsletter sending error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'NEWSLETTER_SEND_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});