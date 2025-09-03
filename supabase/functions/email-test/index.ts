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
        const { testEmail } = await req.json();
        const emailAddress = testEmail || 'theunis.meyer@gmail.com';

        console.log('Testing email system for:', emailAddress);

        // Sample order data for testing
        const sampleOrderData = {
            orderId: 'TEST_' + Date.now(),
            paymentIntentId: 'pi_test_' + Math.random().toString(36).substr(2, 9),
            customerEmail: emailAddress,
            customerName: 'Test Customer',
            customerPhone: '+1 (555) 123-4567',
            billingAddress: {
                line1: '123 Art Street',
                line2: 'Suite 4B',
                city: 'New York',
                state: 'NY',
                postal_code: '10001',
                country: 'US'
            },
            cartItems: [
                {
                    product_id: 'test_1',
                    product_name: 'Minimalist Botanical Print',
                    quantity: 1,
                    price: 15.00,
                    product_image_url: 'https://an0hzdkhixe4.space.minimax.io/images/terracotta_botanical_print.png'
                },
                {
                    product_id: 'test_2', 
                    product_name: 'Abstract Geometric Wall Art',
                    quantity: 1,
                    price: 12.00,
                    product_image_url: 'https://an0hzdkhixe4.space.minimax.io/images/minimalist_geometric_beige_print.png'
                },
                {
                    product_id: 'test_3',
                    product_name: 'Flowing Waves Print',
                    quantity: 1,
                    price: 18.00,
                    product_image_url: 'https://an0hzdkhixe4.space.minimax.io/images/flowing_waves_print.png'
                }
            ]
        };

        // Generate test download links
        const downloadLinks = [];
        
        for (const item of sampleOrderData.cartItems) {
            const downloadToken = crypto.randomUUID();
            
            downloadLinks.push({
                productName: item.product_name,
                downloadUrl: `https://an0hzdkhixe4.space.minimax.io/download/${downloadToken}`,
                formats: ['PDF (Print Ready)', 'JPG (300 DPI)', 'PNG (300 DPI)'],
                price: `$${item.price.toFixed(2)}`
            });
        }

        const totalAmount = sampleOrderData.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Create the HTML email template
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Digital Art Prints Are Ready!</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f4;
        }
        .email-container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #0c0a09 0%, #292524 100%);
            color: white; 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 300; 
            letter-spacing: 2px;
        }
        .header p { 
            margin: 8px 0 0; 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 40px 30px; 
        }
        .greeting { 
            font-size: 18px; 
            margin-bottom: 20px;
        }
        .order-summary { 
            background: #f8fafc; 
            border: 1px solid #e2e8f0;
            border-radius: 8px; 
            padding: 25px; 
            margin: 25px 0; 
        }
        .order-summary h3 { 
            margin: 0 0 15px; 
            color: #1e293b; 
            font-size: 20px;
        }
        .download-item { 
            margin: 20px 0; 
            padding: 20px; 
            background: white; 
            border-radius: 8px; 
            border: 1px solid #e5e7eb;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .download-item h4 { 
            margin: 0 0 8px; 
            color: #1f2937; 
            font-size: 16px;
        }
        .product-info { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 12px;
        }
        .formats { 
            color: #6b7280; 
            font-size: 14px; 
            margin-bottom: 15px;
        }
        .download-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #0c0a09 0%, #374151 100%);
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .download-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        .instructions { 
            background: linear-gradient(135deg, #ecfccb 0%, #f0fdf4 100%);
            padding: 25px; 
            border-radius: 8px; 
            border-left: 4px solid #16a34a; 
            margin: 25px 0;
        }
        .instructions h4 { 
            margin: 0 0 15px; 
            color: #15803d;
            font-size: 18px;
        }
        .instructions ul { 
            margin: 0; 
            padding-left: 20px;
        }
        .instructions li { 
            margin: 8px 0; 
            color: #166534;
        }
        .total-section {
            background: #f1f5f9;
            padding: 15px 20px;
            border-radius: 6px;
            margin: 20px 0;
            text-align: right;
        }
        .total-amount {
            font-size: 18px;
            font-weight: 600;
            color: #0f172a;
        }
        .footer { 
            background: #f8fafc;
            text-align: center; 
            padding: 30px; 
            border-top: 1px solid #e2e8f0;
            color: #64748b; 
            font-size: 14px; 
        }
        .footer p { 
            margin: 5px 0;
        }
        .support-section {
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 8px;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .support-section h4 {
            margin: 0 0 10px;
            color: #92400e;
        }
        @media (max-width: 600px) {
            .email-container { margin: 10px; }
            .header, .content { padding: 25px 20px; }
            .order-summary, .download-item { padding: 15px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ATELIER BLANC</h1>
            <p>Your Digital Art Prints Are Ready!</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear ${sampleOrderData.customerName},
            </div>
            
            <p>Thank you for your purchase! Your carefully curated digital art prints have been processed and are now ready for immediate download.</p>
            
            <div class="order-summary">
                <h3>Order Details</h3>
                <p><strong>Order Number:</strong> ${sampleOrderData.orderId}</p>
                <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}</p>
                <p><strong>Email:</strong> ${sampleOrderData.customerEmail}</p>
                
                <div class="total-section">
                    <div class="total-amount">Total: $${totalAmount.toFixed(2)}</div>
                </div>
                
                <h4 style="margin-top: 20px; margin-bottom: 15px;">Your Downloads:</h4>
                
                ${downloadLinks.map(link => `
                    <div class="download-item">
                        <div class="product-info">
                            <h4>${link.productName}</h4>
                            <span style="font-weight: 600; color: #059669;">${link.price}</span>
                        </div>
                        <div class="formats">Available formats: ${link.formats.join(' • ')}</div>
                        <a href="${link.downloadUrl}" class="download-button">Download Your Files</a>
                    </div>
                `).join('')}
            </div>
            
            <div class="instructions">
                <h4>Professional Printing Guide</h4>
                <ul>
                    <li><strong>Resolution:</strong> All files are professionally prepared at 300 DPI for crisp, gallery-quality printing</li>
                    <li><strong>Print Sizes:</strong> Optimized for printing up to 24" × 32" without any quality loss</li>
                    <li><strong>Paper Recommendations:</strong> Use premium matte or semi-gloss photo paper for best results</li>
                    <li><strong>Framing Tips:</strong> Consider professional matting and framing to showcase your art beautifully</li>
                    <li><strong>Download Access:</strong> Your links remain active for 7 days with up to 10 downloads per product</li>
                    <li><strong>Color Accuracy:</strong> For best color reproduction, ensure your printer is calibrated</li>
                </ul>
            </div>
            
            <div class="support-section">
                <h4>Need Assistance?</h4>
                <p>Our customer support team is here to help! Reply to this email or visit our support center for printing tips, technical assistance, or any questions about your digital art collection.</p>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">Thank you for choosing Atelier Blanc. We hope these beautiful prints bring joy and elegance to your space!</p>
            
            <p style="margin-top: 25px;"><strong>With appreciation,</strong><br>
            The Atelier Blanc Curatorial Team</p>
        </div>
        
        <div class="footer">
            <p><strong>© 2025 Atelier Blanc</strong> | Premium Digital Art Collection</p>
            <p>This email was sent because you purchased digital art prints from our curated collection.</p>
            <p style="margin-top: 15px; font-size: 12px; color: #9ca3af;">If you have questions about printing or downloading, please don't hesitate to reach out.</p>
        </div>
    </div>
</body>
</html>
        `;

        // Create a plain text version for email clients that don't support HTML
        const emailText = `
ATELIER BLANC - Your Digital Art Prints Are Ready!

Dear ${sampleOrderData.customerName},

Thank you for your purchase! Your digital art prints are now ready for download.

Order Details:
- Order Number: ${sampleOrderData.orderId}
- Total: $${totalAmount.toFixed(2)}
- Email: ${sampleOrderData.customerEmail}

Your Downloads:
${downloadLinks.map(link => `
• ${link.productName} (${link.price})
  Download: ${link.downloadUrl}
  Formats: ${link.formats.join(', ')}`).join('\n')}

Printing Instructions:
• Resolution: 300 DPI for professional quality
• Print sizes up to 24" × 32"
• Use high-quality photo paper
• Links valid for 7 days, 10 downloads per product

Need help? Reply to this email.

Best regards,
The Atelier Blanc Team

© 2025 Atelier Blanc. All rights reserved.
        `;

        // Try to send email using Resend (if API key is available)
        let emailSent = false;
        let emailError = null;

        try {
            // Note: In production, you would add RESEND_API_KEY to your Supabase secrets
            const resendApiKey = Deno.env.get('RESEND_API_KEY');
            
            if (resendApiKey) {
                const emailResponse = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        from: 'Atelier Blanc <downloads@atelierblanc.com>',
                        to: [emailAddress],
                        subject: `Your Digital Art Collection is Ready! Order ${sampleOrderData.orderId}`,
                        html: emailHtml,
                        text: emailText,
                        tags: [{
                            name: 'category',
                            value: 'order_confirmation'
                        }]
                    })
                });

                if (emailResponse.ok) {
                    const emailResult = await emailResponse.json();
                    console.log('Email sent successfully:', emailResult.id);
                    emailSent = true;
                } else {
                    const errorResult = await emailResponse.json();
                    emailError = errorResult.message || 'Email sending failed';
                    console.error('Email sending failed:', errorResult);
                }
            } else {
                console.log('RESEND_API_KEY not found - email simulation mode');
                emailSent = 'simulated'; // Indicate this was simulated
            }
        } catch (error) {
            emailError = error.message;
            console.error('Email sending error:', error);
        }

        // Return comprehensive test results
        return new Response(JSON.stringify({
            data: {
                status: 'success',
                testType: 'email_system_test',
                results: {
                    emailGenerated: true,
                    emailSent: emailSent,
                    emailError: emailError,
                    recipientEmail: emailAddress,
                    orderData: {
                        orderId: sampleOrderData.orderId,
                        customerName: sampleOrderData.customerName,
                        totalAmount: totalAmount,
                        itemCount: sampleOrderData.cartItems.length
                    },
                    downloadLinks: downloadLinks.length,
                    emailPreview: {
                        subject: `Your Digital Art Collection is Ready! Order ${sampleOrderData.orderId}`,
                        htmlLength: emailHtml.length,
                        textLength: emailText.length
                    }
                },
                emailHtml: emailHtml, // Include for preview purposes
                emailText: emailText,
                timestamp: new Date().toISOString()
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Email test error:', error);

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