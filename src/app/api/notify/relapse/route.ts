import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/utils/resend';
import { getRelapseMotivationEmail } from '@/utils/email-templates';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { email, type } = await request.json();

    if (!email || !type) {
      return NextResponse.json({ error: 'Missing email or type' }, { status: 400 });
    }

    // 1. Fetch user by email
    const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;
    const user = users.find(u => u.email === email);
    
    let lostStreakDays = 0;
    let bestStreakDays = 0;

    if (user) {
      // 2. Fetch user's relapses
      const { data: relapses, error: relapsesError } = await supabaseAdmin
        .from('relapses')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (!relapsesError && relapses && relapses.length > 0) {
        // Because the new relapse was just inserted, relapses[0] is the current relapse
        // the lost streak is the difference between relapses[0] and relapses[1] (if exists)
        if (relapses.length > 1) {
          const r0 = new Date(relapses[0].date).getTime();
          const r1 = new Date(relapses[1].date).getTime();
          lostStreakDays = Math.max(0, Math.floor((r0 - r1) / (1000 * 60 * 60 * 24)));
        } else {
          // Compare with account creation
          const r0 = new Date(relapses[0].date).getTime();
          const created = new Date(user.created_at).getTime();
          lostStreakDays = Math.max(0, Math.floor((r0 - created) / (1000 * 60 * 60 * 24)));
        }

        // Calculate best streak
        let currentBest = 0;
        for (let i = 0; i < relapses.length - 1; i++) {
          const diff = new Date(relapses[i].date).getTime() - new Date(relapses[i+1].date).getTime();
          const d = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (d > currentBest) currentBest = d;
        }
        const createdDiff = new Date(relapses[relapses.length - 1].date).getTime() - new Date(user.created_at).getTime();
        const createdDays = Math.floor(createdDiff / (1000 * 60 * 60 * 24));
        if (createdDays > currentBest) currentBest = createdDays;

        bestStreakDays = currentBest;
      }
    }

    const html = getRelapseMotivationEmail(type, lostStreakDays, bestStreakDays);

    const { error: emailError } = await resend.emails.send({
      from: 'Addiction Tracker <onboarding@resend.dev>',
      to: email,
      subject: `Immediate Motivation: Stay Strong`,
      html,
    });

    if (emailError) {
      console.error(`Error sending relapse email to ${email}:`, emailError);
      return NextResponse.json({ error: emailError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notify relapse error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
