import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { evaluateAPI } from '../services/api';
import EvaluationDetail from '../components/EvaluationDetail';
import './HistoryDetailPage.css';

const HistoryDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvaluationDetail();
  }, [id]);

  const fetchEvaluationDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch từ history và tìm evaluation theo id
      const response = await evaluateAPI.getHistory();
      
      if (response.success && response.data) {
        const foundEvaluation = response.data.find(item => item.id === id);
        
        if (foundEvaluation) {
          setEvaluation(foundEvaluation);
        } else {
          setError('Evaluation not found');
        }
      } else {
        setError('Failed to load evaluation');
      }
    } catch (err) {
      console.error('Error fetching evaluation detail:', err);
      setError('Failed to load evaluation details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/history');
  };

  if (loading) {
    return (
      <div className="history-detail-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading evaluation details...</p>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="history-detail-page">
        <div className="error-container">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Error</h3>
          <p>{error || 'Evaluation not found'}</p>
          <button className="btn-back" onClick={handleBack}>
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-detail-page">
      <div className="detail-actions">
        <button className="btn-back-nav" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to History
        </button>
      </div>
      
      <EvaluationDetail evaluation={evaluation} />
    </div>
  );
};

export default HistoryDetailPage;
