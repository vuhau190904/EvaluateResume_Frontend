import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluateAPI } from '../services/api';
import './HistoryPage.css';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await evaluateAPI.getHistory();
      
      console.log('History API Response:', response);
      
      // Response structure: { success: true, data: [...] }
      if (response.success && response.data) {
        console.log('Evaluations data:', response.data);
        setEvaluations(response.data);
      } else {
        setEvaluations([]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load evaluation history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getContentScore = (evaluation) => {
    try {
      const score = evaluation?.evaluation_result?.evaluationResult?.evaluation?.total_score;
      return score || 0;
    } catch (err) {
      console.error('Error getting content score:', err);
      return 0;
    }
  };

  const getLayoutScore = (evaluation) => {
    try {
      return evaluation.evaluation_result.layoutResult.overall_layout_score;
    } catch (err) {
      console.error('Error getting layout score:', err);
      return 0;
    }
  };

  const getFileName = (evaluation) => {
    return evaluation?.file_name || 'Unknown File';
  };

  const getJobDescription = (evaluation) => {
    const jd = evaluation?.jobDescription || 'No job description';
    // Truncate if too long
    return jd.length > 150 ? jd.substring(0, 150) + '...' : jd;
  };

  const handleViewDetail = (evaluationId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (evaluationId) {
      console.log('Navigating to evaluation detail:', evaluationId);
      navigate(`/history/${evaluationId}`);
    } else {
      console.warn('No evaluation ID found');
    }
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading evaluation history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="error-container">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h3>Error</h3>
          <p>{error}</p>
          <button className="btn-retry" onClick={fetchHistory}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <div>
          <h2>Evaluation History</h2>
          <p className="history-subtitle">View all your past CV evaluations</p>
        </div>
        <div className="history-stats">
          <span className="stat-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            {evaluations.length} Evaluation{evaluations.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {evaluations.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
          <h3>No Evaluations Yet</h3>
          <p>Start by evaluating your first CV to see it here</p>
        </div>
      ) : (
        <div className="evaluations-list">
          {evaluations.map((evaluation, index) => (
            <div 
              key={evaluation.id || index} 
              className="evaluation-item"
              onClick={(e) => handleViewDetail(evaluation.id, e)}
            >
              <div className="item-header">
                <div className="item-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div className="item-title-section">
                  <h3 className="item-title">{getFileName(evaluation)}</h3>
                  <span className="item-date">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {formatDate(evaluation.created_at)}
                  </span>
                </div>
                <div className="item-scores">
                  <div className="score-badge content-score">
                    <span className="score-value">{getContentScore(evaluation)}</span>
                    <span className="score-label">Content</span>
                  </div>
                  <div className="score-badge layout-score">
                    <span className="score-value">{getLayoutScore(evaluation)}</span>
                    <span className="score-label">Layout</span>
                  </div>
                </div>
              </div>

              <div className="item-body">
                <div className="jd-section">
                  <span className="jd-label">Job Description:</span>
                  <p className="jd-text">{getJobDescription(evaluation)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;



