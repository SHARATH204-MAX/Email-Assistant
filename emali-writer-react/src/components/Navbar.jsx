import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Chip,
  Badge,
  useTheme
} from '@mui/material';
import {
  SparklesIcon,
  SunIcon,
  MoonIcon,
  SettingsIcon,
  HistoryIcon,
  RefreshIcon
} from './Icons';

export default function Navbar({
  mode,
  toggleMode,
  backendStatus,
  onCheckBackend,
  onOpenSettings,
  onOpenHistory,
  historyCount = 0
}) {
  const theme = useTheme();
  const isDark = mode === 'dark';

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        color: isDark ? '#f8fafc' : '#0f172a',
        zIndex: theme.zIndex.drawer + 1
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
        {/* Brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
              color: '#ffffff'
            }}
          >
            <SparklesIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '-0.5px',
                  background: isDark
                    ? 'linear-gradient(90deg, #ffffff 0%, #c7d2fe 100%)'
                    : 'linear-gradient(90deg, #1e1b4b 0%, #4338ca 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2
                }}
              >
                MailCraft AI
              </Typography>
              <Chip
                label="PRO"
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  borderRadius: '6px'
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem' }}>
              Enterprise Email Reply Studio
            </Typography>
          </Box>
        </Box>

        {/* Right Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          {/* Backend Status Pill */}
          <Tooltip
            title={
              backendStatus.isOnline
                ? backendStatus.apiKeyConfigured
                  ? 'Backend online with Gemini API key active'
                  : 'Backend connected, but Gemini API Key is missing. Click to configure in Settings.'
                : 'Backend unreachable on port 8080. Click to retry connection.'
            }
            arrow
          >
            <Chip
              onClick={backendStatus.isOnline && !backendStatus.apiKeyConfigured ? onOpenSettings : onCheckBackend}
              size="small"
              icon={
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    ml: 1,
                    backgroundColor: !backendStatus.isOnline
                      ? '#ef4444'
                      : !backendStatus.apiKeyConfigured
                      ? '#f59e0b'
                      : '#10b981',
                    boxShadow: !backendStatus.isOnline
                      ? '0 0 8px #ef4444'
                      : !backendStatus.apiKeyConfigured
                      ? '0 0 8px #f59e0b'
                      : '0 0 8px #10b981'
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>
                    {!backendStatus.isOnline
                      ? 'Offline'
                      : !backendStatus.apiKeyConfigured
                      ? 'Needs Key'
                      : 'Connected'}
                  </span>
                  {!backendStatus.isOnline && <RefreshIcon sx={{ fontSize: 13, ml: 0.2 }} />}
                </Box>
              }
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                border: `1px solid ${
                  !backendStatus.isOnline
                    ? 'rgba(239, 68, 68, 0.3)'
                    : !backendStatus.apiKeyConfigured
                    ? 'rgba(245, 158, 11, 0.3)'
                    : 'rgba(16, 185, 129, 0.3)'
                }`,
                backgroundColor: isDark
                  ? !backendStatus.isOnline
                    ? 'rgba(239, 68, 68, 0.12)'
                    : !backendStatus.apiKeyConfigured
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(16, 185, 129, 0.12)'
                  : !backendStatus.isOnline
                  ? 'rgba(239, 68, 68, 0.08)'
                  : !backendStatus.apiKeyConfigured
                  ? 'rgba(245, 158, 11, 0.08)'
                  : 'rgba(16, 185, 129, 0.08)',
                color: !backendStatus.isOnline
                  ? '#ef4444'
                  : !backendStatus.apiKeyConfigured
                  ? '#d97706'
                  : '#059669'
              }}
            />
          </Tooltip>

          {/* History Drawer Button */}
          <Tooltip title="Generation History" arrow>
            <IconButton
              onClick={onOpenHistory}
              size="small"
              sx={{
                p: 1,
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '10px'
              }}
            >
              <Badge badgeContent={historyCount} color="primary" max={99}>
                <HistoryIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Settings Button */}
          <Tooltip title="Settings & API Key" arrow>
            <IconButton
              onClick={onOpenSettings}
              size="small"
              sx={{
                p: 1,
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '10px'
              }}
            >
              <SettingsIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          {/* Theme Toggle Button */}
          <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'} arrow>
            <IconButton
              onClick={toggleMode}
              size="small"
              sx={{
                p: 1,
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '10px',
                color: isDark ? '#fbbf24' : '#6366f1'
              }}
            >
              {isDark ? <SunIcon sx={{ fontSize: 20 }} /> : <MoonIcon sx={{ fontSize: 20 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

