"use client";

import { useState } from "react";
import { useNotes } from "@/hooks/useNotes";

export default function GeneralNotes() {
  const { notes, loading, addNote, deleteNote } = useNotes();
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await addNote(newNote.trim());
      setNewNote("");
    } catch (err) {
      console.error(err);
      alert("Failed to add note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this note?")) {
      try {
        await deleteNote(id);
      } catch (err) {
        console.error(err);
        alert("Failed to delete note.");
      }
    }
  };

  if (loading) {
    return <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>Loading notes...</div>;
  }

  return (
    <div className="dashboard-container hide-scrollbar" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--accent)" }}>📝 General Notes</h2>
      
      <div className="card" style={{ marginBottom: "30px" }}>
        <h3 className="section-title">New Note</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="What's on your mind? (Books, thoughts, lessons...)"
            rows={4}
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "inherit",
              fontFamily: "inherit",
              resize: "vertical",
              outline: "none"
            }}
          />
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isSubmitting || !newNote.trim()}
            style={{ alignSelf: "flex-end", opacity: isSubmitting || !newNote.trim() ? 0.6 : 1 }}
          >
            {isSubmitting ? "Saving..." : "Save Note"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 className="section-title">Your Notes</h3>
        {notes.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>No notes yet. Start writing!</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {notes.map((note) => {
              const dateObj = new Date(note.created_at);
              return (
                <div key={note.id} style={{ 
                  background: "rgba(0,0,0,0.2)", 
                  padding: "16px", 
                  borderRadius: "12px",
                  borderLeft: "4px solid rgba(139,92,246,0.6)",
                  position: "relative"
                }}>
                  <button 
                    onClick={() => handleDelete(note.id)}
                    style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: "transparent",
                      border: "none",
                      color: "var(--danger)",
                      cursor: "pointer",
                      opacity: 0.7,
                      fontSize: "16px"
                    }}
                    title="Delete note"
                  >
                    ×
                  </button>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: "600" }}>
                    {dateObj.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.6", color: "#e2e8f0" }}>
                    {note.content}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
