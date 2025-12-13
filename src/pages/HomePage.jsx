import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluateAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { v4 as uuidv4 } from 'uuid';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [cvFile, setCvFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSetFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      showToast('Please select a PDF file', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size should not exceed 10MB', 'error');
      return;
    }
    setCvFile(file);
    showToast('File selected successfully', 'success');
  };

  const removeFile = () => {
    setCvFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvFile) {
      showToast('Please select a CV file', 'error');
      return;
    }
    if (!jobDescription.trim()) {
      showToast('Please enter job description', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const evaluationId = uuidv4();
      
      // Save metadata to localStorage for result page
      const metadata = {
        file_name: cvFile.name,
        jobDescription: jobDescription.trim(),
        created_at: new Date().toISOString()
      };
      console.log('Saving metadata:', metadata);
      localStorage.setItem(`eval_${evaluationId}`, JSON.stringify(metadata));
      
      await evaluateAPI.uploadResume(cvFile, jobDescription, evaluationId);
      showToast('Upload successful! Processing...', 'success');
      navigate(`/result/${evaluationId}`);
    } catch (error) {
      console.error('Error uploading resume:', error);
      showToast(error.response?.data?.message || 'Error uploading CV', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="page-intro">
        <h2>Intelligent CV Evaluation with AI</h2>
        <p>Upload your CV and job description to receive detailed analysis in seconds</p>
      </div>

      <form className="upload-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Upload CV (PDF)</span>
          </label>

          <div 
            className={`file-drop ${dragActive ? 'active' : ''} ${cvFile ? 'has-file' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!cvFile ? (
              <>
                <div className="drop-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                  </svg>
                </div>
                <p className="drop-text">Drag and drop PDF file here</p>
                <p className="drop-or">or</p>
                <label className="file-btn">
                  Choose File
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleFileChange} 
                    disabled={isUploading}
                    hidden
                  />
                </label>
                <p className="file-hint">PDF • Max 10MB</p>
              </>
            ) : (
              <div className="file-selected">
                <div className="file-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
                <div className="file-details">
                  <p className="file-name">{cvFile.name}</p>
                  <p className="file-size">{(cvFile.size / 1024).toFixed(2)} KB</p>
                </div>
                <button type="button" className="file-remove" onClick={removeFile} disabled={isUploading}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <span>Job Description</span>
          </label>
          <textarea
            className="form-textarea"
            placeholder="Enter job description, required skills, experience..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            disabled={isUploading}
            rows={8}
          />
          <p className="char-count">{jobDescription.length} characters</p>
        </div>

        <button type="submit" className="btn-submit" disabled={isUploading || !cvFile || !jobDescription.trim()}>
          {isUploading ? (
            <>
              <div className="spinner"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              <span>Evaluate Now</span>
            </>
          )}
        </button>
      </form>

      <div className="features">
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Fast</h3>
          <p>Results in seconds</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Accurate</h3>
          <p>Deep AI analysis</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <h3>Secure</h3>
          <p>Encrypted information</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
