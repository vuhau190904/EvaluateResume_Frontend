import { useState, useEffect } from 'react';
import { suggestAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './SuggestJDPage.css';

const SuggestJDPage = () => {
  const { showToast } = useToast();
  
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const [pollingProgress, setPollingProgress] = useState(0);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await suggestAPI.getHistory();
      if (response.success && response.data) {
        setHistory(response.data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchInput.trim()) {
      showToast('Please enter a search keyword', 'error');
      return;
    }

    setIsSearching(true);
    setResults([]);
    setSelectedHistoryId(null);

    try {
      // Call initial search API
      const response = await suggestAPI.searchJob(searchInput.trim());
      
      if (response.success && response.data?.search_id) {
        const searchId = response.data.search_id;
        showToast('Search started! Fetching job descriptions...', 'info');
        
        // Start polling
        await pollSearchResult(searchId);
        
        // Refresh history after successful search
        fetchHistory();
      }
    } catch (err) {
      console.error('Error starting search:', err);
      showToast(err.response?.data?.message || 'Failed to start search', 'error');
      setIsSearching(false);
    }
  };

  const pollSearchResult = async (searchId) => {
    setIsPolling(true);
    setPollingProgress(0);
    
    const maxAttempts = 20; // 60 seconds max
    const interval = 3000; // 3 seconds
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        setPollingProgress((attempts / maxAttempts) * 100);

        const response = await suggestAPI.getSearchResult(searchId);
        
        if (response.success && response.data) {
          const { status, search_result } = response.data;

          console.log(`Polling attempt ${attempts}, status:`, status);

          if (status === 'completed') {
            if (search_result && Array.isArray(search_result)) {
              setResults(search_result);
              showToast(`Found ${search_result.length} job results!`, 'success');
            } else {
              setResults([]);
              showToast('Search completed but no results found', 'info');
            }
            setIsSearching(false);
            setIsPolling(false);
            setSelectedHistoryId(searchId);
            
            // Refresh history after successful polling
            fetchHistory();
            return;
          }

          if (status === 'failed') {
            showToast('Search failed. Please try again.', 'error');
            setIsSearching(false);
            setIsPolling(false);
            
            // Refresh history to update status
            fetchHistory();
            return;
          }

          // Continue polling if pending or processing
          if (attempts < maxAttempts) {
            setTimeout(poll, interval);
          } else {
            showToast('Search timeout. Please try again.', 'error');
            setIsSearching(false);
            setIsPolling(false);
            
            // Refresh history on timeout
            fetchHistory();
          }
        }
      } catch (err) {
        console.error('Error polling search result:', err);
        
        // Continue polling on error (might be temporary)
        if (attempts < maxAttempts) {
          setTimeout(poll, interval);
        } else {
          showToast('Error fetching results. Please try again.', 'error');
          setIsSearching(false);
          setIsPolling(false);
          
          // Refresh history on error
          fetchHistory();
        }
      }
    };

    poll();
  };

  const handleHistoryClick = (item) => {
    // Only allow clicking on completed searches
    if (item.status !== 'completed') {
      return; // Do nothing for non-completed items
    }

    if (item.search_result && Array.isArray(item.search_result)) {
      setResults(item.search_result);
      setSearchInput(item.search_input);
      setSelectedHistoryId(item.id);
    } else {
      showToast('No results found for this search', 'info');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'warning', icon: '⏳', text: 'Pending' },
      processing: { color: 'info', icon: '🔄', text: 'Processing' },
      completed: { color: 'success', icon: '✓', text: 'Completed' },
      failed: { color: 'danger', icon: '✗', text: 'Failed' }
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="suggest-jd-page">
      <div className="page-header">
        <h1>Suggest Job Description</h1>
        <p className="page-subtitle">Search for job descriptions based on your keywords</p>
      </div>

      {/* Search Section */}
      <form className="search-section" onSubmit={handleSearch}>
        <div className="search-bar">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search for job descriptions (e.g., Backend Developer, Frontend Intern...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            disabled={isSearching}
          />
          <button 
            type="submit" 
            className="btn-search"
            disabled={isSearching || !searchInput.trim()}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {isPolling && (
          <div className="polling-indicator">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${pollingProgress}%` }}
              />
            </div>
            <p className="polling-text">Searching for job descriptions... Please wait</p>
          </div>
        )}
      </form>

      <div className="content-wrapper">
        {/* Results Section */}
        <div className="results-section">
          {isSearching && !results.length ? (
            <div className="loading-state">
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
              </div>
              <p>Searching for job descriptions...</p>
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="results-header">
                <h2>Search Results</h2>
                <span className="results-count">{results.length} jobs found</span>
              </div>
              <div className="jobs-grid">
                {results.map((job, index) => (
                  <div key={index} className="job-card">
                    <div className="job-header">
                      <h3 className="job-title">{job.title}</h3>
                      {job.datePosted === 'Recently' && (
                        <span className="badge-new">New</span>
                      )}
                    </div>

                    <div className="job-meta">
                      <div className="job-company">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 21h18M9 8h1m-1 4h1m4-4h1m-1 4h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
                        </svg>
                        <span>{job.company || 'Not specified'}</span>
                      </div>

                      <div className="job-location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span>{job.location || 'Not specified'}</span>
                      </div>

                      <div className="job-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span>{job.datePosted}</span>
                      </div>
                    </div>

                    <div className="job-description">
                      <p>{job.description || 'No description available'}</p>
                    </div>

                    <div className="job-footer">
                      <a 
                        href={job.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-view-job"
                      >
                        <span>View on LinkedIn</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <h3>No results yet</h3>
              <p>Enter a keyword and search for job descriptions</p>
            </div>
          )}
        </div>

        {/* History Sidebar */}
        <div className="history-sidebar">
          <div className="history-header">
            <h3>Search History</h3>
            <span className="history-count">{history.length}</span>
          </div>

          {history.length > 0 ? (
            <div className="history-list">
              {history.map((item) => {
                const badge = getStatusBadge(item.status);
                const isClickable = item.status === 'completed';
                return (
                  <div 
                    key={item.id}
                    className={`history-item ${selectedHistoryId === item.id ? 'active' : ''} ${!isClickable ? 'disabled' : ''}`}
                    onClick={isClickable ? () => handleHistoryClick(item) : undefined}
                    style={{ cursor: isClickable ? 'pointer' : 'default' }}
                  >
                    <div className="history-item-header">
                      <span className="history-search-text">{item.search_input}</span>
                      <span className={`status-badge ${badge.color}`}>
                        <span className="badge-icon">{badge.icon}</span>
                        <span className="badge-text">{badge.text}</span>
                      </span>
                    </div>
                    {item.status === 'completed' && item.search_result && (
                      <div className="history-item-footer">
                        <span className="result-count">
                          {Array.isArray(item.search_result) ? item.search_result.length : 0} jobs
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="history-empty">
              <p>No search history yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestJDPage;



