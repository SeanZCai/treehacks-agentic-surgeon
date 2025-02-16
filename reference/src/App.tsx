import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import LandingPage from "./LandingPage";
import "./App.css";

// Define interfaces for our data
interface ChecklistItem {
  question: string;
  checked: boolean;
}

function App() {
  const [showMainApp, setShowMainApp] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [transcription, setTranscription] = useState<string>("Listening for audio...");
  
  // NEW: State and ref for screenshare
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const screenshareVideoRef = useRef<HTMLVideoElement>(null);

  // NEW: When the screenStream changes, attach it to the video element
  useEffect(() => {
    if (screenshareVideoRef.current && screenStream) {
      screenshareVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Simulate loading data from a spreadsheet
  useEffect(() => {
    // This is mock data - we replaced this with an actual Google Sheets API call
    const mockData: ChecklistItem[] = [
      { question: "Patient identity verified", checked: false },
      { question: "Surgical site marked", checked: false },
      { question: "Anesthesia safety check completed", checked: false },
      { question: "Pulse oximeter on patient and functioning", checked: false },
      { question: "Known allergies verified", checked: false },
      { question: "Difficult airway/aspiration risk assessed", checked: false },
      { question: "Blood loss risk assessed", checked: false },
      { question: "Essential imaging displayed", checked: false },
      { question: "Antibiotic prophylaxis given", checked: false },
      { question: "All team members introduced", checked: false },
      { question: "Critical steps reviewed", checked: false },
      { question: "Sterility confirmed", checked: false },
      { question: "Equipment concerns addressed", checked: false },
      { question: "Patient positioning verified", checked: false },
      { question: "Temperature management plan in place", checked: false },
      { question: "VTE prophylaxis plan confirmed", checked: false },
      { question: "Specimen labeling reviewed", checked: false },
      { question: "Equipment counts complete", checked: false },
      { question: "Key concerns for recovery discussed", checked: false },
      { question: "Post-op destination confirmed", checked: false },
    ];
    setChecklistItems(mockData);
  }, []);

  const handleCheckboxChange = (index: number) => {
    setChecklistItems(items =>
      items.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleBackClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmBack = (confirmed: boolean) => {
    setShowConfirmDialog(false);
    if (confirmed) {
      setShowMainApp(false);
    }
  };

  // NEW: Function to start screenshare using the browser's getDisplayMedia API
  const startScreenshare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
    } catch (err) {
      console.error("Error starting screenshare:", err);
    }
  };

  // NEW: Function to stop screenshare and release media tracks
  const stopScreenshare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  };

  if (!showMainApp) {
    return <LandingPage onEnter={() => setShowMainApp(true)} />;
  }

  return (
    <div className="container">
      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h2>Are you sure?</h2>
            <p>Do you want to return to the home page?</p>
            <div className="confirm-buttons">
              <button onClick={() => handleConfirmBack(true)}>Yes</button>
              <button onClick={() => handleConfirmBack(false)}>No</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="left-column">
        <header className="app-header">
          <button className="back-button" onClick={handleBackClick}>
            ← Back
          </button>
        </header>
        {/* NEW: Screenshare Section */}
        <div className="screenshare-section" style={{ padding: "1rem", textAlign: "center" }}>
          {screenStream ? (
            <div>
              <video
                ref={screenshareVideoRef}
                autoPlay
                playsInline
                controls
                style={{ width: "100%", maxHeight: "200px", borderRadius: "8px" }}
              />
              <br />
              <button className="screenshare-button" onClick={stopScreenshare} style={{ marginTop: "0.5rem" }}>
                Stop Screenshare
              </button>
            </div>
          ) : (
            <button className="screenshare-button" onClick={startScreenshare}>
              Start Screenshare
            </button>
          )}
        </div>
        <div className="main-content">
          <div className="transcription-section">
            <div className="transcription-header">
              <h2>Live Transcription</h2>
              <div className="status-indicator"></div>
            </div>
            <div className="transcription-content">
              <p>{transcription}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="right-column">
        <h2 className="checklist-title">Surgical Safety Checklist</h2>
        <div className="checklist">
          {checklistItems.map((item, index) => (
            <div key={index} className="checklist-item">
              <input
                type="checkbox"
                id={`checkbox-${index}`}
                checked={item.checked}
                onChange={() => handleCheckboxChange(index)}
              />
              <label htmlFor={`checkbox-${index}`}>{item.question}</label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
