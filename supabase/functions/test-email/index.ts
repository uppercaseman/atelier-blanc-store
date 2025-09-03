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
        // Sample order data for testing
        const testOrderData = {
            orderId: 'TEST-2025-001',
            paymentIntentId: 'pi_test_1234567890',
            customerEmail: 'theunis.meyer@gmail.com',
            customerName: 'Theunis Meyer',
            cartItems: [
                {
                    product_id: 1,
                    product_name: 'Minimalist Scandinavian Abstract Wall Art - Beige & Cream',
                    price: 29.99,
                    quantity: 1
                },
                {
                    product_id: 2,
                    product_name: 'Modern Geometric Wall Art - Neutral Tones',
                    price: 34.99,
                    quantity: 1
                },
                {
                    product_id: 3,
                    product_name: 'Flowing Waves Print - Minimalist Design',
                    price: 24.99,
                    quantity: 2
                }
            ]
        };

        console.log('Testing email system with sample data:', testOrderData.orderId);

        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!resendApiKey) {
            throw new Error('Resend API key not found in environment');
        }

        // Generate sample download links (mock for testing)
        const downloadLinks = [];
        
        for (const item of testOrderData.cartItems) {
            // Create mock download tokens for testing
            const downloadToken = crypto.randomUUID();
            
            downloadLinks.push({
                productName: item.product_name,
                downloadUrl: `${supabaseUrl ? supabaseUrl.replace('.supabase.co', '') : 'https://test'}.space.minimax.io/download/${downloadToken}`,
                formats: ['PDF (Print Ready)', 'JPG (300 DPI)', 'PNG (300 DPI)']
            });
        }

        // Generate the email HTML using the same template structure as process-digital-order
        const emailHtml = `
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
        ⚠️ TEST EMAIL - This is a sample email for testing purposes ⚠️
    </div>
    
    <div class="header">
        <h1>Atelier Blanc</h1>
        <p>Your Digital Art Prints Are Ready!</p>
    </div>
    
    <div class="content">
        <p>Dear ${testOrderData.customerName},</p>
        
        <p>Thank you for your purchase! Your digital art prints have been processed and are now ready for download.</p>
        
        <div class="download-section">
            <h3>Order #${testOrderData.orderId}</h3>
            <p><strong>Download your files:</strong></p>
            
            ${downloadLinks.map(link => `
                <div class="download-item">
                    <h4>${link.productName}</h4>
                    <p>Available formats: ${link.formats.join(', ')}</p>
                    <a href="${link.downloadUrl}" class="download-button">Download Files</a>
                </div>
            `).join('')}
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

        // Send email via Resend API
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Atelier Blanc <test@atelierblanc.com>',
                to: [testOrderData.customerEmail],
                subject: `[TEST] Your Digital Art Prints Are Ready! Order #${testOrderData.orderId}`,
                html: emailHtml
            })
        });

        const emailResult = await emailResponse.json();

        if (!emailResponse.ok) {
            console.error('Failed to send email:', emailResult);
            throw new Error(`Email sending failed: ${emailResult.message || 'Unknown error'}`);
        }

        console.log('Test email sent successfully:', emailResult.id);

        // Save HTML preview to workspace (this is a mock file write for demonstration)
        // In a real edge function, we'd need to use Supabase storage or another service
        console.log('HTML preview would be saved to: /workspace/email-preview.html');
        console.log('Email HTML length:', emailHtml.length, 'characters');

        return new Response(JSON.stringify({
            data: {
                status: 'success',
                emailId: emailResult.id,
                orderId: testOrderData.orderId,
                recipient: testOrderData.customerEmail,
                downloadLinksGenerated: downloadLinks.length,
                htmlPreview: '/workspace/email-preview.html',
                message: 'Test email sent successfully and HTML preview generated'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Email testing error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'EMAIL_TEST_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});