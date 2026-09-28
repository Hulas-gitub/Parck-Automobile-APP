import React from 'react';

const Footer = ({ darkMode, sidebarCollapsed, theme }) => {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`transition-all duration-300 px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 ${
        darkMode ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-white border-gray-100 text-gray-500'
      }`}
      style={{ marginLeft: sidebarCollapsed ? '5rem' : '18rem' }}
    >
      <p className="text-xs font-semibold">
        © {year} <span className="font-extrabold" style={{ color: theme?.primary }}>Société Gabonaise de services (SGS)</span>. Tous droits réservés.
      </p>
      <p className="text-xs font-semibold">Gestion de flotte automobile</p>
    </footer>
  );
};

export default Footer;