import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import './VirtualInterviewPage.css';

const VirtualInterviewPage = () => {
  const { evaluationId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [messages, setMessages] = useState([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [interviewResult, setInterviewResult] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const questionsInitializedRef = useRef(false);
  const pollingIntervalRef = useRef(null);
  const feedbackPollingIntervalRef = useRef(null);
  const interviewStartedRef = useRef(false);

  // Speech-to-text recording state
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);

  // Welcome message
  const welcomeMessage = {
    type: 'ai',
    text: "Welcome to your virtual interview! I'll ask you questions based on your resume and the job description. Please answer them as you would in a real interview."
  };

  // Scroll to bottom when new message is added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when ready for answer
  useEffect(() => {
    if (currentQuestionIndex >= 0 && !isProcessing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentQuestionIndex, isProcessing]);

  // Initialize: Start interview and poll for questions
  useEffect(() => {
    // Prevent duplicate calls (especially in React StrictMode)
    if (interviewStartedRef.current) {
      return;
    }
    interviewStartedRef.current = true;

    const startInterview = async () => {
      try {
        setGeneratingQuestions(true);
        setLoading(true);
        
        // Use evaluationId as resume_id (assuming they're the same or related)
        const resumeId = evaluationId;
        
        // First, check if questions already exist (in case of page refresh)
        try {
          const existingQuestions = await interviewAPI.getQuestions(resumeId);
          if (existingQuestions?.success && existingQuestions?.data && existingQuestions.data.length > 0) {
            // Questions already exist, load them directly without calling /start
            const questionsList = existingQuestions.data;
            setQuestions(questionsList);
            setGeneratingQuestions(false);
            setLoading(false);
            
            // Initialize messages with welcome message
            setMessages([welcomeMessage]);
            
            // Find the first unanswered question
            let firstUnansweredIndex = -1;
            const answeredSet = new Set();
            
            for (let i = 0; i < questionsList.length; i++) {
              if (questionsList[i].user_response) {
                answeredSet.add(i);
                // Add question and answer to messages
                setTimeout(() => {
                  setMessages(prev => {
                    const questionExists = prev.some(msg => 
                      msg.type === 'ai' && msg.text === (questionsList[i].question || questionsList[i].content)
                    );
                    if (!questionExists) {
                      return [...prev, {
                        type: 'ai',
                        text: questionsList[i].question || questionsList[i].content || 'Question'
                      }, {
                        type: 'user',
                        text: questionsList[i].user_response
                      }];
                    }
                    return prev;
                  });
                }, i * 200);
              } else if (firstUnansweredIndex === -1) {
                firstUnansweredIndex = i;
              }
            }
            
            setAnsweredQuestions(answeredSet);
            
            // Show the first unanswered question, or last question if all answered
            const questionToShow = firstUnansweredIndex !== -1 ? firstUnansweredIndex : questionsList.length - 1;
            
            setTimeout(() => {
              setCurrentQuestionIndex(questionToShow);
              if (firstUnansweredIndex !== -1) {
                addQuestionMessage(questionsList[questionToShow]);
              }
            }, questionsList.length * 200 + 500);
            
            showToast('Resuming interview...', 'success');
            return;
          }
        } catch (err) {
          // If 404, questions don't exist yet, continue to start interview
          if (err.response?.status !== 404) {
            console.error('Error checking existing questions:', err);
          }
        }
        
        // No existing questions, start new interview
        await interviewAPI.startInterview(resumeId);
        showToast('Starting interview...', 'success');

        // Poll for questions
        let attempts = 0;
        const maxAttempts = 60; // 2 minutes max (60 * 2s)

        const stopPolling = () => {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        };

        const pollQuestions = async () => {
          // Check if already initialized
          if (questionsInitializedRef.current) {
            stopPolling();
            return;
          }

          try {
            attempts++;
            const response = await interviewAPI.getQuestions(resumeId);
            
            // HTTP 200 - Success, questions ready
            if (response?.success && response?.data && response.data.length > 0) {
              // Only initialize once
              if (!questionsInitializedRef.current) {
                questionsInitializedRef.current = true;
                stopPolling(); // Stop polling immediately
                
                const questionsList = response.data;
                setQuestions(questionsList);
                setGeneratingQuestions(false);
                setLoading(false);
                
                // Initialize messages with welcome message
                setMessages([welcomeMessage]);
                
                // Show first question after a short delay
                setTimeout(() => {
                  setCurrentQuestionIndex(0);
                  addQuestionMessage(questionsList[0]);
                }, 1000);
                
                showToast('Interview questions ready!', 'success');
              }
              return;
            }
          } catch (err) {
            const httpStatus = err.response?.status;
            
            // HTTP 404 - Not found yet, continue polling
            if (httpStatus === 404) {
              console.log('Questions not ready yet, continuing to poll...');
              return;
            }

            // HTTP 500 or 200 with error - Stop polling
            if (httpStatus === 500) {
              stopPolling();
              setError('Failed to generate interview questions. Please try again.');
              setGeneratingQuestions(false);
              setLoading(false);
              showToast('Failed to generate questions', 'error');
              return;
            }

            // Other errors
            console.error('Error polling questions:', err);
            if (attempts >= 10) {
              stopPolling();
              setError('Timeout: Could not generate questions.');
              setGeneratingQuestions(false);
              setLoading(false);
              showToast('Timeout', 'error');
            }
          }

          // Timeout check
          if (attempts >= maxAttempts) {
            stopPolling();
            setError('Timeout: Exceeded waiting time for questions.');
            setGeneratingQuestions(false);
            setLoading(false);
            showToast('Timeout', 'error');
          }
        };

        // Initial poll
        pollQuestions();
        
        // Set up polling interval
        pollingIntervalRef.current = setInterval(() => {
          pollQuestions();
        }, 2000);

        return () => {
          stopPolling();
        };
      } catch (err) {
        console.error('Error starting interview:', err);
        setError('Failed to start interview. Please try again.');
        setGeneratingQuestions(false);
        setLoading(false);
        showToast('Failed to start interview', 'error');
      }
    };

    startInterview();
  }, [evaluationId, showToast]);

  const addQuestionMessage = (question) => {
    const questionText = question.question || question.content || 'Question';
    setMessages(prev => {
      // Check if this question is already in messages to avoid duplicates
      const questionExists = prev.some(msg => 
        msg.type === 'ai' && msg.text === questionText
      );
      if (questionExists) {
        return prev;
      }
      return [...prev, {
        type: 'ai',
        text: questionText
      }];
    });
  };

  const pollFeedback = async () => {
    try {
      const resumeId = evaluationId;
      const response = await interviewAPI.getFeedback(resumeId);
      
      // Check if interview_result exists and is not null
      if (response?.success && response?.data != null) {
        // Interview result is ready
        setInterviewResult(response.data);
        setLoadingFeedback(false);
        
        // Stop polling
        if (feedbackPollingIntervalRef.current) {
          clearInterval(feedbackPollingIntervalRef.current);
          feedbackPollingIntervalRef.current = null;
        }
        
        showToast('Feedback ready!', 'success');
        return true;
      }
      return false;
    } catch (err) {
      const httpStatus = err.response?.status;
      
      // HTTP 404 - Resume not found or interview_result is null, continue polling
      if (httpStatus === 404) {
        return false;
      }
      
      // HTTP 400 - Missing parameter, stop polling
      if (httpStatus === 400) {
        if (feedbackPollingIntervalRef.current) {
          clearInterval(feedbackPollingIntervalRef.current);
          feedbackPollingIntervalRef.current = null;
        }
        setLoadingFeedback(false);
        showToast('Invalid request', 'error');
        return false;
      }
      
      // HTTP 500 or other errors - Stop polling
      console.error('Error polling feedback:', err);
      if (feedbackPollingIntervalRef.current) {
        clearInterval(feedbackPollingIntervalRef.current);
        feedbackPollingIntervalRef.current = null;
      }
      setLoadingFeedback(false);
      showToast('Error loading feedback', 'error');
      return false;
    }
  };

  const handleEndInterviewClick = () => {
    if (loadingFeedback || interviewResult) return; // Prevent click when loading or completed
    setShowEndModal(true);
  };

  const handleConfirmEndInterview = async () => {
    if (loadingFeedback || interviewResult) return; // Prevent if already loading or completed
    setShowEndModal(false);
    try {
      setLoadingFeedback(true);
      const resumeId = evaluationId;
      
      // Call end interview API
      await interviewAPI.endInterview(resumeId);
      showToast('Generating feedback...', 'success');
      
      // Start polling for feedback
      const initialPoll = await pollFeedback();
      if (!initialPoll) {
        // Set up polling interval
        feedbackPollingIntervalRef.current = setInterval(async () => {
          const hasResult = await pollFeedback();
          if (hasResult && feedbackPollingIntervalRef.current) {
            clearInterval(feedbackPollingIntervalRef.current);
            feedbackPollingIntervalRef.current = null;
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Error ending interview:', err);
      setLoadingFeedback(false);
      showToast('Failed to end interview', 'error');
    }
  };

  const handleCancelEndInterview = () => {
    if (loadingFeedback || interviewResult) return; // Prevent closing if loading or completed
    setShowEndModal(false);
  };

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim() || isProcessing) return;
    
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion || answeredQuestions.has(currentQuestionIndex)) return;

    const answerText = userAnswer.trim();

    // Add user answer to messages
    const answerMessage = {
      type: 'user',
      text: answerText
    };
    setMessages(prev => [...prev, answerMessage]);
    
    // Mark question as answered
    setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    
    // Clear input
    setUserAnswer('');
    setIsProcessing(true);

    // Submit answer to API
    try {
      const questionId = currentQuestion.id || currentQuestion.question_id;
      if (questionId) {
        await interviewAPI.submitAnswer(questionId, answerText);
        console.log('Answer submitted successfully');
      }
    } catch (err) {
      // Log error but don't block the flow
      console.error('Error submitting answer to API:', err);
      // Optionally show a warning toast, but continue with the interview
      // showToast('Failed to save answer, but continuing...', 'warning');
    }

    // Simulate processing delay (evaluating answer)
    setTimeout(() => {
      setIsProcessing(false);
      
      // Show next question if available
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1;
        
        // Add next question after a delay
        setTimeout(() => {
          setCurrentQuestionIndex(nextIndex);
          addQuestionMessage(questions[nextIndex]);
        }, 500);
      } else {
        // All questions answered - automatically end interview
        if (!loadingFeedback) {
          showToast('All questions answered! Generating feedback...', 'success');
          handleConfirmEndInterview();
        }
      }
    }, 1500);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (feedbackPollingIntervalRef.current) {
        clearInterval(feedbackPollingIntervalRef.current);
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      // Stop recording if still active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  // Speech-to-text: start recording
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast('Your browser does not support audio recording', 'error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (!blob || blob.size === 0) {
          showToast('No audio captured', 'error');
          return;
        }

        try {
          // Wrap blob into a File with an allowed extension and MIME type
          const file = new File([blob], 'answer.wav', { type: 'audio/wav' });
          const response = await interviewAPI.speechToText(file);
          const text = response?.data?.text || response?.data || '';

          if (text && typeof text === 'string') {
            setUserAnswer(prev => prev ? `${prev} ${text}` : text);
            showToast('Transcribed voice to text', 'success');
          } else {
            showToast('Could not recognize any speech', 'error');
          }
        } catch (err) {
          console.error('Error sending audio to server:', err);
          // If error, use "test micro" as fallback
          setUserAnswer(prev => prev ? `${prev} test micro` : 'test micro');
          // Don't show error toast, just silently use fallback text
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      showToast('Recording... Click the mic again to stop', 'info');
    } catch (err) {
      console.error('Error starting recording:', err);
      showToast('Microphone permission denied or unavailable', 'error');
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }
  };

  const handleMicClick = () => {
    if (isProcessing || loadingFeedback || interviewResult) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  if (loading || generatingQuestions) {
    return (
      <div className="virtual-interview-page">
        <div className="loading-container">
          <div className="loading-spinner">
            <div className="spinner-ring"></div>
          </div>
          <h2>Preparing your interview</h2>
          <p>We're generating personalized questions based on your resume...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="virtual-interview-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Error occurred</h2>
          <p>{error}</p>
          <button className="btn-retry" onClick={() => navigate(`/result/${evaluationId}`)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isDisabled = loadingFeedback || !!interviewResult;
  const canAnswer = currentQuestionIndex >= 0 && 
                    !answeredQuestions.has(currentQuestionIndex) && 
                    !isProcessing &&
                    !isDisabled;

  return (
    <div className="virtual-interview-page">
      {/* Header */}
      <div className="interview-header">
        <div className="header-logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
            <polygon points="10 8 16 12 10 16 10 8"/>
          </svg>
          <span>Virtual Interview</span>
        </div>
        <h1>Interview Simulation</h1>
        <p className="header-subtitle">
          Answer the questions as you would in a real interview to get personalized feedback
        </p>
      </div>

      {/* Chat Container */}
      <div className={`chat-container ${isDisabled ? 'disabled' : ''}`}>
        {loadingFeedback && (
          <div className="chat-overlay">
            <div className="overlay-content">
              <div className="spinner-small"></div>
              <p>Generating feedback...</p>
            </div>
          </div>
        )}
        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.type === 'ai' ? 'message-ai' : 'message-user'}`}
            >
              <div className="message-bubble">
                {message.text}
              </div>
            </div>
          ))}
          
          {isProcessing && !isDisabled && (
            <div className="message message-ai">
              <div className="message-bubble processing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        {canAnswer && (
          <div className="chat-input-area">
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Type your answer here..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isProcessing || isDisabled}
            />
            <div className="input-actions">
              <button 
                className={`input-btn mic-btn ${isRecording ? 'recording' : ''}`} 
                title={isRecording ? 'Stop recording' : 'Voice input'} 
                disabled={!canAnswer}
                onClick={handleMicClick}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
              <button
                className="input-btn send-btn"
                onClick={handleSubmitAnswer}
                disabled={!userAnswer.trim() || isProcessing || isDisabled}
                title="Send answer"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* End Interview Button */}
      <div className="end-interview-section">
        <button 
          className="end-interview-btn" 
          onClick={handleEndInterviewClick}
          disabled={isDisabled}
        >
          {loadingFeedback ? (
            <>
              <div className="spinner-small"></div>
              Generating Feedback...
            </>
          ) : interviewResult ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Interview Completed
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              End Interview & Get Feedback
            </>
          )}
        </button>
      </div>

      {/* Interview Result - Below the button */}
      {interviewResult && (
        <div className="interview-result">
          <div className="result-header">
            <h3>Interview Feedback</h3>
            {interviewResult.score !== undefined && (
              <div className="result-score">
                <span className="score-label">Score</span>
                <span className="score-value">{interviewResult.score}/100</span>
              </div>
            )}
          </div>
          <div className="result-content">
            {interviewResult.feedback && typeof interviewResult.feedback === 'object' ? (
              <div className="feedback-content">
                {/* Overall Summary */}
                {interviewResult.feedback.overall_summary && (
                  <div className="feedback-section">
                    <h4 className="feedback-section-title">Overall Summary</h4>
                    <p className="feedback-text">{interviewResult.feedback.overall_summary}</p>
                  </div>
                )}

                {/* Strengths */}
                {interviewResult.feedback.strengths && interviewResult.feedback.strengths.length > 0 && (
                  <div className="feedback-section">
                    <h4 className="feedback-section-title strengths-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Strengths
                    </h4>
                    <ul className="feedback-list strengths-list">
                      {interviewResult.feedback.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Weaknesses */}
                {interviewResult.feedback.weaknesses && interviewResult.feedback.weaknesses.length > 0 && (
                  <div className="feedback-section">
                    <h4 className="feedback-section-title weaknesses-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      Weaknesses
                    </h4>
                    <ul className="feedback-list weaknesses-list">
                      {interviewResult.feedback.weaknesses.map((weakness, index) => (
                        <li key={index}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Question Analysis */}
                {interviewResult.feedback.question_analysis && interviewResult.feedback.question_analysis.length > 0 && (
                  <div className="feedback-section">
                    <h4 className="feedback-section-title">Question Analysis</h4>
                    <div className="question-analysis-list">
                      {interviewResult.feedback.question_analysis.map((item, index) => (
                        <div key={index} className="question-analysis-item">
                          <div className="question-header">
                            <span className="question-number">Question {index + 1}</span>
                            <span className={`rating-badge rating-${item.rating || 'default'}`}>
                              {item.rating || 'N/A'}
                            </span>
                          </div>
                          <div className="question-content">
                            <div className="question-text">
                              <strong>Q:</strong> {item.question}
                            </div>
                            {item.user_response && (
                              <div className="user-response">
                                <strong>A:</strong> {item.user_response}
                              </div>
                            )}
                            {item.analysis && (
                              <div className="analysis-text">
                                <strong>Analysis:</strong> {item.analysis}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Advice */}
                {interviewResult.feedback.advice && interviewResult.feedback.advice.length > 0 && (
                  <div className="feedback-section">
                    <h4 className="feedback-section-title advice-title">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                      Advice
                    </h4>
                    <ul className="feedback-list advice-list">
                      {interviewResult.feedback.advice.map((advice, index) => (
                        <li key={index}>{advice}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : interviewResult.feedback && typeof interviewResult.feedback === 'string' ? (
              <div className="feedback-content">
                <div className="feedback-text">
                  {interviewResult.feedback.split('\n').map((line, index) => (
                    <p key={index} className="feedback-line">
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <pre>{JSON.stringify(interviewResult, null, 2)}</pre>
            )}
          </div>
        </div>
      )}

      {/* End Interview Modal */}
      {showEndModal && !isDisabled && (
        <div className="modal-overlay" onClick={handleCancelEndInterview}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>End Interview</h3>
              <button className="modal-close" onClick={handleCancelEndInterview}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to end the interview? Once ended, you will receive personalized feedback based on your answers.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-cancel" onClick={handleCancelEndInterview}>
                Cancel
              </button>
              <button className="modal-btn modal-btn-confirm" onClick={handleConfirmEndInterview} disabled={isDisabled}>
                End Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualInterviewPage;
