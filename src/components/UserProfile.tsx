"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function UserProfile() {
  const { user, updatePassword, signOut } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMsg({ text: "Password must be at least 6 characters.", type: "error" });
      return;
    }
    
    setIsUpdating(true);
    setMsg({ text: "", type: "" });
    const { error } = await updatePassword(newPassword);
    
    if (error) {
      setMsg({ text: error.message, type: "error" });
    } else {
      setMsg({ text: "Password updated successfully!", type: "success" });
      setNewPassword("");
    }
    setIsUpdating(false);
  };

  return (
    <div className="page active" style={{ padding: "90px 24px 40px", maxWidth: "600px", margin: "0 auto" }}>
      <div className="section-title">👤 User Profile</div>
      
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", marginBottom: "24px" }}>
        <h3 style={{ fontSize: "14px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Account Details</h3>
        <p style={{ fontSize: "16px", color: "var(--text-primary)", fontWeight: 500 }}>{user?.email || "Unknown User"}</p>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
          Provider: {user?.app_metadata?.provider || "Email"}
        </p>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", marginBottom: "32px" }}>
        <h3 style={{ fontSize: "14px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Security</h3>
        
        {user?.app_metadata?.provider === "email" ? (
          <form onSubmit={handlePasswordChange}>
            {msg.text && (
              <div className={`success-msg`} style={{ background: msg.type === "error" ? "rgba(239, 68, 68, 0.1)" : "", color: msg.type === "error" ? "var(--red)" : "", borderColor: msg.type === "error" ? "rgba(239, 68, 68, 0.2)" : "", marginBottom: "16px" }}>
                {msg.text}
              </div>
            )}
            <div className="form-group">
              <label>New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            <button type="submit" disabled={isUpdating} className="btn-save" style={{ marginTop: "8px" }}>
              {isUpdating ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : (
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            You are logged in via <strong>{user?.app_metadata?.provider}</strong>. Password changes are managed by your provider.
          </p>
        )}
      </div>

      <button onClick={signOut} className="btn-cancel" style={{ width: "100%", padding: "14px", fontWeight: "bold", border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)" }}>
        Log Out
      </button>
    </div>
  );
}
