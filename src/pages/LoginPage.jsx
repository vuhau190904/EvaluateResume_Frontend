import { useRef, useState } from 'react';
import { authAPI } from '../services/api';
import './LoginPage.css';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [policyModal, setPolicyModal] = useState(null); // 'terms' | 'privacy' | null
  const submittingRef = useRef(false);

  const handleGoogleLogin = async () => {
    // Chặn double-click / spam click
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      setLoading(true);
      setError('');

      const response = await authAPI.getGoogleAuthUrl();

      if (!response.success || !response.data?.authUrl) {
        throw new Error('Không thể kết nối đến server');
      }

      window.location.href = response.data.authUrl;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Đã xảy ra lỗi');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="login-page">
      {/* Subtle background effects */}
      <div className="bg-effects">
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="grid-overlay" />
      </div>

      <div className="login-wrapper">
        {/* Main Card */}
        <div className="login-card">
          {/* Logo */}
          <div className="logo-section">
            <img src="/logo.png" alt="Evaluate Resume" className="logo" />
          </div>

          {/* Meta info row */}
          <div className="meta-row">
            <span className="meta-pill">Match CV ↔ JD</span>
            <span className="meta-dot" />
            <span className="meta-pill">AI Scoring</span>
          </div>

          {/* Tagline */}
          <p className="tagline">AI-Powered Resume Evaluation</p>

          {/* Divider */}
          <div className="divider">
            <span />
          </div>

          {/* Error */}
          {error && (
            <div className="error-box">
              <span>{error}</span>
            </div>
          )}

          {/* Google Login Button */}
          <button
            className="login-btn"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-state">
                <span className="spinner" />
                Đang kết nối...
              </span>
            ) : (
              <>
                <svg className="google-icon" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Đăng nhập với Google
              </>
            )}
          </button>

          {/* Footer text */}
          <p className="terms">
            Bằng việc đăng nhập, bạn đồng ý với{' '}
            <button
              type="button"
              className="terms-link"
              onClick={() => setPolicyModal('terms')}
            >
              Điều khoản dịch vụ
            </button>{' '}
            và{' '}
            <button
              type="button"
              className="terms-link"
              onClick={() => setPolicyModal('privacy')}
            >
              Chính sách bảo mật
            </button>
          </p>
        </div>

        {/* Tech footer */}
        <div className="tech-footer">
          <span className="tech-badge">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Powered by AI
          </span>
        </div>
      </div>

      {/* Policy Modal */}
      {policyModal && (
        <div
          className="policy-backdrop"
          onClick={() => setPolicyModal(null)}
        >
          <div
            className="policy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="policy-header">
              <div className="policy-indicator" />
              <h3>
                {policyModal === 'terms'
                  ? 'Điều khoản dịch vụ'
                  : 'Chính sách bảo mật'}
              </h3>
              <p>
                Phiên bản beta cho Evaluate Resume. Nội dung mang tính mô tả cho
                bản production.
              </p>
            </div>

            <div className="policy-body">
              {policyModal === 'terms' ? (
                <ul>
                  <li>
                    Chỉ sử dụng để đánh giá CV phục vụ mục đích tuyển dụng hoặc
                    học tập.
                  </li>
                  <li>
                    Không upload nội dung vi phạm pháp luật hoặc thông tin cực
                    kỳ nhạy cảm.
                  </li>
                  <li>
                    Kết quả đánh giá do AI gợi ý, không thay thế quyết định
                    tuyển dụng cuối cùng.
                  </li>
                </ul>
              ) : (
                <ul>
                  <li>
                    CV và JD có thể được lưu tạm thời để phục vụ xử lý mô hình
                    AI.
                  </li>
                  <li>
                    Không chia sẻ dữ liệu cho bên thứ ba ngoài hệ thống Evaluate
                    Resume.
                  </li>
                  <li>
                    Bạn có thể yêu cầu xóa dữ liệu theo chính sách của backend.
                  </li>
                </ul>
              )}
            </div>

            <div className="policy-footer">
              <button
                type="button"
                className="policy-close-btn"
                onClick={() => setPolicyModal(null)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
