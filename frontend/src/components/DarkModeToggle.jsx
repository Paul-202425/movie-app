import React from 'react';
import './DarkModeToggle.css';

function DarkModeToggle({ darkMode, toggleDarkMode }) {
  return (
    <div className="toggle-container">
      <label className="switch">
        <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} />
        <span className="slider round"></span>
      </label>
      <span className="mode-label">{darkMode ? '🌙 Dark' : '🌞 Light'}</span>
    </div>
  );
}

export default DarkModeToggle;
