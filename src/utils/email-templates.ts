export function getBadgeNotificationEmail(
  badgeName: string,
  badgeIcon: string,
  daysRemaining: number,
  currentStreak: number,
  daysRequired: number
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

          <!-- Alert Box -->
          <tr>
            <td style="padding:0 32px 16px;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:12px;">
                <tr>
                  <td style="padding:16px;">
                    <p style="margin:0;font-size:15px;font-weight:700;color:#fca5a5;text-transform:uppercase;">🚨 DO NOT RELAPSE NOW 🚨</p>
                    <p style="margin:8px 0 0;font-size:13px;color:#fecaca;line-height:1.5;">
                      The pain of starting over is far worse than the pain of discipline. You are exactly ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} away from the ${daysRequired}-day milestone.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Motivational text -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.7);font-style:italic;">
                "Every day you resist, your brain's neuroplasticity is rewiring itself. Those urges you feel? They are the addiction starving. As you push through to ${daysRequired} days, the neural pathways for dopamine will begin to heal and the intense cravings will naturally decrease. <strong style="color:#a78bfa;">Stay hard.</strong>"
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

export function getRelapseMotivationEmail(type: string, lostStreakDays: number = 0, bestStreakDays: number = 0): string {
  let headerTitle = "Don't Give Up Now.";
  let colorTheme = "239,68,68"; // red
  let mainMessage = "";
  
  const statsHtml = `
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:12px;padding:16px;margin-bottom:24px;display:table;width:100%;">
      <div style="display:table-cell;width:50%;text-align:center;border-right:1px solid rgba(255,255,255,0.05);">
        <div style="font-size:24px;font-weight:700;color:rgba(${colorTheme}, 1);margin-bottom:4px;">${lostStreakDays}</div>
        <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Streak Lost</div>
      </div>
      <div style="display:table-cell;width:50%;text-align:center;">
        <div style="font-size:24px;font-weight:700;color:#fcd34d;margin-bottom:4px;">${bestStreakDays}</div>
        <div style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">All-Time Best</div>
      </div>
    </div>
  `;

  if (type === "Only Porn") {
    mainMessage = `
      ${statsHtml}
      <h2 style="color:#fca5a5;margin:0 0 16px;font-size:20px;">You slipped into the pixels.</h2>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e2e8f0;">
        You looked at porn without masturbating. It's a slip, but recognize what just happened: your brain craved super-stimuli and the dopamine rush. 
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e2e8f0;">
        <strong>The danger right now is the "Chaser Effect".</strong> Because you peeked, your brain will bombard you with urges over the next 48 hours to "finish the job". 
      </p>
      <ul style="color:#e2e8f0;font-size:15px;line-height:1.7;text-align:left;padding-left:20px;">
        <li>Get away from all screens immediately.</li>
        <li>Your physical energy is still intact since you didn't finish. Use it. Do pushups. Take a walk.</li>
        <li>The urge will pass, but ONLY if you starve it right now.</li>
      </ul>
    `;
  } else if (type === "Only Masturbation") {
    colorTheme = "245,158,11"; // amber
    headerTitle = "A physical slip, but mentally strong.";
    mainMessage = `
      ${statsHtml}
      <h2 style="color:#fcd34d;margin:0 0 16px;font-size:20px;">You released, but without the pixels.</h2>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e2e8f0;">
        You slipped up and masturbated, but you avoided porn. From a neurological standpoint, avoiding the artificial super-stimuli of porn is a massive victory for your dopamine receptors.
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e2e8f0;">
        You will feel a drop in physical energy and motivation today, but the brain fog won't be as intense. 
      </p>
      <p style="margin:0;font-size:16px;line-height:1.6;color:#fbbf24;font-style:italic;">
        "Do not use this as an excuse to watch porn now. Pick yourself up, accept the loss of your streak, and rebuild your energy. Tomorrow is day one."
      </p>
    `;
  } else {
    // "Porn + Masturbation" or "Light Porn + Masturbation"
    mainMessage = `
      ${statsHtml}
      <h2 style="color:#fca5a5;margin:0 0 16px;font-size:20px;">The Accountability Check.</h2>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e2e8f0;">
        You just experienced a full relapse. Right now, you might feel shame, brain fog, and a deep lack of motivation. <strong>That is exactly what the addiction wants you to feel.</strong>
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e2e8f0;">
        When you binge, you dig the hole deeper. The next 2 to 3 days are going to be critical. The "Chaser Effect" will try to convince you that "since the streak is already 0, one more time won't hurt."
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.05);border-radius:8px;margin-bottom:16px;">
        <tr>
          <td style="padding:16px;">
            <p style="margin:0;font-size:15px;font-weight:700;color:#fff;">Your Action Plan for the Next 24 Hours:</p>
            <ol style="color:#cbd5e1;font-size:14px;line-height:1.6;margin:8px 0 0;padding-left:24px;">
              <li>Get up right now and wash your face or take a cold shower.</li>
              <li>Log exactly what triggered you in your notes so it doesn't happen again.</li>
              <li>Forgive yourself. Guilt leads to more relapses. Discipline leads to freedom.</li>
            </ol>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:16px;line-height:1.6;color:#e2e8f0;">
        You lost the battle today, but the war is far from over. Show up tomorrow.
      </p>
    `;
  }

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
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:linear-gradient(145deg,#12122a,#0c0c1a);border:1px solid rgba(${colorTheme},0.3);border-radius:24px;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding:40px 32px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.05);">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#eae8ff;">
                ${headerTitle}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${mainMessage}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">
                Addiction Tracker • We are in this together.
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

export function getHourlyFollowupEmail(hours: number): string {
  let headerTitle = `Checking In (${hours} Hours Later)`;
  let colorTheme = "167,139,250"; // purple
  let mainMessage = "";
  
  if (hours === 2) {
    mainMessage = `
      <h2 style="color:#c4b5fd;margin:0 0 16px;font-size:20px;">The urge will try to return.</h2>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e2e8f0;">
        It's been exactly two hours since your slip. The initial shock or shame might be wearing off, and your brain might start whispering that "since the streak is already zero, one more time won't hurt."
      </p>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e2e8f0;">
        <strong>Do not listen to the Chaser Effect.</strong> Binging is what destroys your dopamine baseline, not just a single slip. Stay away from the screen right now.
      </p>
    `;
  } else if (hours === 6) {
    mainMessage = `
      <h2 style="color:#c4b5fd;margin:0 0 16px;font-size:20px;">Physical energy is returning.</h2>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e2e8f0;">
        You've made it 6 hours. The brain fog is starting to lift slightly, and your physical energy is trying to stabilize. 
      </p>
      <p style="margin:0;font-size:16px;line-height:1.6;color:#e2e8f0;">
        Drink a large glass of water, go for a walk if you haven't already, and refuse to peek at anything explicit. You are rebuilding your discipline hour by hour.
      </p>
    `;
  } else if (hours === 12) {
    headerTitle = "The First Night";
    mainMessage = `
      <h2 style="color:#c4b5fd;margin:0 0 16px;font-size:20px;">Survive the night.</h2>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e2e8f0;">
        It's been 12 hours. Usually, the first night after a relapse is the most dangerous. Your brain is used to the dopamine spike before bed.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.6;color:#fbbf24;font-style:italic;">
        "Leave your phone in another room tonight. Read a physical book. The urges will pass while you sleep. Just survive tonight."
      </p>
    `;
  } else {
    // 24 hours
    headerTitle = "Day 1 Complete.";
    colorTheme = "34,197,94"; // green
    mainMessage = `
      <h2 style="color:#4ade80;margin:0 0 16px;font-size:20px;">You survived the hardest 24 hours.</h2>
      <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#e2e8f0;">
        Congratulations. You officially made it past the first 24 hours without falling into the binge cycle. The "Chaser Effect" is beginning to fade drastically.
      </p>
      <p style="margin:0;font-size:16px;line-height:1.6;color:#e2e8f0;">
        You protected your dopamine baseline. Now, it's just about stacking days again. Show up tomorrow.
      </p>
    `;
  }

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
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:linear-gradient(145deg,#12122a,#0c0c1a);border:1px solid rgba(${colorTheme},0.3);border-radius:24px;overflow:hidden;">
          <tr>
            <td style="padding:40px 32px 20px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.05);">
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#eae8ff;">
                ${headerTitle}
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              ${mainMessage}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
              <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3);">
                Addiction Tracker • Hour by Hour.
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
