import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { evaluateAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import EvaluationDetail from '../components/EvaluationDetail';
import './ResultPage.css';

const ResultPage = () => {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [pollingCount, setPollingCount] = useState(0);

  useEffect(() => {
    let intervalId = null;
    let attempts = 0;
    const maxAttempts = 120; // 4 minutes max (120 * 2s)

    const fetchResult = async () => {
      try {
        attempts++;
        setPollingCount(attempts);
        const response = await evaluateAPI.getResult(evaluationId);
        
        // HTTP 200 - Success, evaluation completed
        // Response structure: { success: true, data: evaluation_result }
        const evaluationData = response?.data;
        
        if (evaluationData) {
          // Build evaluation object with only evaluation_result (no metadata)
          const fullEvaluation = {
            id: evaluationId,
            status: 'completed',
            evaluation_result: evaluationData,
          };
          
          setResult(fullEvaluation);
          setLoading(false);
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          showToast('Evaluation completed!', 'success');
          return;
        }
      } catch (err) {
        const httpStatus = err.response?.status;
        const errorMessage = err.response?.data?.message || err.message;
        
        console.log('Polling attempt:', attempts, 'HTTP Status:', httpStatus);

        // HTTP 400 - Pending, continue polling
        if (httpStatus === 400) {
          // Continue polling, don't do anything
          console.log('Evaluation still pending, continuing to poll...');
          return;
        }

        // HTTP 404 - Not found, stop polling
        if (httpStatus === 404) {
          setError('Evaluation not found. Please try again.');
          setLoading(false);
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          showToast('Evaluation not found', 'error');
          return;
        }

        // HTTP 500 - Failed, stop polling
        if (httpStatus === 500) {
          setError(errorMessage || 'Evaluation failed. Please try again.');
          setLoading(false);
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          showToast('Evaluation failed', 'error');
          return;
        }

        // Other errors - only stop after multiple attempts
        console.error('Error fetching result:', err);
        if (attempts >= 5) {
          setError(errorMessage || 'Error occurred while fetching results');
          setLoading(false);
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          showToast('An error occurred', 'error');
        }
      }

      // Timeout check
      if (attempts >= maxAttempts) {
        setError('Timeout: Exceeded waiting time for results.');
        setLoading(false);
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        showToast('Timeout', 'error');
      }
    };

    // Initial fetch
    fetchResult();
    
    // Set up polling interval
    intervalId = setInterval(() => {
      fetchResult();
    }, 2000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [evaluationId, showToast]);

  if (loading) {
    return (
      <div className="result-page">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
          <h2>AI analysis results for your resume</h2>
          <p>Please wait while we analyze your CV and provide detailed feedback...</p>
          <div className="loading-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min((pollingCount / 30) * 100, 100)}%` }}></div>
            </div>
            <span className="progress-text">Analyzing... {pollingCount}s</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error occurred</h2>
          <p>{error}</p>
          <button className="btn-retry" onClick={() => navigate('/home')}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="result-page">
      <EvaluationDetail evaluation={result} showMetadata={false} />
    </div>
  );
};

export default ResultPage;
