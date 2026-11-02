import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress,
  Link,
  useTheme
} from '@mui/material';
import axios from 'axios';
import { SettingsIcon } from './Icons';

export default function SettingsModal({
  open,
  onClose,
  backendUrl,
  setBackendUrl,
  clientApiKey,
  setClientApiKey,
  onSettingsSaved
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [tempUrl, setTempUrl] = useState(backendUrl);
  const [tempKey, setTempKey] = useState(clientApiKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await axios.get(`${tempUrl}/api/email/health`, { timeout: 4000 });
      if (response.data && response.data.status === 'UP') {
        const hasServerKey = response.data.apiKeyConfigured;
        const hasClientKey = Boolean(tempKey && tempKey.trim());
        if (hasServerKey || hasClientKey) {
          setTestResult({
            success: true,
            message: `Connection successful! ${
              hasServerKey
                ? 'Backend has server-level GEMINI_KEY configured.'
                : 'Using custom client Gemini API key.'
            }`
          });
        } else {
          setTestResult({
            warning: true,
            message: 'Connected to backend, but no Gemini API key is configured either on server or client.'
          });
        }
      } else {
        setTestResult({
          error: true,
          message: 'Received unexpected response from backend.'
        });
      }
    } catch (err) {
      setTestResult({
        error: true,
        message: `Failed to connect to ${tempUrl}. Ensure Spring Boot is running on port 8080.`
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setBackendUrl(tempUrl);
    setClientApiKey(tempKey);
    localStorage.setItem('mailcraft_backend_url', tempUrl);
    localStorage.setItem('mailcraft_gemini_key', tempKey);
    onSettingsSaved();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          backgroundImage: 'none',
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
        }
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            backgroundColor: 'rgba(99, 102, 241, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366f1'
          }}
        >
          <SettingsIcon sx={{ fontSize: 20 }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Application Settings
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" sx={{ color: isDark ? '#94a3b8' : '#64748b', mb: 3 }}>
          Configure your backend API endpoint and optional client-side Gemini API key.
        </Typography>

        {/* Backend URL */}
        <TextField
          fullWidth
          label="Backend Service URL"
          variant="outlined"
          value={tempUrl}
          onChange={(e) => setTempUrl(e.target.value)}
          size="small"
          placeholder="http://localhost:8080"
          helperText="Default: http://localhost:8080"
          sx={{ mb: 3 }}
        />

        {/* Custom Gemini API Key */}
        <TextField
          fullWidth
          label="Custom Gemini API Key (Optional)"
          variant="outlined"
          type={showKey ? 'text' : 'password'}
          value={tempKey}
          onChange={(e) => setTempKey(e.target.value)}
          size="small"
          placeholder="AIzaSy..."
          helperText={
            <span>
              If not set on the server, you can supply your key here.{' '}
              <Link
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                sx={{ color: '#6366f1', fontWeight: 600 }}
              >
                Get a free key from Google AI Studio &rarr;
              </Link>
            </span>
          }
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button size="small" onClick={() => setShowKey(!showKey)} sx={{ minWidth: 'auto', px: 1 }}>
                  {showKey ? 'Hide' : 'Show'}
                </Button>
              </InputAdornment>
            )
          }}
          sx={{ mb: 2.5 }}
        />

        {/* Test Result Alert */}
        {testResult && (
          <Alert
            severity={testResult.success ? 'success' : testResult.warning ? 'warning' : 'error'}
            sx={{ mb: 2, borderRadius: '10px' }}
          >
            {testResult.message}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: 'space-between' }}>
        <Button
          onClick={handleTestConnection}
          disabled={testing}
          variant="outlined"
          size="medium"
          startIcon={testing ? <CircularProgress size={16} /> : null}
          sx={{ borderRadius: '10px' }}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose} variant="text" sx={{ borderRadius: '10px' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              fontWeight: 600
            }}
          >
            Save & Apply
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

