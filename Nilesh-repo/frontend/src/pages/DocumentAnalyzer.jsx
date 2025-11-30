import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Bot,
  MessageCircle,
  Send,
  FileText,
  Loader2,
  History,
  X,
  Sparkles,
  User,
  Copy,
  Check,
  ShieldAlert,
  Lightbulb,
  Users,
  DollarSign,
  Calendar,
  Clock,
  BookOpen,
  Maximize2,
} from 'lucide-react';

import { uploadDocument as uploadDocumentApi, getUserSessions as getUserSessionsApi, getChatHistory as getChatHistoryApi, sendChatMessage as sendChatMessageApi, } from '../utils/api';

const SCORE_LABELS = {
  5: 'Critical',
  4: 'High',
  3: 'Medium',
  2: 'Low',
  1: 'Minimal',
};

const coerceRiskScore = (value) => {
  if (value === null || value === undefined) return null;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return null;
  return Math.min(5, Math.max(1, Math.round(numeric)));
};

const getRiskDisplay = (clause) => {
  const score = coerceRiskScore(clause?.risk_score ?? clause?.riskScore);
  const level = clause?.risk_level || clause?.riskLevel || (score ? SCORE_LABELS[score] : null);
  return {
    score,
    level: level || 'High',
  };
};

const getMitigation = (clause) => (clause?.mitigation || clause?.suggestion || clause?.recommendation || clause?.proposed_change || clause?.proposedChange || '').trim();

const getReplacementClause = (clause) => (clause?.replacement_clause || clause?.replacementClause || clause?.alternate_clause || clause?.alternateClause || clause?.alternative_clause || clause?.alternativeClause || '').trim();

// Modal component for expanded sections
const ExpandedModal = ({ section, onClose, children, title }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 pt-20">
    <div className={`bg-card/95 backdrop-blur-xl rounded-2xl border border-border/50 w-full max-w-6xl flex flex-col shadow-2xl ${section === 'chat' ? 'h-[85vh]' : 'max-h-[85vh]'}`}>
      <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5 flex items-center justify-between flex-shrink-0">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-muted-foreground" />
        </button>
      </div>
      <div className={`flex-1 min-h-0 ${section === 'chat' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto custom-scrollbar p-6'}`}>
        {children}
      </div>
    </div>
  </div>
);

const DocumentAnalyzer = () => {
  const fileInputRef = useRef(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [summary, setSummary] = useState('');
  const [comprehensiveSummary, setComprehensiveSummary] = useState(null); // NEW: Structured detailed summary
  const [comprehensiveSummaryLoading, setComprehensiveSummaryLoading] = useState(false); // Loading state
  const [showDetailedSummary, setShowDetailedSummary] = useState(false); // Toggle for detailed view
  const [highlightedPreview, setHighlightedPreview] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [highRiskClauses, setHighRiskClauses] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [isSummaryCopied, setIsSummaryCopied] = useState(false); // New state for copy status
  const [expandedSection, setExpandedSection] = useState(null); // Modal state: 'preview', 'analysis', 'chat', or null
  const [documentType, setDocumentType] = useState(''); // New state for document type
  const [documentTypeConfidence, setDocumentTypeConfidence] = useState(null); // New state for document type confidence
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);


  const resetForNewDocument = () => {
    setUploadedFile(null);
    setSummary('');
    setComprehensiveSummary(null);
    setComprehensiveSummaryLoading(false);
    setShowDetailedSummary(false);
    setHighlightedPreview('');
    setPreviewText('');
    setHighRiskClauses([]);
    setSessionId(null);
    setChatHistory([]);
    setError('');

  };

  const handleCopySummary = () => {
    const riskSection = highRiskClauses.length
      ? ['High Risk Clauses:', ...highRiskClauses.map((clause, index) => {
        const { score, level } = getRiskDisplay(clause);
        const badge = score ? `${level} (${score}/5)` : level;
        const text = clause?.clause_text || clause?.clauseText || '';
        const rationale = clause?.rationale || clause?.reason || '';
        const mitigation = getMitigation(clause);
        const replacement = getReplacementClause(clause);
        const clauseLine = text ? `${index + 1}. [${badge}] ${text}` : `${index + 1}. [${badge}]`;
        const rationaleLine = rationale ? `${clauseLine} — ${rationale}` : clauseLine;
        const mitigationLine = mitigation ? `${rationaleLine}\n   Mitigation: ${mitigation}` : rationaleLine;
        return replacement ? `${mitigationLine}\n   Alternate Clause: ${replacement}` : mitigationLine;
      })].join('\n')
      : 'High Risk Clauses: None flagged.';

    const copyPayload = [summary, '', riskSection].filter(Boolean).join('\n').trim();
    navigator.clipboard.writeText(copyPayload);
    setIsSummaryCopied(true);
    setTimeout(() => setIsSummaryCopied(false), 2000); // Reset after 2 seconds
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    setUploadedFile(file);
    setError('');
    setUploading(true);
    setSummary('');
    setHighlightedPreview('');
    setPreviewText('');
    setHighRiskClauses([]);

    try {
      const response = await uploadDocumentApi(file);

      const previewHtml = response?.highlighted_preview ?? response?.highlightedPreview ?? '';
      const previewPlain = response?.preview_text ?? response?.previewText ?? '';
      const riskClausesRaw = response?.high_risk_clauses ?? response?.highRiskClauses ?? response?.risk_clauses ?? [];

      setHighlightedPreview(previewHtml || '');
      setPreviewText(previewPlain || '');
      setHighRiskClauses(Array.isArray(riskClausesRaw) ? riskClausesRaw : []);

      // Accept multiple possible shapes from backend
      const receivedSummary = response?.summary ?? response?.data?.summary ?? '';
      const receivedComprehensiveSummary = response?.comprehensive_summary ?? response?.data?.comprehensive_summary ?? null;
      const receivedSessionId = response?.session_id ?? response?.sessionId ?? null;

      // Store comprehensive summary if available
      setComprehensiveSummaryLoading(false);
      if (receivedComprehensiveSummary) {
        setComprehensiveSummary(receivedComprehensiveSummary);
        console.log('✅ Comprehensive summary received:', receivedComprehensiveSummary);
      } else {
        console.log('⚠️ No comprehensive_summary in response. Keys:', Object.keys(response || {}));
        console.log('Full response:', response);
      }

      // If backend didn't provide a session id, create a client-side one so chat works
      const finalSessionId = receivedSessionId ?? `local-${Date.now()}`;
      setSessionId(finalSessionId);

      if (receivedSummary) {
        setSummary(receivedSummary);
        setChatHistory([
          {
            id: Date.now(),
            sender: 'AdvocAI',
            message:
              "Hi! I've analyzed your document. Feel free to ask me any questions about the terms, risks, or anything else you'd like to understand better.",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } else {
        // If there's no summary but upload succeeded, show a friendly placeholder
        setSummary(response?.summary_preview ?? response?.summaryPreview ?? 'No summary available');
        setChatHistory([
          {
            id: Date.now(),
            sender: 'AdvocAI',
            message: "Document uploaded successfully. Ask a question to start the analysis.",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      // better extraction of error text
      const message = err?.response?.data?.error || err?.message || 'Failed to upload document';
      setError(message);
      setUploadedFile(null);
      setHighlightedPreview('');
      setPreviewText('');
      setHighRiskClauses([]);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        // reuse same handler shape
        handleFileUpload({ target: { files: dataTransfer.files } });
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !sessionId) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setLoading(true);

    const newUserMessage = {
      id: Date.now(),
      sender: 'User',
      message: userMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatHistory((prev) => [...prev, newUserMessage]);

    try {
      const response = await sendChatMessageApi(sessionId, userMessage);
      const aiText = response?.response ?? response?.message ?? response?.text ?? response?.data?.text ?? '';

      if (aiText) {
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'AdvocAI',
          message: aiText,
          timestamp: new Date().toLocaleTimeString(),
        };
        setChatHistory((prev) => [...prev, aiMessage]);
      }
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || err?.message || 'Failed to send message';
      setError(message);
      // remove the optimistic user message
      setChatHistory((prev) => prev.filter((m) => m.id !== newUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await getUserSessionsApi();
      const list = Array.isArray(response) ? response : response?.sessions ?? response?.data?.sessions ?? [];
      setSessions(list);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const openSession = async (session) => {
    if (!session) return;
    setSessionId(session.id ?? session._id ?? `session-${Date.now()}`);
    setSidebarOpen(false);
    setLoading(true);
    try {
      const data = await getChatHistoryApi(session.id ?? session._id ?? session.sessionId);
      const sessionInfo = data?.session ?? data ?? {};
      const messagesRaw = data?.messages ?? data?.messages_list ?? [];

      const messages = (messagesRaw || []).map((m, idx) => ({
        id: m.id ?? m._id ?? idx + 1,
        sender: (m.sender || m.role || '').toLowerCase() === 'user' ? 'User' : 'AdvocAI',
        message: m.text || m.message || '',
        timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString(),
      }));

      setChatHistory(messages);
      const sessionSummary = sessionInfo.summary ?? session.summary ?? session.summary_preview ?? '';
      setSummary(sessionSummary || '');

      // Load comprehensive summary if available
      const sessionComprehensiveSummary = sessionInfo.comprehensive_summary ?? session.comprehensive_summary ?? null;
      if (sessionComprehensiveSummary) {
        setComprehensiveSummary(sessionComprehensiveSummary);
      }

      const sessionPreviewHtml = sessionInfo.highlighted_preview ?? session.highlighted_preview ?? '';
      const sessionPreviewPlain = sessionInfo.preview_text ?? session.document_preview ?? session.document_text ?? '';
      const sessionRiskClauses = sessionInfo.high_risk_clauses ?? session.high_risk_clauses ?? [];

      setHighlightedPreview(sessionPreviewHtml || '');
      setPreviewText(sessionPreviewPlain || '');
      setHighRiskClauses(Array.isArray(sessionRiskClauses) ? sessionRiskClauses : []);
      setDocumentType(sessionInfo.document_type || session.document_type || '');
      setDocumentTypeConfidence(sessionInfo.document_type_confidence || session.document_type_confidence || null);

      // Update the sessions list with the newly loaded detailed summary
      setSessions(prevSessions =>
        prevSessions.map(s =>
          (s.id ?? s._id) === (session.id ?? session._id)
            ? {
              ...s,
              summary: sessionSummary,
              summary_preview: sessionSummary, // Ensure summary_preview is updated
              comprehensive_summary: sessionComprehensiveSummary,
              document_type: sessionInfo.document_type || session.document_type || '',
              document_type_confidence: sessionInfo.document_type_confidence || session.document_type_confidence || null,
            }
            : s
        )
      );
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.error || err?.message || 'Failed to load session';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  const hasAnalysis = Boolean(summary || highlightedPreview || highRiskClauses.length);



  // ... (inside render)

  {
    expandedSection === 'chat' && (
      <ExpandedModal
        section="chat"
        title="Ask Questions"
        onClose={() => setExpandedSection(null)}
      >
        <div className="flex flex-col h-full p-6 gap-4">
          {/* Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 min-h-0">
            {chatHistory.map((message) => (
              <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'User' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                {message.sender !== 'User' && (
                  <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className={`max-w-[75%]`}>
                  <div className={`rounded-2xl px-5 py-4 ${message.sender === 'User' ? 'bg-gradient-to-br from-primary to-secondary text-foreground shadow-lg shadow-primary/20' : 'bg-card/50 text-foreground border border-border/50'
                    }`}>
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{message.message}</p>
                  </div>
                </div>
                {message.sender === 'User' && (
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-foreground" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-card/50 border border-border/50 px-5 py-4 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-base text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border/50 pt-4 flex-shrink-0">
            <div className="flex gap-3">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your document..."
                disabled={!sessionId || loading}
                className="flex-1 px-5 py-4 bg-card/50 border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
              />
              <button
                onClick={handleSendMessage}
                disabled={!sessionId || !chatMessage.trim() || loading}
                className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-foreground rounded-xl font-medium hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-6 h-6" /><span>Send</span></>}
              </button>
            </div>
          </div>
        </div>
      </ExpandedModal>
    )
  }

  return (
    <div className="flex h-[calc(100vh-var(--navbar-height))] bg-background overflow-hidden">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div
          className="absolute bottom-1/4 -right-48 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2s', animationDuration: '4s' }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s', animationDuration: '5s' }}
        />
      </div>

      {/* Sidebar */}
      {/* Overlay for small screens when sidebar is open */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300"
        ></div>
      )}

      <div className={`
        fixed left-0 top-[var(--navbar-height)] z-[70] transform
        w-3/4 max-w-xs sm:w-64 lg:w-80
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:relative lg:top-0 lg:z-10 lg:flex-shrink-0
        bg-card border-r border-border/50
        flex flex-col h-full
      `}>
        {/* Only show content if sidebar is logically open or on large screens */}
        {(sidebarOpen || window.innerWidth >= 1024) && ( // Added window.innerWidth check for initial render
          <>
            <div className="p-6 border-b border-border/50 flex-shrink-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                    <History className="w-5 h-5 text-foreground" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">History</h2>
                </div>
                {/* Close button - always visible on mobile for better UX */}
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground">Previous sessions</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar"> {/* Removed fixed height */}
              {loadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <button
                      key={session.id ?? session._id}
                      onClick={() => openSession(session)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${sessionId === (session.id ?? session._id)
                        ? 'bg-gradient-to-br from-primary/20 to-secondary/20 border-primary/50 shadow-lg shadow-primary/20'
                        : 'bg-card/40 border-border/50 hover:bg-card/60 hover:border-border'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium line-clamp-2 mb-2">{session.summary_preview || session.title || 'Document Analysis'}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{formatDate(session.created_at || session.createdAt || session.date)}</span>
                            {Number(session.message_count || session.messages_count || 0) > 0 && (
                              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full">{session.message_count || session.messages_count}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-card/40 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <History className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">No previous sessions</p>
                  <p className="text-muted-foreground text-xs">Upload a document to start</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sidebar toggle button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 p-3 bg-gradient-to-r from-primary to-secondary text-foreground rounded-r-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-200 z-[5]"
        >
          <History className="w-5 h-5" />
        </button>
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : ''}`}>
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 h-full flex flex-col w-full overflow-y-auto custom-scrollbar">
          {/* Upload / Summary header */}
          {!hasAnalysis ? (
            <div className="mb-8">
              {/* Welcome Header */}
              <div className="mb-8 text-center animate-fade-in-up">
                <div className="inline-flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl border border-primary/30 shadow-lg shadow-primary/10">
                    <Sparkles className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold">
                    <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">AI Document Analyzer</span>
                  </h1>
                </div>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Get instant AI-powered insights, risk analysis, and Q&A for your legal documents
                </p>
              </div>

              {/* Upload Area */}
              <div
                className={`relative overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 ${dragActive
                  ? 'border-primary bg-gradient-to-br from-primary/20 to-secondary/10 scale-[1.02] shadow-2xl shadow-primary/30'
                  : uploadedFile
                    ? 'border-accent/50 bg-card/40'
                    : 'border-border/30 hover:border-primary/50 hover:bg-card/20'
                  }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current && fileInputRef.current.click()}
              >
                <input
                  id="file-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />

                <div className="p-6 sm:p-10 lg:p-12 text-center cursor-pointer">
                  {uploading ? (
                    <div className="space-y-4">
                      <div className="relative w-16 h-16 mx-auto">
                        <Loader2 className="w-16 h-16 text-primary animate-spin" />
                        <Sparkles className="w-6 h-6 text-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-foreground mb-1">Analyzing your document...</p>
                        <p className="text-sm text-muted-foreground">This may take a moment</p>
                      </div>
                    </div>
                  ) : uploadedFile ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-accent/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center border border-accent/30">
                        <FileText className="w-10 h-10 text-accent" />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-foreground mb-1">{uploadedFile.name}</p>
                        <p className="text-sm text-accent">✓ Ready for analysis</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary rounded-3xl opacity-30 blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-3xl opacity-20 blur-xl" />
                        <div className="relative p-5 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 rounded-3xl border-2 border-primary/40 shadow-lg shadow-primary/20">
                          <Upload className="w-14 h-14 text-primary drop-shadow-lg" />
                        </div>
                      </div>
                      <div>
                        <p className="text-xl font-semibold text-foreground mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">Drop your document here</p>
                        <p className="text-base text-muted-foreground mb-6">or click to browse your files</p>
                        <div className="flex items-center justify-center gap-3 text-sm">
                          <span className="text-muted-foreground font-medium">Supports:</span>
                          <span className="px-3 py-1.5 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 text-primary rounded-lg font-medium shadow-sm">PDF</span>
                          <span className="px-3 py-1.5 bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/30 text-accent rounded-lg font-medium shadow-sm">DOCX</span>
                          <span className="px-3 py-1.5 bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/30 text-secondary rounded-lg font-medium shadow-sm">TXT</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-6 p-4 bg-destructive/10 border-2 border-destructive/30 rounded-xl flex items-start gap-3 animate-fade-in">
                    <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-destructive text-sm font-medium">{error}</p>
                  </div>
                )}
              </div>

              {/* Feature highlights */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Bot className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">AI Analysis</h3>
                      <p className="text-sm text-muted-foreground">Instant document summarization with key insights</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/5 to-secondary/10 border border-secondary/20 hover:border-secondary/40 transition-all duration-300 hover:shadow-lg hover:shadow-secondary/10">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-secondary/20 rounded-lg">
                      <ShieldAlert className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Risk Detection</h3>
                      <p className="text-sm text-muted-foreground">Automatic identification of problematic clauses</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-accent/20 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">Interactive Q&A</h3>
                      <p className="text-sm text-muted-foreground">Ask questions and get instant answers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8 flex items-center justify-between">
              <div className="text-left">
                <h2 className="text-xl font-semibold text-foreground">Summary & Q&A</h2>
                <p className="text-sm text-muted-foreground">Your analysis is ready. Ask follow-up questions or start a new summary.</p>
              </div>
              <button
                onClick={resetForNewDocument}
                className="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-foreground rounded-xl font-medium hover:shadow-lg hover:shadow-primary/30 transition-all duration-200"
              >
                Summarize New Document
              </button>

            </div>
          )}

          {/* Analysis & Chat Grid */}
          {hasAnalysis && (
            <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
              {/* Left Column: Document Preview + Analysis */}
              <div className="lg:col-span-2 flex flex-col gap-6 flex-1 overflow-y-auto custom-scrollbar">
                {/* Document Preview */}
                <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 overflow-hidden">
                  <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                        <FileText className="w-5 h-5 text-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Document Preview</h3>
                        <p className="text-sm text-muted-foreground">Highlighted clauses mark elevated risk</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {highRiskClauses.length > 0 && (
                        <span className="text-xs font-medium text-destructive bg-destructive/20 px-3 py-1 rounded-full">
                          {highRiskClauses.length} flagged
                        </span>
                      )}
                      <button
                        onClick={() => setExpandedSection('preview')}
                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors group"
                        title="Expand preview"
                      >
                        <Maximize2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
                    {highlightedPreview ? (
                      <div
                        className="text-sm leading-relaxed text-muted-foreground space-y-3"
                        dangerouslySetInnerHTML={{ __html: highlightedPreview }}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {previewText || 'Preview not available for this document.'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Analysis Section */}
                <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                          <Bot className="w-5 h-5 text-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Analysis</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCopySummary}
                          disabled={!summary && !highRiskClauses.length}
                          className="px-3 py-1.5 bg-gradient-to-r from-primary to-secondary text-foreground rounded-lg font-medium hover:shadow-lg hover:shadow-primary/30 transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSummaryCopied ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setExpandedSection('analysis')}
                          className="p-2 hover:bg-primary/10 rounded-lg transition-colors group"
                          title="Expand analysis"
                        >
                          <Maximize2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">AI-generated insights</p>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar max-h-[500px]">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-foreground">Summary</h4>
                          <button
                            onClick={() => setShowDetailedSummary(!showDetailedSummary)}
                            disabled={!comprehensiveSummary}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary rounded-lg hover:from-primary/30 hover:to-secondary/30 transition-all duration-200 font-medium border border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {showDetailedSummary ? (
                              <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Quick View</span>
                              </>
                            ) : (
                              <>
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Detailed Analysis</span>
                              </>
                            )}
                          </button>
                        </div>

                        {!showDetailedSummary ? (
                          <div>
                            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {summary || 'No summary available.'}
                            </p>
                            {comprehensiveSummary ? (
                              <div className="mt-3 flex items-center gap-2 text-xs text-primary/70">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Click "Detailed Analysis" for comprehensive breakdown</span>
                              </div>
                            ) : comprehensiveSummaryLoading ? (
                              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground/60">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Generating detailed analysis...</span>
                              </div>
                            ) : null}
                          </div>
                        ) : comprehensiveSummary ? (
                          <div className="space-y-4 text-sm">
                            {/* Executive Summary */}
                            {comprehensiveSummary.executive_summary && (
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                  {comprehensiveSummary.executive_summary}
                                </p>
                              </div>
                            )}

                            {/* Parties */}
                            {comprehensiveSummary.parties && comprehensiveSummary.parties.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <Users className="w-4 h-4" />
                                  Parties Involved
                                </h5>
                                <div className="space-y-2">
                                  {comprehensiveSummary.parties.map((party, idx) => (
                                    <div key={idx} className="bg-card/50 border border-border/40 rounded-lg p-2">
                                      <div className="font-medium text-foreground">{party.name}</div>
                                      <div className="text-xs text-primary">{party.role}</div>
                                      {party.simple_explanation && (
                                        <div className="text-xs text-muted-foreground mt-1">{party.simple_explanation}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Purpose */}
                            {comprehensiveSummary.purpose && (
                              <div>
                                <h5 className="font-semibold text-foreground mb-2">Purpose</h5>
                                <p className="text-muted-foreground">{comprehensiveSummary.purpose}</p>
                              </div>
                            )}

                            {/* Key Obligations */}
                            {comprehensiveSummary.key_obligations && Object.keys(comprehensiveSummary.key_obligations).length > 0 && (
                              <div>
                                <h5 className="font-semibold text-foreground mb-2">Key Obligations</h5>
                                <div className="space-y-2">
                                  {Object.entries(comprehensiveSummary.key_obligations).map(([party, obligation], idx) => (
                                    <div key={idx} className="bg-card/50 border border-border/40 rounded-lg p-2">
                                      <div className="font-medium text-foreground text-xs">{party}</div>
                                      <div className="text-xs text-muted-foreground mt-1">{obligation}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Financial Terms */}
                            {comprehensiveSummary.financial_terms && comprehensiveSummary.financial_terms.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <DollarSign className="w-4 h-4" />
                                  Financial Terms
                                </h5>
                                <div className="space-y-2">
                                  {comprehensiveSummary.financial_terms.map((term, idx) => (
                                    <div key={idx} className="bg-card/50 border border-border/40 rounded-lg p-2">
                                      <div className="flex justify-between items-start">
                                        <div className="text-xs text-foreground">{term.item}</div>
                                        <div className="text-xs font-semibold text-primary">{term.amount}</div>
                                      </div>
                                      {term.simple_explanation && (
                                        <div className="text-xs text-muted-foreground mt-1">{term.simple_explanation}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Term & Termination */}
                            {comprehensiveSummary.term_and_termination && (
                              <div>
                                <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  Term & Termination
                                </h5>
                                <div className="bg-card/50 border border-border/40 rounded-lg p-2 space-y-1 text-xs">
                                  <div><span className="font-medium">Duration:</span> {comprehensiveSummary.term_and_termination.duration}</div>
                                  {comprehensiveSummary.term_and_termination.renewal_terms && (
                                    <div><span className="font-medium">Renewal:</span> {comprehensiveSummary.term_and_termination.renewal_terms}</div>
                                  )}
                                  {comprehensiveSummary.term_and_termination.termination_process && (
                                    <div><span className="font-medium">How to Exit:</span> {comprehensiveSummary.term_and_termination.termination_process}</div>
                                  )}
                                  {comprehensiveSummary.term_and_termination.notice_period && (
                                    <div><span className="font-medium">Notice:</span> {comprehensiveSummary.term_and_termination.notice_period}</div>
                                  )}
                                  {comprehensiveSummary.term_and_termination.simple_explanation && (
                                    <div className="text-muted-foreground mt-2 pt-2 border-t border-border/40">
                                      {comprehensiveSummary.term_and_termination.simple_explanation}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Important Deadlines */}
                            {comprehensiveSummary.important_deadlines && comprehensiveSummary.important_deadlines.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  Important Deadlines
                                </h5>
                                <ul className="space-y-1 text-xs text-muted-foreground">
                                  {comprehensiveSummary.important_deadlines.map((deadline, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-primary mt-0.5">•</span>
                                      <span>{deadline}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Legal Terms Explained */}
                            {comprehensiveSummary.legal_terms_explained && comprehensiveSummary.legal_terms_explained.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4" />
                                  Legal Terms in Plain English
                                </h5>
                                <div className="space-y-2">
                                  {comprehensiveSummary.legal_terms_explained.map((item, idx) => (
                                    <div key={idx} className="bg-secondary/10 border border-secondary/20 rounded-lg p-2">
                                      <div className="font-medium text-foreground text-xs">{item.term}</div>
                                      <div className="text-xs text-muted-foreground mt-1">{item.meaning}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Compliance Requirements */}
                            {comprehensiveSummary.compliance_requirements && comprehensiveSummary.compliance_requirements.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-foreground mb-2">Compliance Requirements</h5>
                                <ul className="space-y-1 text-xs text-muted-foreground">
                                  {comprehensiveSummary.compliance_requirements.map((req, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-primary mt-0.5">•</span>
                                      <span>{req}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Attachments */}
                            {comprehensiveSummary.attachments_mentioned && comprehensiveSummary.attachments_mentioned.length > 0 && (
                              <div>
                                <h5 className="font-semibold text-foreground mb-2">Attachments/Schedules</h5>
                                <ul className="space-y-1 text-xs text-muted-foreground">
                                  {comprehensiveSummary.attachments_mentioned.map((att, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-primary mt-0.5">•</span>
                                      <span>{att}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No detailed summary available.</p>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">High-Risk Clauses</h4>
                        {highRiskClauses.length ? (
                          <ul className="space-y-3">
                            {highRiskClauses.map((clause, idx) => {
                              const { score, level } = getRiskDisplay(clause);
                              const text = clause?.clause_text || clause?.clauseText || '';
                              const rationale = clause?.rationale || clause?.reason || '';
                              const mitigation = getMitigation(clause);
                              const replacement = getReplacementClause(clause);
                              return (
                                <li key={`risk-${idx}`} className="p-3 rounded-xl border border-border/40 bg-background/40">
                                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-secondary mb-1">
                                    <ShieldAlert className="w-4 h-4" />
                                    <span>Risk: {level}{score ? ` • ${score}/5` : ''}</span>
                                  </div>
                                  {text && (
                                    <p className="text-sm text-foreground leading-relaxed mb-1 whitespace-pre-wrap">{text}</p>
                                  )}
                                  {rationale && (
                                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{rationale}</p>
                                  )}
                                  {mitigation && (
                                    <div className="mt-2 flex items-start gap-2 text-xs bg-primary/10 border border-primary/30 rounded-lg p-2">
                                      <Lightbulb className="w-4 h-4 mt-0.5 text-primary" />
                                      <div className="text-muted-foreground whitespace-pre-wrap">
                                        <span className="font-semibold text-primary">Suggested Change:</span> {mitigation}
                                      </div>
                                    </div>
                                  )}
                                  {replacement && (
                                    <div className="mt-2 flex items-start gap-2 text-xs bg-card/50 border border-border/40 rounded-lg p-2">
                                      <FileText className="w-4 h-4 mt-0.5 text-secondary" />
                                      <div className="text-muted-foreground whitespace-pre-wrap">
                                        <span className="font-semibold text-foreground">Alternate Clause:</span> {replacement}
                                      </div>
                                    </div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            No high-risk clauses were flagged in the preview.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Questions/Chat Interface */}
              <div className="lg:col-span-1 flex flex-col flex-1 min-h-0">
                <div className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 overflow-hidden flex flex-col h-full min-h-0">
                  <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                          <MessageCircle className="w-5 h-5 text-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Ask Questions</h3>
                      </div>
                      <button
                        onClick={() => setExpandedSection('chat')}
                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors group"
                        title="Expand chat"
                      >
                        <Maximize2 className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">Chat with AI about your document</p>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6 pt-8 space-y-4 custom-scrollbar min-h-0">
                    {chatHistory.map((message) => (
                      <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'User' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                        {message.sender !== 'User' && (
                          <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className={`max-w-[80%]`}>
                          <div className={`rounded-2xl px-4 py-3 ${message.sender === 'User' ? 'bg-gradient-to-br from-primary to-secondary text-foreground shadow-lg shadow-primary/20' : 'bg-card/50 text-foreground border border-border/50'
                            }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                          </div>
                        </div>
                        {message.sender === 'User' && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-card/50 border border-border/50 px-4 py-3 rounded-2xl flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <div className="p-6 border-t border-border/50 bg-card/30 flex-shrink-0">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about your document..."
                        disabled={!sessionId || loading}
                        className="flex-1 px-4 py-3 bg-card/50 border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-w-0"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!sessionId || !chatMessage.trim() || loading}
                        className="px-4 py-3 bg-gradient-to-r from-primary to-secondary text-foreground rounded-xl font-medium hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 flex-shrink-0"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /><span className="hidden sm:inline">Send</span></>}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div >

      {/* Expanded Modals */}
      {
        expandedSection === 'preview' && (
          <ExpandedModal
            section="preview"
            title="Document Preview"
            onClose={() => setExpandedSection(null)}
          >
            {highlightedPreview ? (
              <div
                className="text-base leading-relaxed text-muted-foreground space-y-4"
                dangerouslySetInnerHTML={{ __html: highlightedPreview }}
              />
            ) : (
              <p className="text-base text-muted-foreground whitespace-pre-wrap">
                {previewText || 'Preview not available for this document.'}
              </p>
            )}
          </ExpandedModal>
        )
      }

      {
        expandedSection === 'analysis' && (
          <ExpandedModal
            section="analysis"
            title="Document Analysis"
            onClose={() => setExpandedSection(null)}
          >
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-foreground">Summary</h4>
                  <button
                    onClick={() => setShowDetailedSummary(!showDetailedSummary)}
                    disabled={!comprehensiveSummary}
                    className="flex items-center gap-2 text-sm px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 text-primary rounded-lg hover:from-primary/30 hover:to-secondary/30 transition-all duration-200 font-medium border border-primary/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {showDetailedSummary ? (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Quick View</span>
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4" />
                        <span>Detailed Analysis</span>
                      </>
                    )}
                  </button>
                </div>

                {!showDetailedSummary ? (
                  <div>
                    <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {summary || 'No summary available.'}
                    </p>
                    {comprehensiveSummary && (
                      <div className="mt-4 flex items-center gap-2 text-sm text-primary/70">
                        <BookOpen className="w-4 h-4" />
                        <span>Click "Detailed Analysis" for comprehensive breakdown</span>
                      </div>
                    )}
                  </div>
                ) : comprehensiveSummary ? (
                  <div className="space-y-5 text-base">
                    {/* Executive Summary */}
                    {comprehensiveSummary.executive_summary && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                          {comprehensiveSummary.executive_summary}
                        </p>
                      </div>
                    )}

                    {/* Parties */}
                    {comprehensiveSummary.parties && comprehensiveSummary.parties.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-base">
                          <Users className="w-5 h-5" />
                          Parties Involved
                        </h5>
                        <div className="space-y-3">
                          {comprehensiveSummary.parties.map((party, idx) => (
                            <div key={idx} className="bg-card/50 border border-border/40 rounded-lg p-3">
                              <div className="font-medium text-foreground text-base">{party.name}</div>
                              <div className="text-sm text-primary">{party.role}</div>
                              {party.simple_explanation && (
                                <div className="text-sm text-muted-foreground mt-2">{party.simple_explanation}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Purpose */}
                    {comprehensiveSummary.purpose && (
                      <div>
                        <h5 className="font-semibold text-foreground mb-2 text-base">Purpose</h5>
                        <p className="text-muted-foreground">{comprehensiveSummary.purpose}</p>
                      </div>
                    )}

                    {/* Key Obligations */}
                    {comprehensiveSummary.key_obligations && Object.keys(comprehensiveSummary.key_obligations).length > 0 && (
                      <div>
                        <h5 className="font-semibold text-foreground mb-3 text-base">Key Obligations</h5>
                        <div className="space-y-3">
                          {Object.entries(comprehensiveSummary.key_obligations).map(([party, obligation], idx) => (
                            <div key={idx} className="bg-card/50 border border-border/40 rounded-lg p-3">
                              <div className="font-medium text-foreground text-sm">{party}</div>
                              <div className="text-sm text-muted-foreground mt-2">{obligation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Financial Terms */}
                    {comprehensiveSummary.financial_terms && comprehensiveSummary.financial_terms.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-base">
                          <DollarSign className="w-5 h-5" />
                          Financial Terms
                        </h5>
                        <div className="space-y-3">
                          {comprehensiveSummary.financial_terms.map((term, idx) => (
                            <div key={idx} className="bg-card/50 border border-border/40 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div className="text-sm text-foreground">{term.item}</div>
                                <div className="text-sm font-semibold text-primary">{term.amount}</div>
                              </div>
                              {term.simple_explanation && (
                                <div className="text-sm text-muted-foreground mt-2">{term.simple_explanation}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Term & Termination */}
                    {comprehensiveSummary.term_and_termination && (
                      <div>
                        <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-base">
                          <Calendar className="w-5 h-5" />
                          Term & Termination
                        </h5>
                        <div className="bg-card/50 border border-border/40 rounded-lg p-3 space-y-2 text-sm">
                          <div><span className="font-medium">Duration:</span> {comprehensiveSummary.term_and_termination.duration}</div>
                          {comprehensiveSummary.term_and_termination.renewal_terms && (
                            <div><span className="font-medium">Renewal:</span> {comprehensiveSummary.term_and_termination.renewal_terms}</div>
                          )}
                          {comprehensiveSummary.term_and_termination.termination_process && (
                            <div><span className="font-medium">How to Exit:</span> {comprehensiveSummary.term_and_termination.termination_process}</div>
                          )}
                          {comprehensiveSummary.term_and_termination.notice_period && (
                            <div><span className="font-medium">Notice:</span> {comprehensiveSummary.term_and_termination.notice_period}</div>
                          )}
                          {comprehensiveSummary.term_and_termination.simple_explanation && (
                            <div className="text-muted-foreground mt-3 pt-3 border-t border-border/40">
                              {comprehensiveSummary.term_and_termination.simple_explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Important Deadlines */}
                    {comprehensiveSummary.important_deadlines && comprehensiveSummary.important_deadlines.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-base">
                          <Clock className="w-5 h-5" />
                          Important Deadlines
                        </h5>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {comprehensiveSummary.important_deadlines.map((deadline, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{deadline}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Legal Terms Explained */}
                    {comprehensiveSummary.legal_terms_explained && comprehensiveSummary.legal_terms_explained.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-foreground mb-3 flex items-center gap-2 text-base">
                          <BookOpen className="w-5 h-5" />
                          Legal Terms in Plain English
                        </h5>
                        <div className="space-y-3">
                          {comprehensiveSummary.legal_terms_explained.map((item, idx) => (
                            <div key={idx} className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
                              <div className="font-medium text-foreground text-sm">{item.term}</div>
                              <div className="text-sm text-muted-foreground mt-2">{item.meaning}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance Requirements */}
                    {comprehensiveSummary.compliance_requirements && comprehensiveSummary.compliance_requirements.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-foreground mb-3 text-base">Compliance Requirements</h5>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {comprehensiveSummary.compliance_requirements.map((req, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Attachments */}
                    {comprehensiveSummary.attachments_mentioned && comprehensiveSummary.attachments_mentioned.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-foreground mb-3 text-base">Attachments/Schedules</h5>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          {comprehensiveSummary.attachments_mentioned.map((att, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              <span>{att}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-base">No detailed summary available.</p>
                )}
              </div>

              <div>
                <h4 className="text-lg font-semibold text-foreground mb-3">High-Risk Clauses</h4>
                {highRiskClauses.length ? (
                  <ul className="space-y-4">
                    {highRiskClauses.map((clause, idx) => {
                      const { score, level } = getRiskDisplay(clause);
                      const text = clause?.clause_text || clause?.clauseText || '';
                      const rationale = clause?.rationale || clause?.reason || '';
                      const mitigation = getMitigation(clause);
                      const replacement = getReplacementClause(clause);
                      return (
                        <li key={`risk-${idx}`} className="p-4 rounded-xl border border-border/40 bg-background/40">
                          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-secondary mb-2">
                            <ShieldAlert className="w-5 h-5" />
                            <span>Risk: {level}{score ? ` • ${score}/5` : ''}</span>
                          </div>
                          {text && (
                            <p className="text-base text-foreground leading-relaxed mb-2 whitespace-pre-wrap">{text}</p>
                          )}
                          {rationale && (
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{rationale}</p>
                          )}
                          {mitigation && (
                            <div className="mt-3 flex items-start gap-2 text-sm bg-primary/10 border border-primary/30 rounded-lg p-3">
                              <Lightbulb className="w-5 h-5 mt-0.5 text-primary" />
                              <div className="text-muted-foreground whitespace-pre-wrap">
                                <span className="font-semibold text-primary">Suggested Change:</span> {mitigation}
                              </div>
                            </div>
                          )}
                          {replacement && (
                            <div className="mt-3 flex items-start gap-2 text-sm bg-card/50 border border-border/40 rounded-lg p-3">
                              <FileText className="w-5 h-5 mt-0.5 text-secondary" />
                              <div className="text-muted-foreground whitespace-pre-wrap">
                                <span className="font-semibold text-foreground">Alternate Clause:</span> {replacement}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-base text-muted-foreground leading-relaxed">
                    No high-risk clauses were flagged in the preview.
                  </p>
                )}
              </div>
            </div>
          </ExpandedModal>
        )
      }

      {
        expandedSection === 'chat' && (
          <ExpandedModal
            section="chat"
            title="Ask Questions"
            onClose={() => setExpandedSection(null)}
          >
            <div className="flex flex-col h-full p-6">
              {/* Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 custom-scrollbar mb-6 pr-2 min-h-0">
                {chatHistory.map((message) => (
                  <div key={message.id} className={`flex items-start gap-3 ${message.sender === 'User' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    {message.sender !== 'User' && (
                      <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center flex-shrink-0">
                        <Bot className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className={`max-w-[75%]`}>
                      <div className={`rounded-2xl px-5 py-4 ${message.sender === 'User' ? 'bg-gradient-to-br from-primary to-secondary text-foreground shadow-lg shadow-primary/20' : 'bg-card/50 text-foreground border border-border/50'
                        }`}>
                        <p className="text-base leading-relaxed whitespace-pre-wrap">{message.message}</p>
                      </div>
                    </div>
                    {message.sender === 'User' && (
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-card/50 border border-border/50 px-5 py-4 rounded-2xl flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-base text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border/50 pt-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything about your document..."
                    disabled={!sessionId || loading}
                    className="flex-1 px-5 py-4 bg-card/50 border border-border/50 rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!sessionId || !chatMessage.trim() || loading}
                    className="px-8 py-4 bg-gradient-to-r from-primary to-secondary text-foreground rounded-xl font-medium hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Send className="w-6 h-6" /><span>Send</span></>}
                  </button>
                </div>
              </div>
            </div>
          </ExpandedModal>
        )
      }
    </div >
  );
};

export default DocumentAnalyzer;
