// Safe Supabase client - only initializes on client side
// This prevents build-time errors when env vars aren't available

let supabaseClient: any = null;

export async function getSupabase() {
  // Only run on client side
  if (typeof window === 'undefined') {
    return null;
  }

  // Return cached client if exists
  if (supabaseClient) {
    return supabaseClient;
  }

  // Check for env vars
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Missing Supabase environment variables');
    return null;
  }

  // Dynamically import and create client
  const { createBrowserClient } = await import('@supabase/ssr');
  supabaseClient = createBrowserClient(url, key);
  
  return supabaseClient;
}
