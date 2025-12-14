import axios from 'axios';
import { clearToken, getAccessToken } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Axios instance với cấu hình mặc định
 */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

/**
 * Request interceptor - Thêm token vào header
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Xử lý lỗi authentication
 */
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Token hết hạn hoặc invalid (401 Unauthorized) hoặc Forbidden (403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn('🔒 Token expired or invalid. Redirecting to login...');
      
      // Xóa toàn bộ localStorage
      clearToken();
      
      // Redirect về trang login (chỉ khi không đang ở trang login)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Auth API
 */
export const authAPI = {
  /**
   * Lấy Google Auth URL từ backend
   */
  getGoogleAuthUrl: async () => {
    try {
      const response = await apiClient.get('/auth/google');
      return response;
    } catch (error) {
      console.error('Error getting Google auth URL:', error);
      throw error;
    }
  },

  /**
   * Gửi code lên backend để đổi lấy access token
   */
  loginWithGoogle: async (code) => {
    try {
      const response = await apiClient.post('/auth/google/login', { code });
      return response;
    } catch (error) {
      console.error('Error logging in with Google:', error);
      throw error;
    }
  },

  /**
   * Logout - xóa token khỏi backend
   */
  logout: async () => {
    try {
      const response = await apiClient.post('/auth/logout');
      return response;
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  },
};

/**
 * Evaluate API
 */
export const evaluateAPI = {
  /**
   * Upload CV và đánh giá resume
   * @param {File} file - File PDF CV
   * @param {string} jobDescription - Mô tả công việc
   * @param {string} evaluationId - UUID cho evaluation này
   */
  uploadResume: async (file, jobDescription, evaluationId) => {
    try {
      const formData = new FormData();
      formData.append('cv', file);
      formData.append('job_description', jobDescription);
      formData.append('id', evaluationId);

      const token = getAccessToken();
      const response = await axios.post(
        `${API_URL}/evaluate/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 60000, // 60 seconds
        }
      );

      return response.data;
    } catch (error) {
      // Nếu là 401 hoặc 403, clearToken và redirect
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn('🔒 Token expired during upload. Redirecting to login...');
        clearToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      console.error('Error uploading resume:', error);
      throw error;
    }
  },

  /**
   * Lấy kết quả đánh giá (polling)
   * @param {string} evaluationId - UUID của evaluation
   */
  getResult: async (evaluationId) => {
    try {
      const response = await apiClient.get(`/evaluate/result/${evaluationId}`);
      return response;
    } catch (error) {
      console.error('Error getting evaluation result:', error);
      throw error;
    }
  },

  /**
   * Lấy lịch sử các đánh giá trước đó
   */
  getHistory: async () => {
    try {
      const response = await apiClient.get('/evaluate/history');
      return response;
    } catch (error) {
      console.error('Error getting evaluation history:', error);
      throw error;
    }
  },
};

/**
 * Suggest JD API
 */
export const suggestAPI = {
  /**
   * Search for job descriptions
   * @param {string} searchInput - Search keyword
   */
  searchJob: async (searchInput) => {
    try {
      const response = await apiClient.get('/suggest/job', {
        params: { search_input: searchInput }
      });
      return response;
    } catch (error) {
      console.error('Error searching job:', error);
      throw error;
    }
  },

  /**
   * Get search result by search_id (polling)
   * @param {string} searchId - UUID của search
   */
  getSearchResult: async (searchId) => {
    try {
      const response = await apiClient.get(`/suggest/job/${searchId}`);
      return response;
    } catch (error) {
      console.error('Error getting search result:', error);
      throw error;
    }
  },

  /**
   * Get search history
   */
  getHistory: async () => {
    try {
      const response = await apiClient.get('/suggest/history');
      return response;
    } catch (error) {
      console.error('Error getting suggest history:', error);
      throw error;
    }
  },
};

/**
 * Interview API
 */
export const interviewAPI = {
  /**
   * Start interview - generate questions
   * @param {string} resumeId - Resume ID
   */
  startInterview: async (resumeId) => {
    try {
      const response = await apiClient.get('/interview/start', {
        params: { resume_id: resumeId }
      });
      return response;
    } catch (error) {
      console.error('Error starting interview:', error);
      throw error;
    }
  },

  /**
   * Get interview questions (polling)
   * @param {string} resumeId - Resume ID
   */
  getQuestions: async (resumeId) => {
    try {
      const response = await apiClient.get('/interview/get-question', {
        params: { resume_id: resumeId }
      });
      return response;
    } catch (error) {
      console.error('Error getting interview questions:', error);
      throw error;
    }
  },

  /**
   * Submit answer for a question
   * @param {string} questionId - Question ID
   * @param {string} answer - User's answer
   */
  submitAnswer: async (questionId, answer) => {
    try {
      const response = await apiClient.post('/interview/submit-answer', {}, {
        params: { 
          question_id: questionId,
          answer: answer
        }
      });
      return response;
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  },

  /**
   * End interview and generate feedback
   * @param {string} resumeId - Resume ID
   */
  endInterview: async (resumeId) => {
    try {
      const response = await apiClient.get('/interview/end', {
        params: { resume_id: resumeId }
      });
      return response;
    } catch (error) {
      console.error('Error ending interview:', error);
      throw error;
    }
  },

  /**
   * Get interview feedback
   * @param {string} resumeId - Resume ID
   */
  getFeedback: async (resumeId) => {
    try {
      const response = await apiClient.get('/interview/feedback', {
        params: { resume_id: resumeId }
      });
      return response;
    } catch (error) {
      console.error('Error getting feedback:', error);
      throw error;
    }
  },
};

export default apiClient;

