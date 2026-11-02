import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
  Tooltip,
  Alert,
  CircularProgress,
  Snackbar,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Collapse
} from '@mui/material';
import axios from 'axios';
import Navbar from './components/Navbar';
import ToneSelector, { TONE_OPTIONS } from './components/ToneSelector';
import SettingsModal from './components/SettingsModal';
import HistoryDrawer from './components/HistoryDrawer';
import {
  SparklesIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
  TrashIcon,
  EditIcon,
  SendIcon,
  ZapIcon,
  MailIcon
} from './components/Icons';

// Sample templates for instant testing
const SAMPLE_TEMPLATES = [
  {
    title: 'Meeting Reschedule',
    emoji: '📅',
    content: 'Hi Alex,\n\nAre you available to sync on the Q4 roadmap tomorrow at 2:00 PM EST?\nLet me know if that works for you.\n\nBest,\nSarah'
  },
  {
    title: 'Client Project Inquiry',
    emoji: '💼',
    content: 'Hello Team,\n\nWe saw your recent case study and would love to understand your availability and ballpark pricing for building an enterprise AI dashboard. Could you share estimated timelines and next steps?\n\nRegards,\nDavid Miller'
  },
  {
    title: 'Polite Decline',
    emoji: '🤝',
    content: 'Hi there,\n\nWe would love to invite you to be a guest speaker on our upcoming tech leadership webinar on Friday, Nov 14th at 10 AM PST. Please confirm your interest!\n\nThanks,\nEvents Team'
  },
  {
    title: 'Job Offer Follow-up',
    emoji: '🎉',
    content: 'Dear Candidate,\n\nThank you for completing the final round of interviews with our executive team. We were very impressed and would love to extend an offer for the Lead Software Engineer position. Please review the attached compensation terms.\n\nWarmly,\nTalent Acquisition'
  }
];

export default function App() {
  // Theme state
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('mailcraft_theme') || 'dark';
  });

  const toggleMode = () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setMode(nextMode);
    localStorage.setItem('mailcraft_theme', nextMode);
  };

  // Modern Theme Definition
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#6366f1',
            light: '#818cf8',
            dark: '#4f46e5'
          },
          secondary: {
            main: '#a855f7',
            light: '#c084fc',
            dark: '#9333ea'
          },
          background: {
            default: mode === 'dark' ? '#090d16' : '#f8fafc',
            paper: mode === 'dark' ? '#111827' : '#ffffff'
          },
          text: {
            primary: mode === 'dark' ? '#f8fafc' : '#0f172a',
            secondary: mode === 'dark' ? '#94a3b8' : '#64748b'
          }
        },
        typography: {
          fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        },
        shape: {
          borderRadius: 12
        }
      }),
    [mode]
  );

  const isDark = mode === 'dark';

  // Config & Connectivity state
  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem('mailcraft_backend_url') || 'http://localhost:8080';
  });

  const [clientApiKey, setClientApiKey] = useState(() => {
    return localStorage.getItem('mailcraft_gemini_key') || '';
  });

  const [backendStatus, setBackendStatus] = useState({
    isOnline: false,
    apiKeyConfigured: false
  });

  // Generator form state
  const [emailContent, setEmailContent] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('balanced');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Output & UI state
  const [generatedReply, setGeneratedReply] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Modals & Drawers
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('mailcraft_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Feedback Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const showToast = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // Check backend health
  const checkBackendHealth = useCallback(async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/email/health`, { timeout: 3000 });
      if (res.data && res.data.status === 'UP') {
        setBackendStatus({
          isOnline: true,
          apiKeyConfigured: Boolean(res.data.apiKeyConfigured || clientApiKey.trim())
        });
      } else {
        setBackendStatus({ isOnline: false, apiKeyConfigured: false });
      }
    } catch {
      setBackendStatus({ isOnline: false, apiKeyConfigured: false });
    }
  }, [backendUrl, clientApiKey]);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 25000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  // Save history helper
  const saveToHistory = (replyText, originalText, usedTone) => {
    const newItem = {
      id: Date.now().toString(),
      reply: replyText,
      original: originalText,
      tone: usedTone,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [newItem, ...history.slice(0, 19)];
    setHistory(updated);
    localStorage.setItem('mailcraft_history', JSON.stringify(updated));
  };

  // Generation handler
  const handleGenerate = async (overrideInstructions = '') => {
    if (!emailContent.trim()) {
      setError('Please provide or paste an email to generate a reply.');
      return;
    }

    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const instructionsToUse = overrideInstructions || additionalInstructions;
      const payload = {
        emailContent: emailContent.trim(),
        tone: tone || 'professional',
        length,
        additionalInstructions: instructionsToUse.trim() || undefined,
        apiKey: clientApiKey.trim() || undefined
      };

      const response = await axios.post(`${backendUrl}/api/email/generate`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      });

      const replyData = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      if (replyData.startsWith('Error:') || replyData.startsWith('Gemini API Error') || replyData.startsWith('Gemini Error')) {
        setError(replyData);
      } else {
        setGeneratedReply(replyData);
        setIsEditing(false);
        saveToHistory(replyData, emailContent, tone);
        showToast('Email reply generated successfully!');
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please check your backend connection.');
      } else if (!err.response) {
        setError(`Unable to connect to backend at ${backendUrl}. Ensure Spring Boot is running on port 8080.`);
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to generate email reply. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!loading && emailContent.trim()) {
        handleGenerate();
      }
    }
  };

  // Copy reply to clipboard
  const handleCopy = (textToCopy = generatedReply) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    showToast('Copied reply to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Word & Character count metrics
  const originalWords = useMemo(
    () => (emailContent.trim() ? emailContent.trim().split(/\s+/).length : 0),
    [emailContent]
  );
  const replyWords = useMemo(
    () => (generatedReply.trim() ? generatedReply.trim().split(/\s+/).length : 0),
    [generatedReply]
  );
  const estimatedReadTimeSec = useMemo(() => Math.max(1, Math.round((replyWords / 200) * 60)), [replyWords]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Top Navbar */}
        <Navbar
          mode={mode}
          toggleMode={toggleMode}
          backendStatus={backendStatus}
          onCheckBackend={checkBackendHealth}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
          historyCount={history.length}
        />

        {/* Missing API Key Banner Notification */}
        {backendStatus.isOnline && !backendStatus.apiKeyConfigured && (
          <Box
            sx={{
              background: 'linear-gradient(90deg, #f59e0b, #d97706)',
              color: '#ffffff',
              py: 1,
              px: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            <span>
              ⚠️ Gemini API Key is missing. Add your free Gemini API key to start generating replies.
            </span>
            <Button
              size="small"
              variant="contained"
              onClick={() => setSettingsOpen(true)}
              sx={{
                bgcolor: '#ffffff',
                color: '#b45309',
                fontWeight: 700,
                fontSize: '0.75rem',
                '&:hover': { bgcolor: '#fef3c7' }
              }}
            >
              Configure Key
            </Button>
          </Box>
        )}

        {/* Main Workspace */}
        <Container maxWidth="xl" sx={{ py: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header Hero */}
          <Box sx={{ mb: 3.5 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 800,
                letterSpacing: '-0.8px',
                mb: 0.5,
                background: isDark
                  ? 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)'
                  : 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Compose Context-Aware Email Replies
            </Typography>
            <Typography variant="body1" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
              Paste any incoming email, pick your tone and length, and generate professional, executive replies in seconds.
            </Typography>
          </Box>

          {/* Quick-Start Template Chips */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', mr: 0.5 }}>
              QUICK TEMPLATES:
            </Typography>
            {SAMPLE_TEMPLATES.map((tmpl) => (
              <Chip
                key={tmpl.title}
                onClick={() => {
                  setEmailContent(tmpl.content);
                  setError('');
                }}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <span>{tmpl.emoji}</span>
                    <span>{tmpl.title}</span>
                  </Box>
                }
                size="small"
                sx={{
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                    borderColor: '#6366f1'
                  }
                }}
              />
            ))}
          </Box>

          {/* Split Studio Grid Layout */}
          <Grid container spacing={3} sx={{ flex: 1 }}>
            {/* Left Column: Input Studio */}
            <Grid item xs={12} lg={6} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: '16px',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                  bgcolor: isDark ? 'rgba(17, 24, 39, 0.7)' : '#ffffff',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  boxShadow: isDark
                    ? '0 10px 30px rgba(0, 0, 0, 0.3)'
                    : '0 10px 30px rgba(99, 102, 241, 0.04)'
                }}
              >
                {/* Textarea Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MailIcon sx={{ color: '#6366f1', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Original Email Content
                    </Typography>
                  </Box>
                  {emailContent && (
                    <Tooltip title="Clear input">
                      <IconButton
                        size="small"
                        onClick={() => setEmailContent('')}
                        sx={{ color: isDark ? '#94a3b8' : '#64748b' }}
                      >
                        <TrashIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>

                {/* Email Content Textarea */}
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  variant="outlined"
                  placeholder="Paste the email you want to reply to here... (Press Ctrl + Enter to generate)"
                  value={emailContent}
                  onChange={(e) => {
                    setEmailContent(e.target.value);
                    if (error) setError('');
                  }}
                  onKeyDown={handleKeyDown}
                  sx={{
                    mb: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.6)',
                      fontSize: '0.92rem',
                      lineHeight: 1.6
                    }
                  }}
                />

                {/* Counter & Helper bar */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, px: 0.5 }}>
                  <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.75rem' }}>
                    Hint: Press <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }}>Ctrl</kbd> + <kbd style={{ padding: '2px 5px', borderRadius: '4px', background: isDark ? '#334155' : '#e2e8f0', color: isDark ? '#f8fafc' : '#0f172a' }}>Enter</kbd> to submit
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.75rem' }}>
                    {originalWords} words • {emailContent.length} chars
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

                {/* Tone Selector */}
                <ToneSelector selectedTone={tone} onSelectTone={setTone} />

                {/* Length Selector */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 1 }}>
                    Desired Reply Length
                  </Typography>
                  <ToggleButtonGroup
                    value={length}
                    exclusive
                    onChange={(_, val) => val && setLength(val)}
                    size="small"
                    fullWidth
                    sx={{
                      borderRadius: '10px',
                      '& .MuiToggleButton-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        py: 0.8,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                        color: isDark ? '#94a3b8' : '#64748b',
                        '&.Mui-selected': {
                          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.25)' : 'rgba(99, 102, 241, 0.15)',
                          color: isDark ? '#a5b4fc' : '#4f46e5',
                          fontWeight: 700
                        }
                      }
                    }}
                  >
                    <ToggleButton value="concise">Concise & Direct</ToggleButton>
                    <ToggleButton value="balanced">Balanced Standard</ToggleButton>
                    <ToggleButton value="detailed">Comprehensive</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Toggle Advanced Instructions */}
                <Box sx={{ mb: 2 }}>
                  <Button
                    size="small"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    sx={{ textTransform: 'none', fontSize: '0.78rem', p: 0, color: '#6366f1', fontWeight: 600 }}
                  >
                    {showAdvanced ? '− Hide Custom Instructions' : '+ Add Custom Instructions (Optional)'}
                  </Button>
                  <Collapse in={showAdvanced}>
                    <Box sx={{ mt: 1.5 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. 'Mention I will follow up by Thursday' or 'Include a link to our demo'"
                        value={additionalInstructions}
                        onChange={(e) => setAdditionalInstructions(e.target.value)}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            fontSize: '0.85rem'
                          }
                        }}
                      />
                    </Box>
                  </Collapse>
                </Box>

                {/* Error Banner */}
                {error && (
                  <Alert
                    severity="error"
                    action={
                      error.includes('Settings') || error.includes('API key') ? (
                        <Button
                          color="inherit"
                          size="small"
                          onClick={() => setSettingsOpen(true)}
                          sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                        >
                          Open Settings
                        </Button>
                      ) : null
                    }
                    sx={{ mb: 2.5, borderRadius: '10px' }}
                  >
                    {error}
                  </Alert>
                )}

                {/* Submit Action Button */}
                <Button
                  variant="contained"
                  fullWidth
                  disabled={loading || !emailContent.trim()}
                  onClick={() => handleGenerate()}
                  startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SparklesIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    py: 1.5,
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    textTransform: 'none',
                    letterSpacing: '0.2px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                    transition: 'all 0.2s',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                      boxShadow: '0 6px 20px rgba(99, 102, 241, 0.45)',
                      transform: 'translateY(-1px)'
                    },
                    '&:disabled': {
                      background: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'
                    }
                  }}
                >
                  {loading ? 'Synthesizing Reply...' : 'Generate AI Reply'}
                </Button>
              </Paper>
            </Grid>

            {/* Right Column: Generated Reply Studio */}
            <Grid item xs={12} lg={6} sx={{ display: 'flex', flexDirection: 'column' }}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: '16px',
                  border: `1px solid ${
                    generatedReply
                      ? '#6366f1'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.08)'
                  }`,
                  bgcolor: isDark ? 'rgba(17, 24, 39, 0.7)' : '#ffffff',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  boxShadow: generatedReply
                    ? isDark
                      ? '0 10px 30px rgba(99, 102, 241, 0.15)'
                      : '0 10px 30px rgba(99, 102, 241, 0.1)'
                    : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SparklesIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Generated Email Reply
                    </Typography>
                    {generatedReply && (
                      <Chip
                        label={tone}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                          color: isDark ? '#a5b4fc' : '#4f46e5'
                        }}
                      />
                    )}
                  </Box>

                  {/* Actions when reply is present */}
                  {generatedReply && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Tooltip title={isEditing ? 'Save & Lock Edit' : 'Edit Text In-Place'}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setIsEditing(!isEditing)}
                          startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            fontSize: '0.75rem',
                            borderRadius: '8px',
                            textTransform: 'none',
                            py: 0.4
                          }}
                        >
                          {isEditing ? 'Done' : 'Edit'}
                        </Button>
                      </Tooltip>

                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleCopy()}
                        startIcon={copied ? <CheckIcon sx={{ fontSize: 15 }} /> : <CopyIcon sx={{ fontSize: 15 }} />}
                        sx={{
                          fontSize: '0.75rem',
                          borderRadius: '8px',
                          textTransform: 'none',
                          py: 0.4,
                          bgcolor: copied ? '#10b981' : '#6366f1',
                          '&:hover': {
                            bgcolor: copied ? '#059669' : '#4f46e5'
                          }
                        }}
                      >
                        {copied ? 'Copied!' : 'Copy Reply'}
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Main Content Area */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {loading ? (
                    /* Loading State Animation */
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 10,
                        gap: 2
                      }}
                    >
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          animation: 'pulseGlow 2s infinite'
                        }}
                      >
                        <CircularProgress size={32} thickness={4} sx={{ color: '#6366f1' }} />
                      </Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Crafting your reply with Gemini...
                      </Typography>
                      <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        Matching {tone} tone and formatting structure
                      </Typography>
                    </Box>
                  ) : generatedReply ? (
                    /* Generated Reply Card */
                    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          multiline
                          rows={14}
                          value={generatedReply}
                          onChange={(e) => setGeneratedReply(e.target.value)}
                          sx={{
                            flex: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(248, 250, 252, 0.6)',
                              fontSize: '0.92rem',
                              lineHeight: 1.7
                            }
                          }}
                        />
                      ) : (
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.5,
                            borderRadius: '12px',
                            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                            bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc',
                            flex: 1,
                            overflowY: 'auto',
                            maxHeight: '440px'
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              whiteSpace: 'pre-line',
                              lineHeight: 1.75,
                              fontSize: '0.92rem',
                              color: isDark ? '#f1f5f9' : '#1e293b'
                            }}
                          >
                            {generatedReply}
                          </Typography>
                        </Paper>
                      )}

                      {/* Reply Stats & Quick Refine */}
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}` }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                            {replyWords} words • ~{estimatedReadTimeSec}s read
                          </Typography>
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleGenerate()}
                            startIcon={<RefreshIcon sx={{ fontSize: 14 }} />}
                            sx={{ fontSize: '0.75rem', textTransform: 'none', color: '#6366f1' }}
                          >
                            Regenerate
                          </Button>
                        </Box>

                        {/* Quick Refine Chips */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8' }}>
                            QUICK REFINE:
                          </Typography>
                          <Chip
                            label="⚡ Make Shorter"
                            size="small"
                            onClick={() => handleGenerate('Make the response shorter and more concise')}
                            sx={{ borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
                          />
                          <Chip
                            label="💼 More Formal"
                            size="small"
                            onClick={() => handleGenerate('Make the tone more formal and corporate')}
                            sx={{ borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
                          />
                          <Chip
                            label="🙏 Add Gratitude"
                            size="small"
                            onClick={() => handleGenerate('Express sincere appreciation and gratitude')}
                            sx={{ borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
                          />
                          <Chip
                            label="📞 Request Call"
                            size="small"
                            onClick={() => handleGenerate('Propose a 15-minute sync or video call')}
                            sx={{ borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer' }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  ) : (
                    /* Empty Placeholder State */
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8,
                        textAlign: 'center',
                        color: isDark ? '#64748b' : '#94a3b8'
                      }}
                    >
                      <Box
                        sx={{
                          width: 68,
                          height: 68,
                          borderRadius: '20px',
                          backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6366f1',
                          mb: 2.5
                        }}
                      >
                        <SparklesIcon sx={{ fontSize: 32 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a', mb: 1 }}>
                        Ready to Draft Your Reply
                      </Typography>
                      <Typography variant="body2" sx={{ maxWidth: 360, mb: 3, fontSize: '0.85rem' }}>
                        Paste any received email on the left and click <strong>Generate AI Reply</strong>. Your polished reply will appear here ready to copy or edit.
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          gap: 1.5,
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          maxWidth: 420
                        }}
                      >
                        <Chip
                          icon={<ZapIcon sx={{ fontSize: 14 }} />}
                          label="Instant 1-Click Copy"
                          size="small"
                          sx={{ fontSize: '0.72rem' }}
                        />
                        <Chip
                          icon={<EditIcon sx={{ fontSize: 14 }} />}
                          label="Inline Editing"
                          size="small"
                          sx={{ fontSize: '0.72rem' }}
                        />
                        <Chip
                          icon={<SendIcon sx={{ fontSize: 14 }} />}
                          label="Chrome Extension Sync"
                          size="small"
                          sx={{ fontSize: '0.72rem' }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 2.5,
            px: 4,
            borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2,
            fontSize: '0.78rem',
            color: isDark ? '#64748b' : '#94a3b8'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span>MailCraft AI</span>
            <span>•</span>
            <span>Spring Boot + React 19 + Google Gemini</span>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ cursor: 'pointer' }} onClick={() => setSettingsOpen(true)}>
              Settings
            </span>
            <span style={{ cursor: 'pointer' }} onClick={() => setHistoryOpen(true)}>
              History ({history.length})
            </span>
          </Box>
        </Box>

        {/* Settings Dialog Modal */}
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          backendUrl={backendUrl}
          setBackendUrl={setBackendUrl}
          clientApiKey={clientApiKey}
          setClientApiKey={setClientApiKey}
          onSettingsSaved={() => {
            checkBackendHealth();
            showToast('Settings saved successfully!');
          }}
        />

        {/* History Drawer */}
        <HistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          history={history}
          onRestore={(item) => {
            setEmailContent(item.original || '');
            setGeneratedReply(item.reply);
            setTone(item.tone || 'professional');
            showToast('Draft loaded into editor!');
          }}
          onDeleteOne={(id) => {
            const updated = history.filter((h) => h.id !== id);
            setHistory(updated);
            localStorage.setItem('mailcraft_history', JSON.stringify(updated));
          }}
          onClearAll={() => {
            setHistory([]);
            localStorage.removeItem('mailcraft_history');
            showToast('History cleared.');
          }}
          onCopyText={(text) => handleCopy(text)}
        />

        {/* Global Snackbar Toast */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ borderRadius: '10px', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  );
}
