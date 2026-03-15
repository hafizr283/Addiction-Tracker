import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Mood {
  id: string;
  user_id: string;
  created_at: string;
  mood_type: string;
  note: string | null;
}

export function useMoods() {
  const [moods, setMoods] = useState<Mood[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchMoods = useCallback(async () => {
    if (!user) {
      setMoods([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMoods(data || []);
    } catch (err: any) {
      console.error('Error fetching moods:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchMoods();
  }, [fetchMoods]);

  const addMood = async (mood_type: string, note: string | null) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('moods')
        .insert([{ user_id: user.id, mood_type, note }])
        .select();

      if (error) throw error;
      if (data) {
        setMoods((prev) => [data[0], ...prev]);
      }
    } catch (err: any) {
      console.error('Error adding mood:', err);
      throw err;
    }
  };

  return { moods, loading, error, addMood, refresh: fetchMoods };
}
