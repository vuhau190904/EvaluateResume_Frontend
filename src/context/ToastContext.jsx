import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

/**
 * Toast Context để quản lý notifications globally
 */
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  /**
   * Hiển thị toast notification
   * @param {string} message - Nội dung thông báo
   * @param {string} type - Loại: success, error, warning, info
   * @param {number} duration - Thời gian hiển thị (ms)
   */
  const showToast = useCallback((message, type = 'success', duration = 5000) => {
    setToast({ message, type, duration });
  }, []);

  /**
   * Đóng toast
   */
  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, closeToast }}>
      {children}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={closeToast}
        />
      )}
    </ToastContext.Provider>
  );
};

