import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { AccessTime, NotificationsActive } from '@mui/icons-material';

const typeColorMapping = {
  Placement: { bg: '#e8f0fe', text: '#1a73e8', border: '#1a73e8' },
  Result: { bg: '#fef7e0', text: '#b06000', border: '#f4b400' },
  Event: { bg: '#e6f4ea', text: '#137333', border: '#34a853' }
};

export default function NotificationCard({ notification, isRead, onMarkAsRead }) {
  const { ID, Type, Message, Timestamp } = notification;
  const design = typeColorMapping[Type] || { bg: '#f1f3f4', text: '#5f6368', border: '#9aa0a6' };

  return (
    <Card 
      onClick={() => onMarkAsRead(ID)}
      sx={{
        mb: '14px',
        cursor: 'pointer',
        borderLeft: `6px solid ${design.border}`,
        backgroundColor: isRead ? '#fafafa' : '#ffffff',
        opacity: isRead ? 0.75 : 1,
      }}
    >
      <CardContent sx={{ p: '16px', position: 'relative', '&:last-child': { pb: '16px' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1 }}>
          <Chip 
            label={Type} 
            size="small" 
            sx={{ 
              backgroundColor: design.bg, 
              color: design.text, 
              fontWeight: 700,
              fontSize: '0.75rem'
            }} 
          />
          
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <AccessTime sx={{ fontSize: '1rem', mr: '4px' }} />
            <Typography variant="caption">
              {Timestamp}
            </Typography>
          </Box>
        </Box>

        <Typography 
          variant="body1" 
          sx={{ 
            fontWeight: isRead ? 400 : 600,
            color: isRead ? '#5f6368' : '#202124',
            mt: '8px'
          }}
        >
          {Message}
        </Typography>

        {!isRead && (
          <Box 
            sx={{
              position: 'absolute', 
              top: '16px', 
              right: '16px', 
              display: 'flex', 
              alignItems: 'center',
              color: 'secondary.main'
            }}
          >
            <NotificationsActive sx={{ fontSize: '0.85rem', mr: '4px' }} />
            <Typography variant="caption" sx={{ fontWeight: 700 }}>NEW</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}