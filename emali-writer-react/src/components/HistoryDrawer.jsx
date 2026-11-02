import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Chip,
  Paper,
  Tooltip,
  useTheme
} from '@mui/material';
import { HistoryIcon, TrashIcon, CopyIcon, SparklesIcon } from './Icons';

export default function HistoryDrawer({
  open,
  onClose,
  history,
  onRestore,
  onDeleteOne,
  onClearAll,
  onCopyText
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          color: isDark ? '#f8fafc' : '#0f172a',
          p: 3
        }
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <HistoryIcon sx={{ color: '#6366f1', fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Recent Replies
          </Typography>
          <Chip label={history.length} size="small" sx={{ fontWeight: 700, height: 20 }} />
        </Box>
        {history.length > 0 && (
          <Tooltip title="Clear all history">
            <Button
              size="small"
              color="error"
              onClick={onClearAll}
              startIcon={<TrashIcon sx={{ fontSize: 16 }} />}
              sx={{ fontSize: '0.75rem', textTransform: 'none' }}
            >
              Clear All
            </Button>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ mb: 2, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' }} />

      {/* List */}
      {history.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
            color: isDark ? '#64748b' : '#94a3b8',
            textAlign: 'center'
          }}
        >
          <HistoryIcon sx={{ fontSize: 48, mb: 1.5, opacity: 0.4 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            No replies yet
          </Typography>
          <Typography variant="body2" sx={{ maxWidth: 240, mt: 0.5, fontSize: '0.8rem' }}>
            Generated replies are automatically saved here for quick reference and reuse.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {history.map((item) => (
            <Paper
              key={item.id}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '12px',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: '#6366f1',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.12)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {item.tone && (
                    <Chip
                      label={item.tone}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                        color: isDark ? '#a5b4fc' : '#4f46e5'
                      }}
                    />
                  )}
                  <Typography variant="caption" sx={{ color: isDark ? '#64748b' : '#94a3b8' }}>
                    {item.date}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => onDeleteOne(item.id)} sx={{ p: 0.5, color: '#ef4444' }}>
                  <TrashIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: isDark ? '#cbd5e1' : '#334155',
                  fontSize: '0.82rem',
                  mb: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  whiteSpace: 'pre-line'
                }}
              >
                {item.reply}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => onCopyText(item.reply)}
                  startIcon={<CopyIcon sx={{ fontSize: 14 }} />}
                  sx={{ fontSize: '0.72rem', borderRadius: '8px', textTransform: 'none' }}
                >
                  Copy
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => {
                    onRestore(item);
                    onClose();
                  }}
                  startIcon={<SparklesIcon sx={{ fontSize: 14 }} />}
                  sx={{
                    fontSize: '0.72rem',
                    borderRadius: '8px',
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  }}
                >
                  Load in Editor
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Drawer>
  );
}

