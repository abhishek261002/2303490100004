import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert } from '@mui/material';
import { fetchNotifications } from '../services/api';
import NotificationCard from '../components/NotificationCard';

const CATEGORY_WEIGHTS = { Placement: 3, Result: 2, Event: 1 };

export default function PriorityInboxPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [limitN, setLimitN] = useState(10); // Dynamic variable target parameter (n)
  const [viewedIds, setViewedIds] = useState([]);

  useEffect(() => {
    const cachedViewed = JSON.parse(localStorage.getItem('viewed_notifications') || '[]');
    setViewedIds(cachedViewed);

    const loadPriorityStream = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch a broad block to accurately run sorting metrics locally
        const data = await fetchNotifications(1, 50, '');
        const rawList = data.notifications || [];
        
        // Filter out read notifications to match the Priority Inbox requirement
        const unreadItems = rawList.filter(item => !cachedViewed.includes(item.ID));

        // Process priority mathematical index calculations
        const rankedItems = unreadItems.map(item => {
          const weight = CATEGORY_WEIGHTS[item.Type] || 1;
          const unixTime = new Date(item.Timestamp).getTime();
          const calculationRankScore = (weight * Math.pow(10, 12)) + unixTime;
          return { ...item, calculationRankScore };
        });

        // Run descending algorithmic sorting pass
        rankedItems.sort((a, b) => b.calculationRankScore - a.calculationRankScore);
        setNotifications(rankedItems);
      } catch (err) {
        setError('Failed to compute priority ranking matrices.');
      } finally {
        setLoading(false);
      }
    };
    loadPriorityStream();
  }, [viewedIds]);

  const handleMarkAsRead = (id) => {
    const updatedViewed = [...viewedIds, id];
    setViewedIds(updatedViewed);
    localStorage.setItem('viewed_notifications', JSON.stringify(updatedViewed));
  };

  return (
    <Container maxWidth="md" style={{ marginTop: '24px', paddingBottom: '40px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="text.primary">Priority Smart Inbox</Typography>
          <Typography variant="caption" color="text.secondary">
            Ranked by urgency: Placement &gt; Result &gt; Event blended with message recency.
          </Typography>
        </Box>
        
        <FormControl size="small" style={{ minWidth: 140 }}>
          <InputLabel>Display Count (n)</InputLabel>
          <Select
            value={limitN}
            label="Display Count (n)"
            onChange={(e) => setLimitN(e.target.value)}
          >
            <MenuItem value={10}>Top 10 Alerts</MenuItem>
            <MenuItem value={15}>Top 15 Alerts</MenuItem>
            <MenuItem value={20}>Top 20 Alerts</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" my={8}><CircularProgress /></Box>
      ) : notifications.length === 0 ? (
        <Typography color="text.secondary" align="center" my={4}>All high-priority notifications have been acknowledged!</Typography>
      ) : (
        <Box>
          {notifications.slice(0, limitN).map((item) => (
            <NotificationCard
              key={item.ID}
              notification={item}
              isRead={false}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
        </Box>
      )}
    </Container>
  );
}