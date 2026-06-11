import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { AccessTime, LabelImportant, NotificationsActive } from '@mui/icons-material';

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
      style={{
        marginBottom: '14px',
        cursor: 'pointer',
        borderLeft: `6px solid ${design.border}`,
        backgroundColor: isRead ? '#fafafa' : '#ffffff',
        opacity: isRead ? 0.75 : 1,
      }}
    >
      <CardContent style={{ padding: '16px', position: 'relative' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={1}>
          <Chip 
            label={Type} 
            size="small" 
            style={{ 
              backgroundColor: design.bg, 
              color: design.text, 
              fontWeight: 700,
              fontSize: '0.75rem'
            }} 
          />
          
          <Box display="flex" alignItems="center" color="text.secondary">
            <AccessTime style={{ fontSize: '1rem', marginRight: '4px' }} />
            <Typography variant="caption">
              {Timestamp}
            </Typography>
          </Box>
        </Box>

        <Typography 
          variant="body1" 
          style={{ 
            fontWeight: isRead ? 400 : 600,
            color: isRead ? '#5f6368' : '#202124',
            marginTop: '8px'
          }}
        >
          {Message}
        </Typography>

        {!isRead && (
          <Box 
            position="absolute" 
            top="16px" 
            right="16px" 
            display="flex" 
            alignItems="center"
            color="secondary.main"
          >
            <NotificationsActive style={{ fontSize: '0.85rem', marginRight: '4px' }} />
            <Typography variant="caption" style={{ fontWeight: 700 }}>NEW</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}