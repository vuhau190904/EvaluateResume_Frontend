import './EvaluationDetail.css';

const EvaluationDetail = ({ evaluation, showMetadata = true }) => {
  if (!evaluation) {
    return <div className="evaluation-detail">No evaluation data available</div>;
  }

  const evaluationResult = evaluation.evaluation_result?.evaluationResult;
  const layoutResult = evaluation.evaluation_result?.layoutResult;

  // Get recommendation color/icon
  const getRecommendationBadge = (recommendation) => {
    if (!recommendation) return { color: 'default', icon: '?' };
    
    const lower = recommendation.toLowerCase();
    if (lower.includes('should interview') || lower.includes('highly recommend')) {
      return { color: 'success', icon: '✓', text: 'Should Interview' };
    } else if (lower.includes('further consideration') || lower.includes('need')) {
      return { color: 'warning', icon: '!', text: 'Need Further Consideration' };
    } else if (lower.includes('not recommend') || lower.includes('reject')) {
      return { color: 'danger', icon: '✗', text: 'Not Recommended' };
    }
    return { color: 'default', icon: '?', text: recommendation };
  };

  const recommendation = getRecommendationBadge(evaluationResult?.analysis?.recommendation);

  // Score color helper
  const getScoreColor = (score, maxScore = 20) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'poor';
  };

  return (
    <div className="evaluation-detail">
      {/* Header Section - Only show if showMetadata is true */}
      {showMetadata && (
        <div className="detail-header">
          <div className="header-info">
            {evaluation.file_name && <h2>{evaluation.file_name}</h2>}
            {evaluation.created_at && (
              <p className="eval-date">
                Evaluated on {new Date(evaluation.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
            
            {/* Job Description */}
            {evaluation.jobDescription && evaluation.jobDescription.trim() && (
              <div className="jd-header-section">
                <h4 className="jd-header-title">Job Description</h4>
                <div className="jd-header-content">
                  {evaluation.jobDescription.split('\n').map((line, index) => (
                    <p key={index} className="jd-line">
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overall Scores Summary */}
      <div className="scores-summary">
        <div className="score-card total">
          <div className="score-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <div className="score-content">
            <span className="score-label">Total Content Score</span>
            <span className="score-value">{evaluationResult?.evaluation?.total_score || 0}/100</span>
          </div>
        </div>
        
        <div className="score-card layout">
          <div className="score-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </div>
          <div className="score-content">
            <span className="score-label">Layout Score</span>
            <span className="score-value">{layoutResult?.overall_layout_score || 0}/20</span>
          </div>
        </div>
      </div>

      {/* Content Evaluation Section */}
      <div className="evaluation-section">
        <div className="section-header">
          <h3>Content Evaluation</h3>
          <p className="section-subtitle">Detailed breakdown of CV content assessment</p>
        </div>

        {/* Score Breakdown */}
        <div className="score-breakdown">
          {[
            { label: 'Education', score: evaluationResult?.evaluation?.education_score, max: 10 },
            { label: 'Experience', score: evaluationResult?.evaluation?.experience_score, max: 20 },
            { label: 'Technical Skills', score: evaluationResult?.evaluation?.technical_skills_score, max: 20 },
            { label: 'Soft Skills', score: evaluationResult?.evaluation?.soft_skills_score, max: 10 },
            { label: 'Projects & Achievements', score: evaluationResult?.evaluation?.projects_achievements_score, max: 40 }
          ].map((item, index) => (
            <div key={index} className="score-item">
              <div className="score-item-header">
                <span className="score-item-label">{item.label}</span>
                <span className={`score-item-value ${getScoreColor(item.score, item.max)}`}>
                  {item.score}/{item.max}
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${getScoreColor(item.score, item.max)}`}
                  style={{ width: `${(item.score / item.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Analysis Details */}
        <div className="analysis-section">
          <div className="analysis-card">
            <h4>Education Analysis</h4>
            <p>{evaluationResult?.analysis?.education_analysis}</p>
          </div>

          <div className="analysis-card">
            <h4>Experience Analysis</h4>
            <p>{evaluationResult?.analysis?.experience_analysis}</p>
          </div>

          <div className="analysis-card">
            <h4>Skills Analysis</h4>
            <p>{evaluationResult?.analysis?.skills_analysis}</p>
          </div>

          <div className="analysis-card highlight">
            <h4>Overall Comment</h4>
            <p>{evaluationResult?.analysis?.overall_comment}</p>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="strengths-weaknesses">
          <div className="sw-card strengths">
            <div className="sw-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h4>Strengths</h4>
            </div>
            <ul>
              {evaluationResult?.analysis?.strengths?.map((strength, index) => (
                <li key={index}>{strength}</li>
              ))}
            </ul>
          </div>

          <div className="sw-card weaknesses">
            <div className="sw-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <h4>Weaknesses</h4>
            </div>
            <ul>
              {evaluationResult?.analysis?.weaknesses?.map((weakness, index) => (
                <li key={index}>{weakness}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Layout Evaluation Section */}
      <div className="evaluation-section">
        <div className="section-header">
          <h3>Layout Evaluation</h3>
          <p className="section-subtitle">Visual design and formatting assessment</p>
        </div>

        {/* Layout Score Breakdown */}
        <div className="layout-scores">
          {[
            { label: 'Header', score: layoutResult?.header_score },
            { label: 'Contact Info', score: layoutResult?.contact_info_score },
            { label: 'Section Structure', score: layoutResult?.section_structure_score },
            { label: 'Alignment', score: layoutResult?.alignment_score },
            { label: 'Font Style', score: layoutResult?.font_style_score },
            { label: 'Whitespace Balance', score: layoutResult?.whitespace_balance_score },
            { label: 'Visual Hierarchy', score: layoutResult?.visual_hierarchy_score }
          ].map((item, index) => {
            const score = item.score ?? 0;
            const percentage = (score / 20) * 100;
            const scoreColor = getScoreColor(score, 20);
            
            return (
              <div key={index} className="layout-score-item">
                <span className="layout-label">{item.label}</span>
                <div className="layout-score-bar">
                  <div 
                    className={`layout-score-fill ${scoreColor}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className={`layout-score-value ${scoreColor}`}>
                  {score}/20
                </span>
              </div>
            );
          })}
        </div>

        {/* Layout Issues */}
        {layoutResult?.issues && layoutResult.issues.length > 0 && (
          <div className="layout-issues">
            <h4>Issues Identified</h4>
            <ul>
              {layoutResult.issues.map((issue, index) => (
                <li key={index}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Layout Comments */}
        {layoutResult?.comments && (
          <div className="layout-comments">
            <h4>Comments</h4>
            <p>{layoutResult.comments}</p>
          </div>
        )}
      </div>

      {/* Recommendation Badge */}
      <div className="recommendation-section">
        <div className={`recommendation-badge ${recommendation.color}`}>
          <span className="badge-icon">{recommendation.icon}</span>
          <span className="badge-text">{recommendation.text}</span>
        </div>
      </div>
    </div>
  );
};

export default EvaluationDetail;

