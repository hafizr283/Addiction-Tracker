import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // 1. Get all users who opted-in to the leaderboard
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, display_name, created_at')
      .eq('show_on_leaderboard', true);

    if (profilesError) throw profilesError;
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // 2. For each user, calculate current streak and best streak
    const leaderboard = [];

    for (const profile of profiles) {
      const { data: relapses, error: relapsesError } = await supabaseAdmin
        .from('relapses')
        .select('date')
        .eq('user_id', profile.id)
        .order('date', { ascending: false });

      if (relapsesError) continue;

      // Get user creation date for streak baseline
      const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      if (usersError) continue;
      const authUser = users.find(u => u.id === profile.id);
      if (!authUser) continue;

      const now = Date.now();
      let currentStreak = 0;
      let bestStreak = 0;

      if (!relapses || relapses.length === 0) {
        // No relapses ever — streak since account creation
        currentStreak = Math.floor((now - new Date(authUser.created_at).getTime()) / (1000 * 60 * 60 * 24));
        bestStreak = currentStreak;
      } else {
        // Current streak = time since most recent relapse
        currentStreak = Math.floor((now - new Date(relapses[0].date).getTime()) / (1000 * 60 * 60 * 24));

        // Best streak = max gap between consecutive relapses (or from creation to first relapse)
        let maxGap = currentStreak;
        for (let i = 0; i < relapses.length - 1; i++) {
          const gap = Math.floor(
            (new Date(relapses[i].date).getTime() - new Date(relapses[i + 1].date).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (gap > maxGap) maxGap = gap;
        }
        // Gap from account creation to earliest relapse
        const firstRelapseGap = Math.floor(
          (new Date(relapses[relapses.length - 1].date).getTime() - new Date(authUser.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (firstRelapseGap > maxGap) maxGap = firstRelapseGap;

        bestStreak = maxGap;
      }

      const joinedDaysAgo = Math.floor((now - new Date(authUser.created_at).getTime()) / (1000 * 60 * 60 * 24));

      leaderboard.push({
        displayName: profile.display_name,
        currentStreak,
        bestStreak,
        joinedDaysAgo,
      });
    }

    // Sort by current streak descending
    leaderboard.sort((a, b) => b.currentStreak - a.currentStreak);

    // Add rank
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
