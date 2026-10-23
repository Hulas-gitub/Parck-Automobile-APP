import Swal from 'sweetalert2';

// Injection unique des styles CSS pour SweetAlert2 (thème clair et sombre + animations)
let stylesInjected = false;
export const injectSwalStyles = (theme) => {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('fleetify-swal-styles');
  const primary = theme?.primary || '#3b82f6';
  const primaryDark = theme?.primaryDark || '#1d4ed8';

  const css = `
    .swal-dark-popup  { background: #111827 !important; border: 1px solid #374151 !important; border-radius: 16px !important; box-shadow: 0 25px 50px rgba(0,0,0,0.6) !important; }
    .swal-light-popup { background: #ffffff !important; border: 1px solid #e5e7eb !important; border-radius: 16px !important; box-shadow: 0 25px 50px rgba(0,0,0,0.15) !important; }
    .swal-dark-title  { color: #f9fafb !important; font-weight: 800 !important; font-size: 18px !important; }
    .swal-light-title { color: #111827 !important; font-weight: 800 !important; font-size: 18px !important; }
    .swal-dark-html   { color: #9ca3af !important; font-size: 15px !important; }
    .swal-light-html  { color: #6b7280 !important; font-size: 15px !important; }
    .swal-confirm-btn {
      background: linear-gradient(to right, ${primary}, ${primaryDark}) !important;
      color: #fff !important; border: none !important; border-radius: 10px !important;
      font-weight: 700 !important; padding: 10px 24px !important; font-size: 14px !important;
      cursor: pointer !important; transition: opacity 0.2s !important;
    }
    .swal-confirm-btn:hover { opacity: 0.9 !important; }
    .swal-confirm-btn.swal-danger { background: linear-gradient(to right, #ef4444, #dc2626) !important; }
    .swal-cancel-btn {
      background: transparent !important; color: #9ca3af !important;
      border: 1px solid #374151 !important; border-radius: 10px !important;
      font-weight: 700 !important; padding: 10px 24px !important; font-size: 14px !important;
      cursor: pointer !important; transition: background 0.2s !important;
    }
    .swal-cancel-btn:hover { background: rgba(156,163,175,0.1) !important; }
    .swal2-icon.swal2-warning { border-color: #f59e0b !important; color: #f59e0b !important; }
    .swal2-icon.swal2-error   { border-color: #ef4444 !important; color: #ef4444 !important; }
    .swal2-icon.swal2-success .swal2-success-ring { border-color: rgba(16,185,129,0.3) !important; }
    .swal2-icon.swal2-success [class^=swal2-success-line] { background: #10b981 !important; }
    .swal2-actions { gap: 10px !important; margin-top: 20px !important; }
  `;

  if (existing) {
    existing.innerHTML = css;
  } else {
    const styleEl = document.createElement('style');
    styleEl.id = 'fleetify-swal-styles';
    styleEl.innerHTML = css;
    document.head.appendChild(styleEl);
  }
};

/**
 * Configuration SweetAlert2 réutilisable pour options directes
 */
export const getSwalConfig = (darkMode, primaryColor = '#3b82f6') => ({
  background: darkMode ? '#111827' : '#ffffff',
  color: darkMode ? '#f9fafb' : '#111827',
  confirmButtonColor: primaryColor,
  cancelButtonColor: darkMode ? '#374151' : '#9ca3af',
  customClass: {
    popup: darkMode ? 'swal-dark-popup' : 'swal-light-popup',
    confirmButton: 'swal-confirm-btn',
    cancelButton: 'swal-cancel-btn',
    title: darkMode ? 'swal-dark-title' : 'swal-light-title',
    htmlContainer: darkMode ? 'swal-dark-html' : 'swal-light-html',
  },
  buttonsStyling: false,
});

/**
 * Crée une instance mixin Swal configurée selon le thème
 */
export const createSwal = (darkMode, theme = {}) => {
  injectSwalStyles(theme);
  return Swal.mixin({
    customClass: {
      popup: darkMode ? 'swal-dark-popup' : 'swal-light-popup',
      title: darkMode ? 'swal-dark-title' : 'swal-light-title',
      htmlContainer: darkMode ? 'swal-dark-html' : 'swal-light-html',
      confirmButton: 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn',
      denyButton: 'swal-deny-btn',
    },
    background: darkMode ? '#111827' : '#ffffff',
    color: darkMode ? '#f9fafb' : '#111827',
    confirmButtonColor: theme?.primary || '#3b82f6',
    cancelButtonColor: darkMode ? '#374151' : '#e5e7eb',
    buttonsStyling: false,
  });
};

/**
 * Message de succès auto-fermant
 */
export const showSuccess = (darkMode, theme, title, text) =>
  createSwal(darkMode, theme).fire({
    icon: 'success',
    title,
    text,
    showConfirmButton: false,
    showCancelButton: false,
    timer: 1500,
    timerProgressBar: false,
    allowOutsideClick: true,
    allowEscapeKey: true,
  });

/**
 * Message d'erreur
 */
export const showError = (darkMode, theme, title, text, icon = 'error') =>
  createSwal(darkMode, theme).fire({
    icon,
    title,
    text,
    showConfirmButton: true,
    confirmButtonText: "D'ACCORD",
    showCancelButton: false,
    customClass: {
      popup: darkMode ? 'swal-dark-popup' : 'swal-light-popup',
      title: darkMode ? 'swal-dark-title' : 'swal-light-title',
      htmlContainer: darkMode ? 'swal-dark-html' : 'swal-light-html',
      confirmButton: 'swal-confirm-btn',
    },
    buttonsStyling: false,
  });

/**
 * Boîte de confirmation
 */
export const showConfirm = (darkMode, theme, { title, html, confirmText = 'Confirmer', isDanger = false }) =>
  createSwal(darkMode, theme).fire({
    icon: 'warning',
    title,
    html,
    showConfirmButton: true,
    confirmButtonText: confirmText,
    showCancelButton: true,
    cancelButtonText: 'Annuler',
    customClass: {
      popup: darkMode ? 'swal-dark-popup' : 'swal-light-popup',
      title: darkMode ? 'swal-dark-title' : 'swal-light-title',
      htmlContainer: darkMode ? 'swal-dark-html' : 'swal-light-html',
      confirmButton: isDanger ? 'swal-confirm-btn swal-danger' : 'swal-confirm-btn',
      cancelButton: 'swal-cancel-btn',
    },
    buttonsStyling: false,
  });

export default {
  getSwalConfig,
  createSwal,
  showSuccess,
  showError,
  showConfirm,
  injectSwalStyles,
};
