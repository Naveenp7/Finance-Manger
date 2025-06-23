import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();
  
  return (
    <div className="theme-toggle-container d-flex align-items-center">
      <label className="theme-switch" title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
        <input 
          type="checkbox" 
          checked={darkMode} 
          onChange={toggleTheme}
          aria-label="Theme toggle switch"
        />
        <span className="theme-switch-slider">
          <FaSun className="theme-icon theme-icon-light" />
          <FaMoon className="theme-icon theme-icon-dark" />
        </span>
      </label>
    </div>
  );
};

export default ThemeToggle; 