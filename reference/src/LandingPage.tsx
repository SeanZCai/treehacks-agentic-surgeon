import React from 'react';
import './LandingPage.css';

interface LandingPageProps {
  onEnter: () => void;
}

function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <div className="landing-container">
      <div className="video-background">
        <video autoPlay muted loop id="myVideo">
          <source src="/front_page.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="landing-content">
        <h1 className="landing-title">Surgentic</h1>
        <p className="landing-subtitle">Confidence. Safety. Every surgery, every time.</p>
        <button className="enter-button" onClick={onEnter}>
          Enter
        </button>
      </div>
    </div>
  );
}

export default LandingPage; 