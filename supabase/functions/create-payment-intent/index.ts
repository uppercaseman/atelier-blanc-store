Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const { amount, currency = 'usd', cartItems, customerEmail, billingAddress, productType = 'digital' } = await req.json();

        console.log('Payment intent request received:', { amount, currency, cartItemsCount: cartItems?.length, productType });

        // Validate required parameters
        if (!amount || amount <= 0) {
            throw new Error('Valid amount is required');
        }

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            throw new Error('Cart items are required');
        }

        // Validate cart items structure
        for (const item of cartItems) {
            if (!item.product_id || !item.quantity || !item.price || !item.product_name) {
                throw new Error('Each cart item must have product_id, quantity, price, and product_name');
            }
            if (item.quantity <= 0 || item.price <= 0) {
                throw new Error('Cart item quantity and price must be positive');
            }
        }

        // Get environment variables
        const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!stripeSecretKey) {
            console.error('Stripe secret key not found in environment');
            throw new Error('Stripe secret key not configured');
        }

        if (!serviceRoleKey || !supabaseUrl) {
            throw new Error('Supabase configuration missing');
        }

        console.log('Environment variables validated, creating payment intent...');

        // Calculate total amount from cart items to verify
        const calculatedAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (Math.abs(calculatedAmount - amount) > 0.01) {
            throw new Error('Amount mismatch: calculated amount does not match provided amount');
        }

        // Get user from auth header if provided
        let userId = null;
        const authHeader = req.headers.get('authorization');
        if (authHeader) {
            try {
                const token = authHeader.replace('Bearer ', '');
                const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'apikey': serviceRoleKey
                    }
                });
                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    userId = userData.id;
                    console.log('User identified:', userId);
                }
            } catch (error) {
                console.log('Could not get user from token:', error.message);
            }
        }

        // Prepare Stripe payment intent data
        const stripeParams = new URLSearchParams();
        stripeParams.append('amount', Math.round(amount * 100).toString()); // Convert to cents
        stripeParams.append('currency', currency);
        stripeParams.append('payment_method_types[]', 'card');
        stripeParams.append('metadata[customer_email]', customerEmail || '');
        stripeParams.append('metadata[cart_items_count]', cartItems.length.toString());
        stripeParams.append('metadata[total_items]', cartItems.reduce((sum, item) => sum + item.quantity, 0).toString());
        stripeParams.append('metadata[user_id]', userId || '');
        stripeParams.append('metadata[product_type]', productType); // Digital or physical
        
        // For digital products, add specific metadata
        if (productType === 'digital') {
            stripeParams.append('metadata[delivery_type]', 'digital_download');
            stripeParams.append('metadata[shipping_required]', 'false');
        }

        // Create payment intent with Stripe
        const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: stripeParams.toString()
        });

        console.log('Stripe API response status:', stripeResponse.status);

        if (!stripeResponse.ok) {
            const errorData = await stripeResponse.text();
            console.error('Stripe API error:', errorData);
            throw new Error(`Stripe API error: ${errorData}`);
        }

        const paymentIntent = await stripeResponse.json();
        console.log('Payment intent created successfully:', paymentIntent.id);

        // Create order record in database - no shipping address for digital products
        const orderData = {
            user_id: userId,
            stripe_payment_intent_id: paymentIntent.id,
            status: 'pending',
            total_amount: amount,
            currency: currency,
            shipping_address: null, // No shipping for digital products
            billing_address: billingAddress || null,
            customer_email: customerEmail || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Creating order in database...');

        const orderResponse = await fetch(`${supabaseUrl}/rest/v1/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(orderData)
        });

        if (!orderResponse.ok) {
            const errorText = await orderResponse.text();
            console.error('Failed to create order:', errorText);
            // If order creation fails, we should cancel the payment intent
            try {
                await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntent.id}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${stripeSecretKey}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });
                console.log('Payment intent cancelled due to order creation failure');
            } catch (cancelError) {
                console.error('Failed to cancel payment intent:', cancelError.message);
            }
            throw new Error(`Failed to create order: ${errorText}`);
        }

        const order = await orderResponse.json();
        const orderId = order[0].id;
        console.log('Order created successfully:', orderId);

        // Create order items
        const orderItems = cartItems.map(item => ({
            order_id: orderId,
            product_id: item.product_id,
            quantity: item.quantity,
            price_at_time: item.price,
            product_name: item.product_name,
            product_image_url: item.product_image_url || null,
            created_at: new Date().toISOString()
        }));

        console.log('Creating order items...');

        const orderItemsResponse = await fetch(`${supabaseUrl}/rest/v1/order_items`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'apikey': serviceRoleKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderItems)
        });

        if (!orderItemsResponse.ok) {
            const errorText = await orderItemsResponse.text();
            console.error('Failed to create order items:', errorText);
            // Log error but don't fail the entire operation
            console.warn('Order created but order items creation failed');
        } else {
            console.log('Order items created successfully');
        }

        const result = {
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                orderId: orderId,
                amount: amount,
                currency: currency,
                status: 'pending',
                productType: productType,
                deliveryType: productType === 'digital' ? 'instant_download' : 'shipping'
            }
        };

        console.log('Payment intent creation completed successfully for', productType, 'products');

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Payment intent creation error:', error);

        const errorResponse = {
            error: {
                code: 'PAYMENT_INTENT_FAILED',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});