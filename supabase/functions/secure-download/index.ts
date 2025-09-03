import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const filename = url.searchParams.get('file');

    if (!token || !filename) {
      return new Response(JSON.stringify({
        error: 'Missing token or filename parameter'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Use service role key for database operations to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Validate the download token
    const { data: tokenData, error: tokenError } = await supabase
      .from('download_tokens')
      .select('*')
      .eq('token', token)
      .eq('product_name', filename)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token validation failed:', tokenError);
      return new Response(JSON.stringify({
        error: 'Invalid or expired download token'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if token is still valid
    const expiresAt = new Date(tokenData.expires_at);
    const now = new Date();
    
    if (now > expiresAt) {
      // Delete expired token
      await supabase
        .from('download_tokens')
        .delete()
        .eq('token', token);
        
      return new Response(JSON.stringify({
        error: 'Download link has expired. Please contact support for assistance.'
      }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check download count limit
    if (tokenData.download_count >= tokenData.max_downloads) {
      return new Response(JSON.stringify({
        error: 'Download limit exceeded. Please contact support for assistance.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update download count
    try {
      await supabase
        .from('download_tokens')
        .update({ 
          download_count: tokenData.download_count + 1
        })
        .eq('token', token);
    } catch (error) {
      console.warn('Failed to update download count:', error);
    }

    // Download the file from Supabase Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('art_files')
      .download(filename);

    if (downloadError || !fileData) {
      console.error('File download error:', downloadError);
      return new Response(JSON.stringify({
        error: 'File not found or download failed'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get file extension to determine content type
    const fileExtension = filename.toLowerCase().split('.').pop();
    let contentType = 'application/octet-stream';
    
    switch (fileExtension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'zip':
        contentType = 'application/zip';
        break;
    }

    // Convert blob to ArrayBuffer for proper response
    const fileArrayBuffer = await fileData.arrayBuffer();

    console.log(`Successfully serving file: ${filename} (${fileArrayBuffer.byteLength} bytes)`);

    // Return the file with appropriate headers for download
    return new Response(fileArrayBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Content-Length': fileArrayBuffer.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('Download function error:', error);
    return new Response(JSON.stringify({
      error: {
        code: 'DOWNLOAD_ERROR',
        message: 'Internal server error occurred during download'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
