import { useEffect } from 'react';
import './Toast.css';

/**
 * Toast Notification Component
 * Hiển thị thông báo popup ở góc màn hình
 */
const Toast = ({ message, type = 'success', onClose, duration = 5000 }) => {
  useEffect(() => {
    // Tự động đóng sau duration milliseconds
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '✅';
    }
  };

  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-content">
        <span className="toast-icon">{getIcon()}</span>
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={onClose}>
        ✕
      </button>
    </div>
  );
};

export default Toast;

