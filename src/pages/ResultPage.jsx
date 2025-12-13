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
          // Get metadata from localStorage
          const metadataKey = `eval_${evaluationId}`;
          const savedMetadata = localStorage.getItem(metadataKey);
          let metadata = {};
          
          console.log('Fetching metadata for:', metadataKey);
          console.log('Saved metadata:', savedMetadata);
          
          if (savedMetadata) {
            try {
              metadata = JSON.parse(savedMetadata);
              console.log('Parsed metadata:', metadata);
            } catch (e) {
              console.error('Error parsing metadata:', e);
            }
          }
          
          // If metadata not found, try to get from history API as fallback
          if (!metadata.file_name || !metadata.jobDescription) {
            try {
              const historyResponse = await evaluateAPI.getHistory();
              if (historyResponse?.success && historyResponse?.data) {
                const historyItem = historyResponse.data.find(item => item.id === evaluationId);
                if (historyItem) {
                  console.log('Found in history:', historyItem);
                  metadata = {
                    file_name: historyItem.file_name || metadata.file_name,
                    jobDescription: historyItem.jobDescription || metadata.jobDescription,
                    created_at: historyItem.created_at || metadata.created_at,
                  };
                }
              }
            } catch (err) {
              console.error('Error fetching from history:', err);
            }
          }
          
          // Build full evaluation object with evaluation_result
          const fullEvaluation = {
            id: evaluationId,
            status: 'completed',
            file_name: metadata.file_name || 'Resume.pdf',
            jobDescription: metadata.jobDescription || '',
            created_at: metadata.created_at || new Date().toISOString(),
            evaluation_result: evaluationData,
          };
          
          console.log('Full evaluation object:', fullEvaluation);
          console.log('Job description:', fullEvaluation.jobDescription);
          console.log('Job description length:', fullEvaluation.jobDescription?.length);
          
          // Clean up localStorage
          localStorage.removeItem(metadataKey);
          
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
      <EvaluationDetail evaluation={result} />
    </div>
  );
};

export default ResultPage;
