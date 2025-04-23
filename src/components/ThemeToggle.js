import React from 'react';

const ThemeToggle = ({ theme, onToggle }) => {
  return (
    <button onClick={onToggle} className="theme-toggle">
      {theme === 'dark' ? (
        <i className="fas fa-moon"></i>
      ) : (
        <i className="fas fa-sun"></i>
      )}
    </button>
  );
};

export default ThemeToggle;
