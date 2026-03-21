import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Relapse {
  id: string;
  user_id: string;
  date: string;
  type: string;
  notes: string | null;
  created_at: string;
}

export function useRelapses() {
  const [relapses, setRelapses] = useState<Relapse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchRelapses = useCallback(async () => {
    if (!user) {
      setRelapses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('relapses')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setRelapses(data || []);
    } catch (err: any) {
      console.error('Error fetching relapses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchRelapses();
  }, [fetchRelapses]);

  const addRelapse = async (date: string, type: string, notes: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('relapses')
        .insert([{ user_id: user.id, date, type, notes }])
        .select();

      if (error) throw error;
      if (data) {
        setRelapses((prev) => [data[0], ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        
        // Trigger email notification asynchronously
        if (user.email) {
          fetch('/api/notify/relapse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, type })
          }).catch(console.error);
        }
      }
    } catch (err: any) {
      console.error('Error adding relapse:', err);
      throw err;
    }
  };

  const deleteRelapse = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('relapses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRelapses((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error('Error deleting relapse:', err);
      throw err;
    }
  };

  const importRelapses = async (newRelapses: Omit<Relapse, 'id' | 'created_at' | 'user_id'>[]) => {
    if (!user) return;
    try {
      const payload = newRelapses.map(r => ({ ...r, user_id: user.id }));
      // Supabase insert supports an array of objects for bulk insert
      const { data, error } = await supabase
        .from('relapses')
        .insert(payload)
        .select();

      if (error) throw error;
      if (data) {
        setRelapses((prev) => [...data, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    } catch (err: any) {
      console.error('Error importing relapses:', err);
      throw err;
    }
  };

  return { relapses, loading, error, addRelapse, deleteRelapse, importRelapses, refresh: fetchRelapses };
}
