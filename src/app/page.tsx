"use client";

import { useState, useEffect } from "react";
import Navigation, { PageView } from "@/components/Navigation";
import StreakDashboard from "@/components/StreakDashboard";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import HistoryDashboard from "@/components/HistoryDashboard";
import UserProfile from "@/components/UserProfile";
import Login from "@/app/login/page";
import EmergencyModal from "@/components/EmergencyModal";
import { useAuth } from "@/contexts/AuthContext";
import { useRelapses } from "@/hooks/useRelapses";
import { useUrges } from "@/hooks/useUrges";
import { useMoods } from "@/hooks/useMoods";

export default function Home() {
  const [activePage, setActivePage] = useState<PageView>("streak");
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const { relapses, loading: relapsesLoading, addRelapse, deleteRelapse, importRelapses } = useRelapses();
  const { urges, addUrge } = useUrges();
  const { moods, addMood } = useMoods();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#08080f] text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="text-4xl mb-4">🔥</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <main>
      {/* Background Effects */}
      <div className="bg-effects"></div>
      <div className="particles" id="particles"></div>

      {/* Navigation */}
      <Navigation activePage={activePage} setActivePage={setActivePage} />

      {/* Dynamic Content Rendering */}
      {activePage === "streak" && (
        <StreakDashboard 
          relapses={relapses} 
          addUrge={addUrge} 
          moods={moods} 
          addMood={addMood} 
        />
      )}
      {activePage === "stats" && <AnalyticsDashboard relapses={relapses} urges={urges} moods={moods} />}
      {activePage === "history" && (
        <HistoryDashboard 
          relapses={relapses} 
          urges={urges}
          moods={moods}
          importRelapses={importRelapses}
          onAdd={addRelapse} 
          onDelete={deleteRelapse} 
          loading={relapsesLoading}
        />
      )}
      {activePage === "profile" && <UserProfile />}

      {/* Floating Panic Button */}
      <button className="floating-panic-btn" onClick={() => setIsEmergencyOpen(true)} title="I HAVE AN URGE">
        🚨
      </button>

      {/* Emergency Breathing Modal */}
      <EmergencyModal isOpen={isEmergencyOpen} onClose={() => setIsEmergencyOpen(false)} />
    </main>
  );
}
