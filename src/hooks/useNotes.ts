import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Note {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export function useNotes() {
  const supabase = createClient();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotes();
    } else {
      setNotes([]);
      setLoading(false);
    }
  }, [user]);

  async function fetchNotes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('general_notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }

  async function addNote(content: string) {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('general_notes')
        .insert([{ user_id: user.id, content }])
        .select()
        .single();
        
      if (error) throw error;
      
      setNotes(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding note:', error);
      throw error;
    }
  }

  async function deleteNote(id: string) {
    try {
      const { error } = await supabase
        .from('general_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  return { notes, loading, addNote, deleteNote, fetchNotes };
}
