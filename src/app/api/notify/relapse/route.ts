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
    
    let lostStreakTime = "0 hours";
    let bestStreakTime = "0 hours";
    let relapseTimeFormatted = "";

    if (user) {
      // 2. Fetch user's relapses
      const { data: relapses, error: relapsesError } = await supabaseAdmin
        .from('relapses')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (!relapsesError && relapses && relapses.length > 0) {
        const currentRelapseDate = new Date(relapses[0].date);
        relapseTimeFormatted = currentRelapseDate.toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true
        });

        const lastDateStr = relapses.length > 1 ? relapses[1].date : user.created_at;
        const diffMs = currentRelapseDate.getTime() - new Date(lastDateStr).getTime();
        const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
        const diffDays = Math.floor(diffHours / 24);
        const remainingHours = diffHours % 24;
        
        if (diffDays > 0) {
          lostStreakTime = `${diffDays} days, ${remainingHours} hours`;
        } else {
          lostStreakTime = `${diffHours} hours`;
        }

        // Calculate best streak
        let bestMs = 0;
        for (let i = 0; i < relapses.length - 1; i++) {
          const ms = new Date(relapses[i].date).getTime() - new Date(relapses[i+1].date).getTime();
          if (ms > bestMs) bestMs = ms;
        }
        const createdMs = new Date(relapses[relapses.length - 1].date).getTime() - new Date(user.created_at).getTime();
        if (createdMs > bestMs) bestMs = createdMs;

        const bestHoursTotal = Math.max(0, Math.floor(bestMs / (1000 * 60 * 60)));
        const bestDays = Math.floor(bestHoursTotal / 24);
        const bestRemainingHours = bestHoursTotal % 24;
        
        if (bestDays > 0) {
          bestStreakTime = `${bestDays} days, ${bestRemainingHours} hours`;
        } else {
          bestStreakTime = `${bestHoursTotal} hours`;
        }
      }
    }

    const html = getRelapseMotivationEmail(type, lostStreakTime, bestStreakTime, relapseTimeFormatted);

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
