import React from 'react';
import { Box, Typography, Chip, useTheme } from '@mui/material';

export const TONE_OPTIONS = [
  { id: 'professional', label: 'Professional', emoji: '💼', desc: 'Formal, polished & executive' },
  { id: 'casual', label: 'Casual', emoji: '☕', desc: 'Relaxed, friendly & approachable' },
  { id: 'friendly', label: 'Friendly', emoji: '🤝', desc: 'Warm, empathetic & upbeat' },
  { id: 'concise', label: 'Concise', emoji: '⚡', desc: 'Direct, crisp & to the point' },
  { id: 'persuasive', label: 'Persuasive', emoji: '🎯', desc: 'Compelling with clear call to action' },
  { id: 'apologetic', label: 'Apologetic', emoji: '🙏', desc: 'Humble, constructive & solution-focused' },
];

export default function ToneSelector({ selectedTone, onSelectTone }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          Response Tone
        </Typography>
        <Typography variant="caption" sx={{ color: isDark ? '#94a3b8' : '#64748b' }}>
          {TONE_OPTIONS.find((t) => t.id === selectedTone)?.desc || 'Select a communication style'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {TONE_OPTIONS.map((tone) => {
          const isSelected = selectedTone === tone.id;
          return (
            <Chip
              key={tone.id}
              onClick={() => onSelectTone(isSelected ? '' : tone.id)}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <span>{tone.emoji}</span>
                  <span style={{ fontWeight: isSelected ? 700 : 500 }}>{tone.label}</span>
                </Box>
              }
              sx={{
                borderRadius: '10px',
                px: 0.5,
                py: 2,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                border: isSelected
                  ? '1.5px solid #6366f1'
                  : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
                backgroundColor: isSelected
                  ? isDark
                    ? 'rgba(99, 102, 241, 0.2)'
                    : 'rgba(99, 102, 241, 0.1)'
                  : isDark
                  ? 'rgba(30, 41, 59, 0.5)'
                  : 'rgba(248, 250, 252, 0.8)',
                color: isSelected
                  ? isDark
                    ? '#a5b4fc'
                    : '#4f46e5'
                  : isDark
                  ? '#cbd5e1'
                  : '#475569',
                boxShadow: isSelected ? '0 2px 8px rgba(99, 102, 241, 0.25)' : 'none',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  backgroundColor: isSelected
                    ? isDark
                      ? 'rgba(99, 102, 241, 0.25)'
                      : 'rgba(99, 102, 241, 0.15)'
                    : isDark
                    ? 'rgba(51, 65, 85, 0.5)'
                    : 'rgba(241, 245, 249, 1)'
                }
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}

