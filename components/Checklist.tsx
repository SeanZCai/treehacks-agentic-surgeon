import { useState } from 'react';

interface ChecklistItem {
  id: number;
  text: string;
  completed: boolean;
}

export default function Checklist() {
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: 1, text: "Patient identity verified", completed: false },
    { id: 2, text: "Surgical site marked", completed: false },
    { id: 3, text: "Anesthesia safety check completed", completed: false },
    { id: 4, text: "Pulse oximeter on patient and functioning", completed: false },
    { id: 5, text: "Known allergies verified", completed: false },
    { id: 6, text: "Difficult airway/aspiration risk assessed", completed: false },
    { id: 7, text: "Blood loss risk assessed", completed: false },
    { id: 8, text: "Essential imaging displayed", completed: false },
    { id: 9, text: "Antibiotic prophylaxis given", completed: false },
    { id: 10, text: "All team members introduced", completed: false },
    { id: 11, text: "Critical steps reviewed", completed: false },
    { id: 12, text: "Sterility confirmed", completed: false },
    { id: 13, text: "Equipment concerns addressed", completed: false },
    { id: 14, text: "Patient positioning verified", completed: false },
    { id: 15, text: "Temperature management plan in place", completed: false },
    { id: 16, text: "VTE prophylaxis plan confirmed", completed: false },
    { id: 17, text: "Specimen labeling reviewed", completed: false },
    { id: 18, text: "Equipment counts complete", completed: false },
    { id: 19, text: "Key concerns for recovery discussed", completed: false },
    { id: 20, text: "Post-op destination confirmed", completed: false },
  ]);

  const toggleItem = (id: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  return (
    <>
      {items.map((item) => (
        <div key={item.id} className="checklist-item">
          <input
            type="checkbox"
            id={`checkbox-${item.id}`}
            checked={item.completed}
            onChange={() => toggleItem(item.id)}
          />
          <label htmlFor={`checkbox-${item.id}`}>{item.text}</label>
        </div>
      ))}
    </>
  );
} 