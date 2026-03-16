import { NextResponse } from 'next/server';
import { resend } from '@/utils/resend';
import { getBadgeNotificationEmail } from '@/utils/email-templates';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Please provide ?email=your@email.com' }, { status: 400 });
  }

  try {
    const html = getBadgeNotificationEmail(
      'One Week Clear',  // badge name
      '🥈',              // badge icon
      2,                  // days remaining
      5                   // current streak
    );

    const { data, error } = await resend.emails.send({
      from: 'Addiction Tracker <onboarding@resend.dev>',
      to: email,
      subject: '🏆 TEST: 2 days until "One Week Clear" badge!',
      html,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
