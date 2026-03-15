export function getBadgeNotificationEmail(
  badgeName: string,
  badgeIcon: string,
  daysRemaining: number,
  currentStreak: number
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#06060e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06060e;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:linear-gradient(145deg,#12122a,#0c0c1a);border:1px solid rgba(139,92,246,0.2);border-radius:24px;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding:40px 32px 20px;text-align:center;">
              <div style="font-size:48px;margin-bottom:16px;">🔥</div>
              <h1 style="margin:0;font-size:24px;font-weight:800;color:#eae8ff;">
                Almost There!
              </h1>
              <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.5);">
                Your streak is on fire — don't stop now.
              </p>
            </td>
          </tr>

          <!-- Badge Card -->
          <tr>
            <td style="padding:0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.15);border-radius:16px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <div style="font-size:44px;margin-bottom:12px;">${badgeIcon}</div>
                    <h2 style="margin:0;font-size:20px;font-weight:700;color:#a78bfa;">
                      ${badgeName}
                    </h2>
                    <p style="margin:12px 0 0;font-size:32px;font-weight:900;color:#eae8ff;">
                      ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} away
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Current streak -->
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.4);letter-spacing:1px;text-transform:uppercase;">Current Streak</p>
              <p style="margin:4px 0 0;font-size:36px;font-weight:900;color:#c4b5fd;">${currentStreak} Days</p>
            </td>
          </tr>

          <!-- Motivational text -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.55);font-style:italic;">
                "Every day you resist is a day you grow stronger. You're so close to unlocking <strong style="color:#a78bfa;">${badgeName}</strong> — keep going!"
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.25);">
                Addiction Tracker • Stay Strong 💪
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
