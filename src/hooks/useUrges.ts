import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Urge {
  id: string;
  user_id: string;
  created_at: string;
  intensity: number;
  trigger_note: string | null;
}

export function useUrges() {
  const [urges, setUrges] = useState<Urge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchUrges = useCallback(async () => {
    if (!user) {
      setUrges([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('urges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUrges(data || []);
    } catch (err: any) {
      console.error('Error fetching urges:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchUrges();
  }, [fetchUrges]);

  const addUrge = async (intensity: number, trigger_note: string | null) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('urges')
        .insert([{ user_id: user.id, intensity, trigger_note }])
        .select();

      if (error) throw error;
      if (data) {
        setUrges((prev) => [data[0], ...prev]);
      }
    } catch (err: any) {
      console.error('Error adding urge:', err);
      throw err;
    }
  };

  return { urges, loading, error, addUrge, refresh: fetchUrges };
}
