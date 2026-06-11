import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, Pagination, Alert, CircularProgress } from '@mui/material';
import { fetchNotifications } from '../services/api';
import NotificationCard from '../components/NotificationCard';

export default function MainFeedPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [viewedIds, setViewedIds] = useState([]);

  useEffect(() => {
    const cachedViewed = JSON.parse(localStorage.getItem('viewed_notifications') || '[]');
    setViewedIds(cachedViewed);
  }, []);

  useEffect(() => {
    const loadTimelineData = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchNotifications(page, 10, filterType);
        setNotifications(data.notifications || []);
      } catch (err) {
        setError('Failed to establish connection stream with core data services.');
      } finally {
        setLoading(false);
      }
    };
    loadTimelineData();
  }, [page, filterType]);

  const handleMarkAsRead = (id) => {
    if (!viewedIds.includes(id)) {
      const updatedViewed = [...viewedIds, id];
      setViewedIds(updatedViewed);
      localStorage.setItem('viewed_notifications', JSON.stringify(updatedViewed));
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: '24px', pb: '40px' }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3, 
          flexWrap: 'wrap', 
          gap: 2 
        }}
      >
        <Typography variant="h4" color="text.primary">
          Campus Announcements
        </Typography>
        
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filter Category</InputLabel>
          <Select
            value={filterType}
            label="Filter Category"
            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          >
            <MenuItem value="">All Categories</MenuItem>
            <MenuItem value="Placement">Placements</MenuItem>
            <MenuItem value="Result">Results</MenuItem>
            <MenuItem value="Event">Events</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}><CircularProgress /></Box>
      ) : notifications.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ my: 4 }}>No notifications available matching this category.</Typography>
      ) : (
        <Box>
          {notifications.map((item) => (
            <NotificationCard
              key={item.ID}
              notification={item}
              isRead={viewedIds.includes(item.ID)}
              onMarkAsRead={handleMarkAsRead}
            />
          ))}
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={5}
              page={page}
              onChange={(e, val) => setPage(val)}
              color="primary"
            />
          </Box>
        </Box>
      )}
    </Container>
  );
}