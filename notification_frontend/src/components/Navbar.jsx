import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { Assignment, Star } from '@mui/icons-material';

export default function Navbar() {
  const currentPath = useLocation().pathname;

  return (
    <AppBar position="sticky" color="default" elevation={1} style={{ backgroundColor: '#ffffff' }}>
      <Container maxWidth="md">
        <Toolbar disableGutters style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" color="primary" style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
            Campus Hub
          </Typography>
          
          <Box display="flex" gap={1}>
            <Button
              component={Link}
              to="/"
              startIcon={<Assignment />}
              variant={currentPath === '/' ? 'contained' : 'text'}
              color="primary"
            >
              All Alerts
            </Button>
            
            <Button
              component={Link}
              to="/priority"
              startIcon={<Star />}
              variant={currentPath === '/priority' ? 'contained' : 'text'}
              color="primary"
            >
              Priority Inbox
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}