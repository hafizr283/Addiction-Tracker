"use client";

import { Dispatch, SetStateAction } from "react";
import { useAuth } from "@/contexts/AuthContext";

export type PageView = "streak" | "stats" | "history" | "profile";

interface NavigationProps {
  activePage: PageView;
  setActivePage: Dispatch<SetStateAction<PageView>>;
}

export default function Navigation({ activePage, setActivePage }: NavigationProps) {
  const { signOut } = useAuth();
  
  return (
    <nav className="nav">
      <button
        className={`nav-btn ${activePage === "streak" ? "active" : ""}`}
        onClick={() => setActivePage("streak")}
      >
        🔥 Streak
      </button>
      <button
        className={`nav-btn ${activePage === "stats" ? "active" : ""}`}
        onClick={() => setActivePage("stats")}
      >
        📊 Analytics
      </button>
      <button
        className={`nav-btn ${activePage === "history" ? "active" : ""}`}
        onClick={() => setActivePage("history")}
      >
        📋 History
      </button>

      {/* Spacer to push profile to the right if there's space, or just keep it in line */}
      <div style={{ marginLeft: "auto" }}>
        <button 
          className={`nav-btn ${activePage === "profile" ? "active" : ""}`}
          onClick={() => setActivePage("profile")} 
          style={{ color: "var(--accent)" }}
        >
          👤 Profile
        </button>
      </div>
    </nav>
  );
}
