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
        const { paymentIntentId, customerEmail, customerName, customerPhone, billingAddress, cartItems } = await req.json();

        console.log('Processing digital order:', { paymentIntentId, customerEmail, customerName, cartItems });

        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const resendApiKey = Deno.env.get('RESEND_API_KEY');

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        // Use paymentIntentId as order reference
        const orderId = paymentIntentId;
        const orderNumber = `AB-${paymentIntentId.slice(-8).toUpperCase()}`;

        // Create order record in database
        const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({
                stripe_payment_intent_id: paymentIntentId,
                customer_email: customerEmail,
                status: 'completed',
                total_amount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                currency: 'USD',
                billing_address: billingAddress,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        let createdOrder = null;
        let orderDatabaseId = 999; // fallback order ID
        if (orderResponse.ok) {
            const orderData = await orderResponse.json();
            createdOrder = orderData[0];
            orderDatabaseId = createdOrder.id;
            console.log('Order created successfully:', orderDatabaseId);
        } else {
            console.warn('Failed to create order record:', await orderResponse.text());
            console.log('Using fallback order ID:', orderDatabaseId);
        }

        // Product name to filename mapping
        const productFilenameMap = {
            'Flowing Waves Abstract Print': 'flowing_waves_print.png',
            'Minimalist Neutral Abstract': 'minimalist_neutral_abstract_print.png',
            'Terracotta Botanical Print': 'terracotta_botanical_print.png',
            'Minimalist Organic Shapes': 'minimalist_organic_shapes_print.png',
            'Minimalist Line Art Print': 'minimalist_line_art_print.png',
            'Black Blob with Lines': 'black_blob_with_lines_print.png',
            'Grid Pattern Print': 'grid_pattern_print.png',
            'Stacked Half Circles': 'stacked_half_circles_print.png',
            'Split Background Arches': 'split_background_arches_print.png',
            'Monolithic Black Shape': 'monolithic_black_shape_print.png',
            'Spiral Tangle Print': 'spiral_tangle_print.png',
            'Minimalist Terracotta Geometric': 'minimalist_terracotta_geometric_print.png',
            'Minimalist Geometric Beige': 'minimalist_geometric_beige_print.png',
            'Two Brown Forms': 'two_brown_forms_print.png',
            // JPG files
            'Modern Scandinavian Minimalist Art': 'modern_scandinavian_minimalist_beige_cream_textured_wall_art.jpg',
            'Minimalist Beige Cream Geometric': 'minimalist_beige_cream_geometric_scandinavian_wall_art_decor.jpg',
            'Abstract Geometric Modern Living': 'abstract_geometric_wall_art_modern_living_room_neutral_tones.jpg',
            'Minimalist Scandinavian Abstract': 'minimalist_scandinavian_abstract_wall_art_beige_cream.jpg',
            'Abstract Neutral Art Modern': 'abstract_neutral_art_modern_home_decor.jpg',
            'Minimalist Beige Cream Textured': 'minimalist_beige_cream_textured_abstract_wall_art_scandinavian_interior.jpg',
            'Scandinavian Minimalist Abstract Alt': 'scandinavian_minimalist_abstract_wall_art_beige_cream.jpg',
            'Minimalist Geometric Wall Art': 'minimalist_geometric_wall_art_beige_cream_scandinavian_living_room.jpg',
            'Scandinavian Minimalist Textured': 'scandinavian_minimalist_textured_wall_art_cream_beige.jpg',
            'Modern Scandinavian Living Room': 'modern_scandinavian_minimalist_beige_cream_wall_art_living_room.jpg'
        };

        // Generate secure download links for each product
        const downloadLinks = [];
        
        for (const item of cartItems) {
            // Get the actual filename for this product
            const productName = item.product_name || item.name || 'Digital Art Print';
            let filename = productFilenameMap[productName];
            
            // If no specific mapping, try to find a similar file
            if (!filename) {
                // Try partial matching
                const productWords = productName.toLowerCase().split(' ');
                const matchingFilename = Object.values(productFilenameMap).find(f => 
                    productWords.some(word => f.toLowerCase().includes(word))
                );
                filename = matchingFilename || 'flowing_waves_print.png'; // fallback
                console.log(`Using fallback filename for ${productName}: ${filename}`);
            }

            // Create download token that expires in 7 days
            const downloadToken = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            // Store download token in database
            const tokenResponse = await fetch(`${supabaseUrl}/rest/v1/download_tokens`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: downloadToken,
                    order_id: orderDatabaseId,
                    product_id: item.product_id,
                    product_name: filename, // Store the actual filename
                    expires_at: expiresAt.toISOString(),
                    download_count: 0,
                    max_downloads: 10
                })
            });

            if (tokenResponse.ok) {
                downloadLinks.push({
                    productName: productName,
                    filename: filename,
                    downloadUrl: `https://www.atelierblanc.shop/secure-download.html?token=${downloadToken}&file=${filename}`,
                    formats: ['High-Resolution PNG', 'Print-Ready JPG (300 DPI)']
                });
                console.log(`Created download link for ${productName}: ${filename}`);
            } else {
                console.error('Failed to create download token:', await tokenResponse.text());
            }
        }

        console.log(`Generated ${downloadLinks.length} download links`);

        // Send confirmation email with download links
        let emailSent = false;
        let emailId = null;
        
        if (resendApiKey && downloadLinks.length > 0) {
            const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Digital Art Prints Are Ready!</title>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #fafaf9; }
        .email-container { background: white; margin: 20px auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #0c0a09 0%, #1c1917 100%); color: white; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px; }
        .header p { margin: 5px 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; margin-bottom: 25px; }
        .order-info { background: #f8f7f6; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0c0a09; }
        .download-section { margin: 30px 0; }
        .download-item { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; border: 1px solid #e7e5e4; transition: all 0.2s ease; }
        .download-item:hover { border-color: #0c0a09; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
        .download-item h4 { margin: 0 0 8px; color: #0c0a09; font-size: 16px; }
        .download-item p { margin: 5px 0; color: #666; font-size: 14px; }
        .download-button { display: inline-block; background: #0c0a09; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: 500; transition: background 0.2s ease; }
        .download-button:hover { background: #1c1917; }
        .instructions { background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #16a34a; margin: 30px 0; }
        .instructions h4 { margin: 0 0 15px; color: #16a34a; }
        .instructions ul { margin: 0; padding-left: 20px; }
        .instructions li { margin: 5px 0; color: #166534; }
        .support-section { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center; }
        .footer { background: #f5f5f4; text-align: center; padding: 30px 20px; color: #666; font-size: 14px; }
        .footer p { margin: 5px 0; }
        .social-links { margin: 20px 0; }
        .social-links a { color: #666; text-decoration: none; margin: 0 10px; }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>ATELIER BLANC</h1>
            <p>Your Digital Art Prints Are Ready!</p>
        </div>
        
        <div class="content">
            <p class="greeting">Dear ${customerName},</p>
            
            <p>Thank you for choosing Atelier Blanc! Your digital art prints have been carefully processed and are now ready for download.</p>
            
            <div class="order-info">
                <h3 style="margin: 0 0 10px; color: #0c0a09;">Order Details</h3>
                <p style="margin: 0;"><strong>Order #:</strong> ${orderNumber}</p>
                <p style="margin: 5px 0 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p style="margin: 5px 0 0;"><strong>Total:</strong> $${cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</p>
            </div>
            
            <div class="download-section">
                <h3 style="color: #0c0a09; margin-bottom: 20px;">Your Downloads (${downloadLinks.length} ${downloadLinks.length === 1 ? 'item' : 'items'})</h3>
                
                ${downloadLinks.map(link => `
                    <div class="download-item">
                        <h4>${link.productName}</h4>
                        <p>High-resolution formats included</p>
                        <a href="${link.downloadUrl}" class="download-button">Download Files</a>
                        <p style="font-size: 12px; color: #888; margin-top: 10px;">Expires in 7 days • Up to 10 downloads</p>
                    </div>
                `).join('')}
            </div>
            
            <div class="instructions">
                <h4>Professional Printing Guide</h4>
                <ul>
                    <li><strong>Resolution:</strong> All files are 300 DPI for gallery-quality printing</li>
                    <li><strong>Print Size:</strong> Scale up to 24" × 32" (61cm × 81cm) without quality loss</li>
                    <li><strong>Paper Recommendation:</strong> Premium matte or satin finish photo paper</li>
                    <li><strong>Framing:</strong> Consider museum-quality frames with UV protection</li>
                    <li><strong>Access:</strong> Download links expire in 7 days, 10 downloads per product</li>
                </ul>
            </div>
            
            <div class="support-section">
                <h4 style="margin: 0 0 10px; color: #92400e;">Need Assistance?</h4>
                <p style="margin: 0; color: #92400e;">Our team is here to help with any questions about your prints or downloads.</p>
                <p style="margin: 10px 0 0;"><a href="mailto:info@atelierblanc.com" style="color: #0c0a09;">info@atelierblanc.com</a></p>
            </div>
            
            <p style="font-size: 16px; margin-top: 30px;">Thank you for supporting independent digital art. We hope these prints bring beauty and tranquility to your space.</p>
            
            <p style="margin-top: 25px;"><strong>The Atelier Blanc Team</strong></p>
        </div>
        
        <div class="footer">
            <p><strong>ATELIER BLANC</strong></p>
            <p>Minimalist Digital Art for Modern Living</p>
            <div class="social-links">
                <a href="https://www.atelierblanc.shop">Visit Our Store</a> |
                <a href="mailto:info@atelierblanc.com">Contact Support</a>
            </div>
            <p style="margin-top: 20px; font-size: 12px; color: #999;">© 2025 Atelier Blanc. All rights reserved.</p>
            <p style="font-size: 12px; color: #999;">This email was sent to ${customerEmail} because you purchased digital art prints from our store.</p>
        </div>
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
                    from: 'Atelier Blanc <onboarding@resend.dev>',
                    to: [customerEmail],
                    subject: `Your Digital Art Prints Are Ready! Order #${orderNumber}`,
                    html: emailHtml
                })
            });

            const emailResult = await emailResponse.json();
            
            if (emailResponse.ok) {
                emailSent = true;
                emailId = emailResult.id;
                console.log('Purchase confirmation email sent successfully:', emailId);
                
                // Log email sending to database
                await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        recipient_email: customerEmail,
                        subject: `Your Digital Art Prints Are Ready! Order #${orderNumber}`,
                        template_type: 'purchase_confirmation',
                        status: 'sent',
                        resend_id: emailId,
                        order_id: orderDatabaseId
                    })
                });
            } else {
                console.error('Failed to send purchase confirmation email:', emailResult);
                
                // Log failed email attempt
                await fetch(`${supabaseUrl}/rest/v1/email_logs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${serviceRoleKey}`,
                        'apikey': serviceRoleKey,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        recipient_email: customerEmail,
                        subject: `Your Digital Art Prints Are Ready! Order #${orderNumber}`,
                        template_type: 'purchase_confirmation',
                        status: 'failed',
                        error_message: emailResult.message || 'Unknown error',
                        order_id: orderDatabaseId
                    })
                });
            }
        } else {
            console.log('Email not sent:', !resendApiKey ? 'Missing API key' : 'No download links generated');
        }

        return new Response(JSON.stringify({
            data: {
                status: 'success',
                orderId: orderId,
                orderNumber: orderNumber,
                downloadLinks: downloadLinks.length,
                emailSent: emailSent,
                emailId: emailId,
                message: `Order processed successfully, ${downloadLinks.length} download links generated${emailSent ? ', confirmation email sent' : ''}`
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Post-purchase processing error:', error);

        return new Response(JSON.stringify({
            error: {
                code: 'POST_PURCHASE_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});