import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/utils/resend';
import { BADGES } from '@/utils/badges';
import { getBadgeNotificationEmail, getDailyAiAssessmentEmail } from '@/utils/email-templates';
import { analyzeData } from '@/utils/analysis';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use the service role key for server-side admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getCurrentStreak(relapseDates: string[], userCreatedAt: string): number {
  if (relapseDates.length === 0) {
    const start = new Date(userCreatedAt);
    const diffMs = new Date().getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }
  // relapseDates should be sorted desc
  const lastRelapse = new Date(relapseDates[0]);
  const diffMs = new Date().getTime() - lastRelapse.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getNextBadge(currentStreak: number) {
  // Find the first badge the user has NOT yet reached
  for (const badge of BADGES) {
    if (currentStreak < badge.daysRequired) {
      return badge;
    }
  }
  return null; // All badges unlocked
}

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get all users with their emails from auth.users
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    if (usersError) throw usersError;

    let emailsSent = 0;
    let usersChecked = 0;

    for (const user of users) {
      if (!user.email) continue;
      usersChecked++;

      // 2. Get this user's relapses (sorted desc by date)
      const { data: relapses, error: relapsesError } = await supabaseAdmin
        .from('relapses')
        .select('id, user_id, type, date, notes, created_at')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (relapsesError) {
        console.error(`Error fetching relapses for ${user.id}:`, relapsesError);
        continue;
      }

      const stats = analyzeData(relapses || [], [], [], user.created_at);
      const currentStreak = Math.floor(stats.currentDays);
      const nextBadge = getNextBadge(currentStreak);

      // -- 3. AI DAILY EMAIL LOGIC --
      try {
        if (process.env.GEMINI_API_KEY) {
          const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: `You are a savage, ruthless accountability partner for an addiction recovery tracker.
You are writing a daily report email to the user. You have ZERO mercy. Analyze their stats and give them a short, brutal reality check.
Stats: Streak: ${stats.currentDays.toFixed(1)}d, Best: ${stats.bestDays.toFixed(1)}d, Risk: ${stats.riskLevel}, Prod: ${stats.productivityScore.toFixed(0)}%, Conf: ${stats.confidenceScore.toFixed(0)}%, Relapses Today: ${stats.relapsesToday}.
Keep it to 2-3 short, punching paragraphs. Use HTML tags like <b>, <i>, <br> for formatting, but no Markdown.`
          });

          const result = await model.generateContent("Write my daily savage assessment.");
          const aiText = result.response.text();

          const aiHtml = getDailyAiAssessmentEmail(stats, aiText);

          await resend.emails.send({
            from: 'Savage AI <onboarding@resend.dev>',
            to: user.email,
            subject: `🔥 Daily Assessment: ${stats.riskLevel} Risk`,
            html: aiHtml,
          });
        }
      } catch (aiError) {
        console.error('Error generating AI email for', user.email, aiError);
      }

      // -- 4. BADGE NOTIFICATION LOGIC --
      if (!nextBadge) continue; // All badges unlocked, skip

      const daysRemaining = nextBadge.daysRequired - currentStreak;

      // 5. Only notify if 1-2 days away from next badge
      if (daysRemaining > 2 || daysRemaining <= 0) continue;

      // 6. Check if we already sent this badge notification
      const { data: existing } = await supabaseAdmin
        .from('sent_notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('badge_id', nextBadge.id)
        .maybeSingle();

      if (existing) continue; // Already notified

      // 7. Send the badge email
      const html = getBadgeNotificationEmail(
        nextBadge.name,
        nextBadge.icon,
        daysRemaining,
        currentStreak,
        nextBadge.daysRequired
      );

      const { error: emailError } = await resend.emails.send({
        from: 'Addiction Tracker <onboarding@resend.dev>',
        to: user.email,
        subject: `🏆 ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} until "${nextBadge.name}" badge!`,
        html,
      });

      if (emailError) {
        console.error(`Error sending email to ${user.email}:`, emailError);
        continue;
      }

      // 8. Record the notification so we don't send it again
      await supabaseAdmin.from('sent_notifications').insert({
        user_id: user.id,
        badge_id: nextBadge.id,
      });

      emailsSent++;
    }

    return NextResponse.json({
      success: true,
      usersChecked,
      emailsSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron notify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
