/**
 * Auth Utils
 * Các hàm tiện ích xử lý authentication
 */

/**
 * Lưu token và user info vào localStorage
 */
export const saveToken = (accessToken, user = null) => {
  localStorage.setItem('accessToken', accessToken);
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

/**
 * Lấy token từ localStorage
 */
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

/**
 * Lấy user info từ localStorage
 */
export const getUserInfo = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Xóa toàn bộ localStorage và clear token
 */
export const clearToken = () => {
  localStorage.clear();
};

/**
 * Kiểm tra user đã login chưa
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Parse query parameters từ URL
 */
export const parseQueryParams = (search) => {
  const params = new URLSearchParams(search);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
};

/**
 * Mở popup cho Google OAuth
 * @param {string} url - Google auth URL
 * @param {string} title - Popup title
 * @returns {Window} - Popup window object
 */
export const openOAuthPopup = (url, title = 'Google Login') => {
  const width = 500;
  const height = 600;
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  const popup = window.open(
    url,
    title,
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
  );

  return popup;
};

/**
 * Đợi popup đóng và lấy code từ URL
 * @param {Window} popup - Popup window
 * @param {string} callbackUrl - Callback URL để check
 * @returns {Promise<string>} - Authorization code
 */
export const waitForOAuthCallback = (popup, callbackUrl) => {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      try {
        // Kiểm tra popup còn mở không
        if (!popup || popup.closed) {
          clearInterval(checkInterval);
          reject(new Error('Popup was closed'));
          return;
        }

        // Kiểm tra URL của popup
        const popupUrl = popup.location.href;
        
        if (popupUrl.startsWith(callbackUrl)) {
          // Lấy code từ URL
          const urlParams = new URLSearchParams(popup.location.search);
          const code = urlParams.get('code');
          const error = urlParams.get('error');

          clearInterval(checkInterval);
          popup.close();

          if (error) {
            reject(new Error(`OAuth error: ${error}`));
          } else if (code) {
            resolve(code);
          } else {
            reject(new Error('No code found in callback URL'));
          }
        }
      } catch (error) {
        // Cross-origin error - popup chưa redirect về callback URL
        // Continue checking
      }
    }, 500);

    // Timeout sau 5 phút
    setTimeout(() => {
      clearInterval(checkInterval);
      if (popup && !popup.closed) {
        popup.close();
      }
      reject(new Error('OAuth timeout'));
    }, 5 * 60 * 1000);
  });
};

