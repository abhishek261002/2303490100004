import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, FormControl, InputLabel, Select, MenuItem, Pagination, Alert, CircularProgress } from '@mui/material';
import { fetchNotifications } from '../services/api';
import NotificationCard from '../components/NotificationCard';

export default function MainFeedPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Parameter State Flags mapped precisely to API specs
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('');
  const [viewedIds, setViewedIds] = useState([]);

  // Load viewed records tracking list from storage cache
  useEffect(() => {
    const cachedViewed = JSON.parse(localStorage.getItem('viewed_notifications') || '[]');
    setViewedIds(cachedViewed);
  }, []);

  useEffect(() => {
    const loadTimelineData = async () => {
      setLoading(true);
      setError('');
      try {
        // Enforcing standard limit slice size of 10 for streamlined views
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
    <Container maxWidth="md" style={{ marginTop: '24px', paddingBottom: '40px' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4" color="text.primary">
          Campus Announcements
        </Typography>
        
        <FormControl size="small" style={{ minWidth: 160 }}>
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
        <Box display="flex" justifyContent="center" my={8}><CircularProgress /></Box>
      ) : notifications.length === 0 ? (
        <Typography color="text.secondary" align="center" my={4}>No notifications available matching this category.</Typography>
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
          
          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={5} // Setting baseline standard pages count block for the mockup stream bounds
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