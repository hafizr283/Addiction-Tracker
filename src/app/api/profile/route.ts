import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Fetch current user's profile
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('display_name, show_on_leaderboard')
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ profile: profile || null });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create or update user profile
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { displayName, showOnLeaderboard } = await request.json();

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
      return NextResponse.json({ error: 'Display name must be at least 2 characters' }, { status: 400 });
    }

    // Upsert profile
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: user.id,
        display_name: displayName.trim(),
        show_on_leaderboard: !!showOnLeaderboard,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error: any) {
    console.error('Profile POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
