import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/utils/resend';
import { getHourlyFollowupEmail } from '@/utils/email-templates';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FOLLOWUP_TARGETS = [
  { hour: 2, key: 'hour_2', rangeMax: 6 },
  { hour: 6, key: 'hour_6', rangeMax: 12 },
  { hour: 12, key: 'hour_12', rangeMax: 24 },
  { hour: 24, key: 'hour_24', rangeMax: 48 },
];

export async function GET(request: Request) {
  // Try getting token from Bearer header or search param
  const authHeader = request.headers.get('authorization');
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get recent relapses from the last 48 hours to process followups
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    // Using admin to bypass RLS
    const { data: recentRelapses, error: relapsesError } = await supabaseAdmin
      .from('relapses')
      .select('id, user_id, date')
      .gte('date', fortyEightHoursAgo);

    if (relapsesError) throw relapsesError;

    let emailsSent = 0;
    
    // We need users' emails. Since relapses table lacks emails, fetch users from auth.
    // In a prod app, we might want to query `auth.users` differently or map it, 
    // but listUsers is fine for a small scale cron job.
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    const userEmailMap = new Map(users.map(u => [u.id, u.email]));

    for (const relapse of (recentRelapses || [])) {
      const email = userEmailMap.get(relapse.user_id);
      if (!email) continue;

      const relapseDate = new Date(relapse.date);
      const hoursPassed = (Date.now() - relapseDate.getTime()) / (1000 * 60 * 60);

      // Determine which followup target matches the current hoursPassed
      let targetFollowup = null;
      for (const target of FOLLOWUP_TARGETS) {
        if (hoursPassed >= target.hour && hoursPassed < target.rangeMax) {
          targetFollowup = target;
          break; // We only process the most recent matching followup
        }
      }

      if (!targetFollowup) continue;

      // Check if we already sent this specific followup
      const { data: existing } = await supabaseAdmin
        .from('sent_relapse_followups')
        .select('id')
        .eq('relapse_id', relapse.id)
        .eq('followup_type', targetFollowup.key)
        .maybeSingle();

      if (existing) continue; // Already sent

      // Send the followup email
      const html = getHourlyFollowupEmail(targetFollowup.hour);
      const { error: emailError } = await resend.emails.send({
        from: 'Addiction Tracker <onboarding@resend.dev>',
        to: email,
        subject: `Checking In: Hour ${targetFollowup.hour} Post-Relapse`,
        html,
      });

      if (emailError) {
        console.error(`Error sending followup to ${email}:`, emailError);
        continue;
      }

      // Record it as sent
      await supabaseAdmin.from('sent_relapse_followups').insert({
        relapse_id: relapse.id,
        user_id: relapse.user_id,
        followup_type: targetFollowup.key,
      });

      emailsSent++;
    }

    return NextResponse.json({
      success: true,
      relapsesChecked: recentRelapses?.length || 0,
      emailsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Hourly followups error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
