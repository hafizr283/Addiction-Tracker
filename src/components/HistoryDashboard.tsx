"use client";

import { useState, useRef } from "react";
import { Relapse } from "@/hooks/useRelapses";
import { Urge } from "@/hooks/useUrges";
import { Mood } from "@/hooks/useMoods";
import Papa from "papaparse";

function getTimeOfDay(dateStr: string) {
  const h = new Date(dateStr).getHours();
  if (h >= 0 && h < 5) return { label: '🌑 Deep Night (12-5 AM)', key: 'deep_night' };
  if (h >= 5 && h < 9) return { label: '🌅 Early Morning (5-9 AM)', key: 'morning' };
  if (h >= 9 && h < 12) return { label: '☀️ Late Morning (9-12 PM)', key: 'late_morning' };
  if (h >= 12 && h < 17) return { label: '🌤️ Afternoon (12-5 PM)', key: 'afternoon' };
  if (h >= 17 && h < 21) return { label: '🌆 Evening (5-9 PM)', key: 'evening' };
  return { label: '🌙 Late Night (9-12 AM)', key: 'late_night' };
}

function formatDuration(ms: number) {
  if (ms < 0) return '—';
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hrs = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hrs > 0) parts.push(`${hrs}h`);
  parts.push(`${mins}m`);
  return parts.join(' ');
}

function getStreakBadgeClass(daysFloat: number) {
  if (daysFloat >= 7) return 'great';
  if (daysFloat >= 3) return 'good';
  if (daysFloat >= 1) return 'warn';
  return 'bad';
}

function getTypeBadgeClass(type: string) {
  if (type.startsWith('Only')) return 'mo';
  if (type.startsWith('Light')) return 'lpm';
  return 'pm';
}

interface HistoryDashboardProps {
  relapses: Relapse[];
  urges: Urge[];
  moods: Mood[];
  importRelapses: (data: Omit<Relapse, 'id' | 'created_at' | 'user_id'>[]) => Promise<void>;
  onAdd: (date: string, type: string, notes: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading: boolean;
}

export default function HistoryDashboard({ relapses, urges, moods, importRelapses, onAdd, onDelete, loading }: HistoryDashboardProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [newDate, setNewDate] = useState("");
  const [newType, setNewType] = useState("Porn + Masturbation");
  const [newNotes, setNewNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importData, setImportData] = useState<any[]>([]);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const sortedAscRelapses = [...relapses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Unified Timeline Data
  const unifiedEvents = [
    ...relapses.map(r => ({ ...r, eventType: 'relapse' as const, sortDate: new Date(r.date) })),
    ...urges.map(u => ({ ...u, eventType: 'urge' as const, sortDate: new Date(u.created_at) })),
    ...moods.map(m => ({ ...m, eventType: 'mood' as const, sortDate: new Date(m.created_at) }))
  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime()); // descending

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setImportError("Error parsing CSV: " + results.errors[0].message);
          setIsImportModalOpen(true);
          return;
        }

        // Default assumptions about columns: Date, Type, Notes
        const parsed = results.data.map((row: any) => {
            // Flexible keys (lowercase, trm)
            const keys = Object.keys(row);
            const dKey = keys.find(k => k.toLowerCase().includes('date'));
            const tKey = keys.find(k => k.toLowerCase().includes('type'));
            const nKey = keys.find(k => k.toLowerCase().includes('note'));

            const dateStr = dKey ? row[dKey] : null;
            let isoDate = "";
            if (dateStr) {
                try {
                    isoDate = new Date(dateStr).toISOString();
                } catch(e) { /* invalid date */ }
            }
            
            return {
                date: isoDate,
                type: tKey ? row[tKey] : "Porn + Masturbation", // fallback
                notes: nKey ? row[nKey] : ""
            };
        }).filter(r => r.date !== ""); // Ensure we have valid dates

        setImportData(parsed);
        setImportError(null);
        setIsImportModalOpen(true);
      }
    });
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="page history-page active">
      <div className="section-title">📋 Relapse History</div>
      <div className="history-actions" style={{ position: "relative", zIndex: 10 }}>
        <button className="btn-add-relapse" onClick={() => {
          const now = new Date();
          const offset = now.getTimezoneOffset();
          const local = new Date(now.getTime() - offset * 60000);
          setNewDate(local.toISOString().slice(0, 16));
          setIsAddModalOpen(true);
        }}>⚠ Log Relapse</button>
        <input 
          type="file" 
          accept=".csv" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload} 
        />
        <button className="btn-export" onClick={() => fileInputRef.current?.click()}>📤 Import CSV</button>
        <button className="btn-export" onClick={() => {
            if (unifiedEvents.length === 0) return;
            const csvData = unifiedEvents.map((r: any) => {
                let note = '';
                if (r.eventType === 'relapse') note = r.notes || '';
                if (r.eventType === 'urge') note = r.trigger_note || `Intensity: ${r.intensity}/10`;
                if (r.eventType === 'mood') note = r.note || '';

                return {
                    Date: r.sortDate.toISOString(),
                    Type: r.eventType === 'relapse' ? r.type : (r.eventType === 'urge' ? "Urge Survived" : "Mood Log: " + r.mood_type),
                    Notes: note
                };
            });
            const csv = Papa.unparse(csvData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `streak_history_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }}>📥 Export CSV</button>
      </div>
      <div className="table-container">
        <table className="history-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date & Time</th>
              <th>Time of Day</th>
              <th>Type</th>
              <th>Streak Before</th>
              <th>Notes</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} style={{textAlign:'center'}}>Loading...</td></tr>}
            {!loading && unifiedEvents.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                  No history recorded yet.
                </td>
              </tr>
            )}
            {!loading && unifiedEvents.map((ev, i) => {
              const d = ev.sortDate;
              const isRelapse = ev.eventType === 'relapse';
              const isUrge = ev.eventType === 'urge';
              const isMood = ev.eventType === 'mood';

              // Relapse Specific
              let streak = 0;
              let badgeClass = '';
              let typeClass = '';
              const r = ev as any; // Cast for easier access

              if (isRelapse) {
                const realIdx = sortedAscRelapses.findIndex(x => x.id === r.id);
                if (realIdx > 0) {
                    streak = (d.getTime() - new Date(sortedAscRelapses[realIdx - 1].date).getTime()) / 86400000;
                }
                badgeClass = getStreakBadgeClass(streak);
                typeClass = getTypeBadgeClass(r.type);
              }

              const tod = getTimeOfDay(d.toISOString());

              return (
                <tr key={`${ev.eventType}-${r.id}`}>
                  <td style={{ color: 'var(--text-muted)' }}>{unifiedEvents.length - i}</td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} <span style={{ color: 'var(--text-muted)' }}>{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  </td>
                  <td><span className="time-of-day">{tod.label.split(' ')[0]} {tod.label.split('(')[1]?.replace(')', '') || ''}</span></td>
                  
                  {/* Type Column */}
                  <td>
                     {isRelapse && <span className={`type-badge ${typeClass}`}>{r.type}</span>}
                     {isUrge && <span className="type-badge" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--green)' }}>🌊 Urge Survived</span>}
                     {isMood && <span className="type-badge" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent)' }}>🧠 Mood Logged</span>}
                  </td>
                  
                  {/* Meta / Streak Column */}
                  <td>
                    {isRelapse && (
                        sortedAscRelapses.findIndex(x => x.id === r.id) === 0 ? 
                        <span style={{ color: 'var(--text-muted)' }}>—</span> : 
                        <span className={`streak-badge ${badgeClass}`}>{formatDuration(streak * 86400000)}</span>
                    )}
                    {isUrge && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Intensity: <strong style={{color: 'var(--accent)'}}>{r.intensity}/10</strong></span>}
                    {isMood && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.mood_type}</span>}
                  </td>
                  
                  {/* Notes Column */}
                  <td style={{ color: 'var(--text-muted)', fontSize: '12px', maxWidth: '200px' }}>
                    {isRelapse && (r.notes || '—')}
                    {isUrge && (r.trigger_note || '—')}
                    {isMood && (r.note || '—')}
                  </td>
                  
                  {/* Actions Column */}
                  <td>
                    {isRelapse && <button className="delete-btn" onClick={() => { setDeleteId(r.id); setIsDeleteModalOpen(true); }} title="Delete Relapse">🗑️</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 600 }}>
          <div className="modal">
            <h2>⚠ Log New Relapse</h2>
            <p className="modal-sub">Be honest. Every entry helps you understand your patterns.</p>
            {submitError && <div style={{ color: 'var(--red)', marginBottom: '10px', fontSize: '13px' }}>{submitError}</div>}
            <div className="form-group">
              <label>Date & Time</label>
              <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="Porn + Masturbation">Porn + Masturbation</option>
                <option value="Light Porn + Masturbation">Light Porn + Masturbation</option>
                <option value="Only Masturbation">Only Masturbation</option>
                <option value="Only Porn">Only Porn (no M)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes (Optional)</label>
              <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="e.g., Couldn't sleep, was bored..." />
            </div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
              <button className="btn btn-save" disabled={isSubmitting} onClick={async () => {
                setSubmitError(null);
                setIsSubmitting(true);
                try {
                  const isoString = new Date(newDate).toISOString();
                  await onAdd(isoString, newType, newNotes);
                  setIsAddModalOpen(false);
                  setNewNotes(""); // Reset form
                } catch (err: any) {
                  setSubmitError(err.message || 'Failed to add relapse');
                } finally {
                  setIsSubmitting(false);
                }
              }}>{isSubmitting ? "Logging..." : "Log Relapse"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 600 }}>
          <div className="modal" style={{ maxWidth: '360px' }}>
            <h2 style={{ fontSize: '16px' }}>🗑️ Delete this entry?</h2>
            <p className="modal-sub">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn" style={{ background: 'linear-gradient(135deg,#dc2626,#ef4444)', color: '#fff' }} onClick={async () => {
                if (deleteId) await onDelete(deleteId);
                setIsDeleteModalOpen(false);
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Modal */}
      {isImportModalOpen && (
        <div className="modal-overlay active" style={{ zIndex: 600 }}>
          <div className="modal">
            <h2>📤 Import CSV</h2>
            {importError ? (
                <>
                  <p className="modal-sub" style={{ color: 'var(--red)' }}>{importError}</p>
                  <div className="modal-actions">
                    <button className="btn btn-cancel" onClick={() => setIsImportModalOpen(false)}>Close</button>
                  </div>
                </>
            ) : (
                <>
                    <p className="modal-sub">Found <strong>{importData.length}</strong> valid relapses in the file.</p>
                    <div style={{ background: 'var(--bg-card)', padding: '10px', borderRadius: '8px', fontSize: '12px', maxHeight: '150px', overflowY: 'auto', marginBottom: '15px' }}>
                        {importData.map((r, i) => (
                            <div key={i} style={{ padding: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                {new Date(r.date).toLocaleDateString()} - {r.type} <span style={{color:'var(--text-muted)'}}>{r.notes}</span>
                            </div>
                        ))}
                    </div>
                    {submitError && <div style={{ color: 'var(--red)', marginBottom: '10px', fontSize: '13px' }}>{submitError}</div>}
                    <div className="modal-actions">
                    <button className="btn btn-cancel" onClick={() => setIsImportModalOpen(false)}>Cancel</button>
                    <button className="btn btn-save" disabled={isSubmitting} onClick={async () => {
                        setSubmitError(null);
                        setIsSubmitting(true);
                        try {
                            const payload = importData.map(r => ({ date: r.date, type: r.type, notes: r.notes || null }));
                            await importRelapses(payload);
                            setIsImportModalOpen(false);
                            setImportData([]);
                        } catch (err: any) {
                            setSubmitError(err.message || 'Failed to import records');
                        } finally {
                            setIsSubmitting(false);
                        }
                    }}>{isSubmitting ? "Importing..." : `Import ${importData.length} Records`}</button>
                    </div>
                </>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}
