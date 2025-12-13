import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { saveToken, parseQueryParams } from '../utils/auth';
import './CallbackPage.css';

/**
 * Callback Page Component
 * Xử lý callback từ Google OAuth và đổi code lấy access token
 */
const CallbackPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Đang xử lý đăng nhập...');

  useEffect(() => {
    handleCallback();
  }, []);

  /**
   * Xử lý callback từ Google
   */
  const handleCallback = async () => {
    try {
      // 1. Parse query parameters từ URL
      const params = parseQueryParams(location.search);
      console.log('📥 Callback params:', params);

      // 2. Kiểm tra có error không
      if (params.error) {
        throw new Error(`Google OAuth error: ${params.error}`);
      }

      // 3. Lấy authorization code
      const code = params.code;
      if (!code) {
        throw new Error('Không tìm thấy authorization code trong URL');
      }

      console.log('✅ Đã nhận code từ Google');
      setMessage('Đang xác thực với server...');

      // 4. Gửi code lên backend để đổi lấy access token
      console.log('🔄 Đang gửi code lên backend...');
      const response = await authAPI.loginWithGoogle(code);

      console.log('📥 Response từ backend:', response);

      if (!response.success || !response.data?.accessToken) {
        throw new Error('Không thể lấy access token từ server');
      }

      // 5. Lưu access token và user info
      const { accessToken, user } = response.data;
      saveToken(accessToken, user);

      console.log('✅ Đăng nhập thành công!');
      console.log('🔑 Token và user info đã lưu vào localStorage');

      // 6. Hiển thị success và redirect
      setStatus('success');
      setMessage('Đăng nhập thành công! Đang chuyển hướng...');

      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 1500);

    } catch (error) {
      console.error('❌ Lỗi khi xử lý callback:', error);
      setStatus('error');
      setMessage(
        error.response?.data?.message || 
        error.message || 
        'Đã xảy ra lỗi khi đăng nhập'
      );

      // Redirect về login sau 3 giây
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    }
  };

  return (
    <div className="callback-container">
      <div className="callback-card">
        {status === 'processing' && (
          <div className="callback-content">
            <div className="spinner-large"></div>
            <h2>{message}</h2>
            <p>Vui lòng đợi trong giây lát...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="callback-content success">
            <div className="success-icon">✓</div>
            <h2>{message}</h2>
            <p>Chào mừng bạn đến với Resume AI!</p>
          </div>
        )}

        {status === 'error' && (
          <div className="callback-content error">
            <div className="error-icon">✕</div>
            <h2>Đăng nhập thất bại</h2>
            <p>{message}</p>
            <button 
              className="retry-btn"
              onClick={() => navigate('/login', { replace: true })}
            >
              Thử lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CallbackPage;

