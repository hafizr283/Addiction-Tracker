"use client";

import { BADGES, getBadgesStatus } from "@/utils/badges";

interface BadgeListProps {
  currentStreak: number;
  bestStreak: number;
}

export default function BadgeList({ currentStreak, bestStreak }: BadgeListProps) {
  const badgeStatuses = getBadgesStatus(currentStreak, bestStreak);

  return (
    <div className="badges-container">
      <div className="section-title">🏆 Achievement Badges</div>
      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
        Badges unlock based on your <strong style={{color:"var(--gold)"}}>Best Streak</strong>. 
        Glowing badges indicate you are <strong style={{color:"var(--green)"}}>currently</strong> holding that streak.
      </p>
      
      <div className="badges-grid">
        {badgeStatuses.map(b => (
          <div 
            key={b.id} 
            className={`badge-card ${b.unlocked ? 'unlocked' : 'locked'} ${b.active ? 'active' : ''}`}
            style={b.unlocked ? { '--badge-color': b.color } as any : {}}
          >
            <div className="badge-icon-wrapper">
              {b.unlocked ? (
                <div className="badge-icon" style={{ textShadow: b.active ? `0 0 15px ${b.color}` : 'none' }}>
                  {b.icon}
                </div>
              ) : (
                <div className="badge-icon locked-icon">🔒</div>
              )}
            </div>
            <div className="badge-info">
              <div className="badge-name">{b.name}</div>
              <div className="badge-req">{b.daysRequired} Days</div>
              {b.unlocked && <div className="badge-desc">{b.description}</div>}
            </div>
            {b.active && <div className="badge-active-ping"></div>}
          </div>
        ))}
      </div>
    </div>
  );
}
