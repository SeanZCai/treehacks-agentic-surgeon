import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ChecklistItem {
  id: number;
  requirement: string;
  completion_status: boolean;
  phase: string;
  order: number;
}

export default function Checklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);

  const fetchRequirements = async () => {
    try {
      const { data, error } = await supabase
        .from('treehacks_reqs')
        .select('*')
        .order('phase,order');

      if (error) {
        console.error('Error fetching requirements:', error);
        return;
      }

      if (data) {
        console.log('Fetched new checklist data:', data);
        setItems(data);
      }
    } catch (err) {
      console.error('Failed to fetch requirements:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchRequirements();
  }, []);

  // Refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchRequirements, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleItem = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('treehacks_reqs')
        .update({ completion_status: !currentStatus })
        .eq('id', id);

      if (error) {
        console.error('Error updating completion status:', error);
        return;
      }

      // Update local state
      setItems(items.map(item =>
        item.id === id ? { ...item, completion_status: !currentStatus } : item
      ));
    } catch (err) {
      console.error('Failed to update completion status:', err);
    }
  };

  return (
    <>
      {items.map((item) => (
        <div key={item.id} className="checklist-item">
          <input
            type="checkbox"
            id={`checkbox-${item.id}`}
            checked={item.completion_status}
            onChange={() => toggleItem(item.id, item.completion_status)}
          />
          <label htmlFor={`checkbox-${item.id}`}>
            {item.requirement}
          </label>
        </div>
      ))}
    </>
  );
} 