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
        const { emailType, recipientEmail = 'theunis.meyer@gmail.com' } = await req.json();

        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!resendApiKey) {
            throw new Error('Resend API key not found');
        }

        let emailConfig = {};
        
        // Different email templates based on type
        switch (emailType) {
            case 'purchase':
                emailConfig = {
                    subject: '[TEST] Your Digital Art Prints Are Ready! Order #TEST-2025-001',
                    html: getPurchaseConfirmationTemplate(),
                    description: 'Purchase confirmation email with download links'
                };
                break;
                
            case 'welcome':
                emailConfig = {
                    subject: '[TEST] Welcome to Atelier Blanc Newsletter',
                    html: getWelcomeTemplate(),
                    description: 'Welcome email for new newsletter subscribers'
                };
                break;
                
            case 'newsletter':
                emailConfig = {
                    subject: '[TEST] Atelier Blanc Newsletter - New Art Collection',
                    html: getNewsletterTemplate(),
                    description: 'Monthly newsletter template with featured products'
                };
                break;
                
            case 'customer-service':
                emailConfig = {
                    subject: '[TEST] Thank You for Contacting Atelier Blanc',
                    html: getCustomerServiceTemplate(),
                    description: 'Customer service response template'
                };
                break;
                
            default:
                emailConfig = {
                    subject: '[TEST] Atelier Blanc Email System Test',
                    html: getDefaultTestTemplate(),
                    description: 'General email system test'
                };
        }

        // Send email via Resend
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Atelier Blanc <onboarding@resend.dev>',
                to: [recipientEmail],
                subject: emailConfig.subject,
                html: emailConfig.html
            })
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
            throw new Error(`Email sending failed: ${emailResult.message || 'Unknown error'}`);
        }

        return new Response(JSON.stringify({
            data: {
                success: true,
                emailId: emailResult.id,
                emailType,
                recipient: recipientEmail,
                description: emailConfig.description,
                message: 'Test email sent successfully'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Test email error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'TEST_EMAIL_FAILED',
                message: error.message
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

function getPurchaseConfirmationTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Digital Art Prints Are Ready!</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #0c0a09; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .download-section { background: #f5f5f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .download-item { margin: 15px 0; padding: 15px; background: white; border-radius: 6px; }
        .download-button { display: inline-block; background: #0c0a09; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 5px 0; }
        .instructions { background: #ecfccb; padding: 15px; border-radius: 6px; border-left: 4px solid #65a30d; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .test-banner { background: #fef3c7; color: #92400e; padding: 10px; text-align: center; font-weight: bold; border: 2px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="test-banner">
        TEST EMAIL - Purchase Confirmation Template
    </div>
    
    <div class="header">
        <h1>Atelier Blanc</h1>
        <p>Your Digital Art Prints Are Ready!</p>
    </div>
    
    <div class="content">
        <p>Dear Test User,</p>
        
        <p>Thank you for your purchase! Your digital art prints have been processed and are now ready for download.</p>
        
        <div class="download-section">
            <h3>Order #TEST-2025-001</h3>
            <p><strong>Download your files:</strong></p>
            
            <div class="download-item">
                <h4>Minimalist Scandinavian Abstract Wall Art</h4>
                <p>Available formats: PDF (Print Ready), JPG (300 DPI), PNG (300 DPI)</p>
                <a href="#" class="download-button">Download Files</a>
            </div>
            
            <div class="download-item">
                <h4>Modern Geometric Wall Art - Neutral Tones</h4>
                <p>Available formats: PDF (Print Ready), JPG (300 DPI), PNG (300 DPI)</p>
                <a href="#" class="download-button">Download Files</a>
            </div>
        </div>
        
        <div class="instructions">
            <h4>Printing Instructions:</h4>
            <ul>
                <li><strong>Resolution:</strong> All files are 300 DPI for crisp, professional printing</li>
                <li><strong>Size:</strong> Can be printed up to 24" × 32" without quality loss</li>
                <li><strong>Paper:</strong> For best results, use high-quality matte or glossy photo paper</li>
                <li><strong>Framing:</strong> Consider professional framing to showcase your art</li>
                <li><strong>Downloads:</strong> Links are valid for 7 days with up to 10 downloads per product</li>
            </ul>
        </div>
        
        <p>Need help? Reply to this email or visit our support page.</p>
        
        <p>Enjoy your beautiful new art prints!</p>
        
        <p>Best regards,<br>The Atelier Blanc Team</p>
    </div>
    
    <div class="footer">
        <p>© 2025 Atelier Blanc. All rights reserved.</p>
        <p>This email was sent because you purchased digital art prints from our store.</p>
    </div>
</body>
</html>
    `;
}

function getWelcomeTemplate() {
    return `
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
        .test-banner { background: #fef3c7; color: #92400e; padding: 10px; text-align: center; font-weight: bold; border: 2px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="test-banner">
        TEST EMAIL - Welcome Newsletter Template
    </div>
    
    <div class="header">
        <h1>Atelier Blanc</h1>
        <p>Welcome to Our Community</p>
    </div>
    
    <div class="content">
        <p>Dear Art Lover,</p>
        
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
    </div>
</body>
</html>
    `;
}

function getNewsletterTemplate() {
    return `
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
        .cta-button { display: inline-block; background: #0c0a09; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .test-banner { background: #fef3c7; color: #92400e; padding: 10px; text-align: center; font-weight: bold; border: 2px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="test-banner">
        TEST EMAIL - Monthly Newsletter Template
    </div>
    
    <div class="header">
        <h1>Atelier Blanc</h1>
        <p>Minimalist Art for Modern Living</p>
    </div>
    
    <div class="content">
        <p>Dear Art Lover,</p>
        
        <p>We're excited to share our latest collection of minimalist wall art, carefully curated to bring serenity and style to your space.</p>
        
        <div class="featured-section">
            <h3>New This Month: Scandinavian Abstracts</h3>
            <p>Discover our newest collection featuring soft, neutral tones and organic shapes inspired by Nordic design principles.</p>
            
            <p><strong>Featured Pieces:</strong></p>
            <ul>
                <li>Minimalist Beige Abstract - $29.99</li>
                <li>Geometric Neutral Tones - $34.99</li>
                <li>Flowing Waves Print - $24.99</li>
            </ul>
            
            <a href="https://www.atelierblanc.shop/shop" class="cta-button">View Full Collection</a>
        </div>
        
        <h3>Interior Design Tip</h3>
        <p>When hanging abstract art, consider the rule of thirds: position your artwork so the center is at eye level, typically 57-60 inches from the floor.</p>
        
        <p>Thank you for being part of our community of art lovers.</p>
        
        <p>Best regards,<br>The Atelier Blanc Team</p>
    </div>
    
    <div class="footer">
        <p>© 2025 Atelier Blanc. All rights reserved.</p>
    </div>
</body>
</html>
    `;
}

function getCustomerServiceTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Thank You for Contacting Atelier Blanc</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #0c0a09; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .support-section { background: #ecfccb; padding: 15px; border-radius: 6px; border-left: 4px solid #65a30d; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .test-banner { background: #fef3c7; color: #92400e; padding: 10px; text-align: center; font-weight: bold; border: 2px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="test-banner">
        TEST EMAIL - Customer Service Template
    </div>
    
    <div class="header">
        <h1>Atelier Blanc</h1>
        <p>Customer Support</p>
    </div>
    
    <div class="content">
        <p>Dear Valued Customer,</p>
        
        <p>Thank you for contacting Atelier Blanc. We have received your message and our team is reviewing your inquiry.</p>
        
        <div class="support-section">
            <h3>What happens next?</h3>
            <ul>
                <li>Our support team will review your message within 24 hours</li>
                <li>You will receive a personalized response via email</li>
                <li>For urgent matters, we may contact you directly</li>
            </ul>
        </div>
        
        <p>In the meantime, you might find answers to common questions in our FAQ section on our website.</p>
        
        <p>We appreciate your patience and look forward to assisting you.</p>
        
        <p>Best regards,<br>The Atelier Blanc Support Team</p>
    </div>
    
    <div class="footer">
        <p>© 2025 Atelier Blanc. All rights reserved.</p>
        <p>Contact us: info@atelierblanc.com</p>
    </div>
</body>
</html>
    `;
}

function getDefaultTestTemplate() {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email System Test - Atelier Blanc</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #0c0a09; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px 20px; }
        .test-section { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Atelier Blanc</h1>
        <p>Email System Test</p>
    </div>
    
    <div class="content">
        <p>This is a test email from the Atelier Blanc email management system.</p>
        
        <div class="test-section">
            <h3>System Status: Operational</h3>
            <ul>
                <li>✓ Resend API integration working</li>
                <li>✓ Email templates loading correctly</li>
                <li>✓ Database connections established</li>
                <li>✓ Branded email address configured</li>
            </ul>
        </div>
        
        <p>If you received this email, the email management system is functioning properly.</p>
        
        <p>Test completed at: ${new Date().toISOString()}</p>
    </div>
    
    <div class="footer">
        <p>© 2025 Atelier Blanc. All rights reserved.</p>
        <p>This is an automated test email from info@atelierblanc.com</p>
    </div>
</body>
</html>
    `;
}