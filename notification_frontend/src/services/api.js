// src/services/api.js
import axios from 'axios';

const BASE_URL = 'http://4.224.186.213/evaluation-service';
// Your validated security registration token from Stage 1
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhYmhpc2hla3IyNjEwMDJAZ21haWwuY29tIiwiZXhwIjoxNzgxMTYyNjY0LCJpYXQiOjE3ODExNjE3NjQsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiI0OWE5OWU3Zi1iZmJjLTRkNzctOTlhNy0xM2ViYWFiMTBlOWMiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJhYmhpc2hlayByYWpwdXQiLCJzdWIiOiI3NjQ1ZGQ2Ni05YjFlLTQyZTctOWM2YS00Y2I4NDFlMTNiZWYifSwiZW1haWwiOiJhYmhpc2hla3IyNjEwMDJAZ21haWwuY29tIiwibmFtZSI6ImFiaGlzaGVrIHJhanB1dCIsInJvbGxNoYSI6IjIzMDM0OTAxMDAwMDQiLCJhY2Nlc3NDb2RlIjoiQkFWRFNoIiwiY2xpZW50SUQiOiI3NjQ1ZGQ2Ni05YjFlLTQyZTctOWM2YS00Y2I4NDFlMTNiZWYiLCJjbGllbnRTZWNyZXQiOiJQdUt4WW5IYWVoS0hjcGJ0In0.cx-IRIpXj-7Y5hc-GMRAtEqtE5C_LSiOTfC1SpYUwd8';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Accept': 'application/json'
  }
});

/**
 * Robust fetch client mapping directly to the expanded query routes
 * @param {number} page Target pagination offset index
 * @param {number} limit Number of notification rows to request
 * @param {string} type Category filter ('Placement', 'Result', 'Event' or '')
 */
export const fetchNotifications = async (page = 1, limit = 10, type = '') => {
  try {
    const params = { page, limit };
    if (type) {
      params.notification_type = type;
    }
    
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  } catch (error) {
    console.error('API Pipeline Fetch Exception:', error.message);
    throw error;
  }
};