import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Generate an anonymous name from user ID
function generateAnonName(userId: string): string {
  const adjectives = ['Silent', 'Brave', 'Iron', 'Shadow', 'Steady', 'Calm', 'Bold', 'Swift', 'Noble', 'Steel'];
  const nouns = ['Warrior', 'Phoenix', 'Titan', 'Eagle', 'Wolf', 'Lion', 'Hawk', 'Storm', 'Knight', 'Monk'];
  // Use last few chars of UUID as a seed for consistent name
  const hash = userId.replace(/-/g, '');
  const adjIdx = parseInt(hash.substring(0, 4), 16) % adjectives.length;
  const nounIdx = parseInt(hash.substring(4, 8), 16) % nouns.length;
  const tag = hash.substring(hash.length - 3).toUpperCase();
  return `${adjectives[adjIdx]}${nouns[nounIdx]}_${tag}`;
}

export async function GET() {
  try {
    // 1. Get ALL users from auth
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // 2. Get all existing profiles (for custom display names)
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name');

    const profileMap = new Map((profiles || []).map(p => [p.id, p.display_name]));

    // 3. For each user, calculate streaks
    const leaderboard = [];

    for (const authUser of users) {
      const { data: relapses } = await supabaseAdmin
        .from('relapses')
        .select('date')
        .eq('user_id', authUser.id)
        .order('date', { ascending: false });

      const now = Date.now();
      let currentStreak = 0;
      let bestStreak = 0;

      if (!relapses || relapses.length === 0) {
        currentStreak = Math.floor((now - new Date(authUser.created_at).getTime()) / (1000 * 60 * 60 * 24));
        bestStreak = currentStreak;
      } else {
        currentStreak = Math.floor((now - new Date(relapses[0].date).getTime()) / (1000 * 60 * 60 * 24));
        let maxGap = currentStreak;
        for (let i = 0; i < relapses.length - 1; i++) {
          const gap = Math.floor(
            (new Date(relapses[i].date).getTime() - new Date(relapses[i + 1].date).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (gap > maxGap) maxGap = gap;
        }
        const firstGap = Math.floor(
          (new Date(relapses[relapses.length - 1].date).getTime() - new Date(authUser.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (firstGap > maxGap) maxGap = firstGap;
        bestStreak = maxGap;
      }

      // Use custom name if set, otherwise auto-generate
      const displayName = profileMap.get(authUser.id) || generateAnonName(authUser.id);
      const joinedDaysAgo = Math.floor((now - new Date(authUser.created_at).getTime()) / (1000 * 60 * 60 * 24));

      leaderboard.push({
        userId: authUser.id,
        displayName,
        currentStreak,
        bestStreak,
        joinedDaysAgo,
        isCustomName: profileMap.has(authUser.id),
      });
    }

    // Sort by current streak descending
    leaderboard.sort((a, b) => b.currentStreak - a.currentStreak);

    const ranked = leaderboard.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    return NextResponse.json({ leaderboard: ranked });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
