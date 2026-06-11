// src/services/api.js

const BASE_URL = 'http://4.224.186.213/evaluation-service';

// Freshly generated, active authorization token from your recent Postman login request
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiYXVkIjoiaHR0cDovLzIwLjI0NC41Ni4xNDQvZXZhbHVhdGlvbi1zZXJ2aWNlIiwiZW1haWwiOiJhYmhpc2hla3IyNjEwMDJAZ21haWwuY29tIiwiZXhwIjoxNzgxMTY4OTM0LCJpYXQiOjE3ODExNjgwMzQsImlzcyI6IkFmZm9yZCBNZWRpY2FsIFRlY2hub2xvZ2llcyBQcml2YXRlIExpbWl0ZWQiLCJqdGkiOiJiZjEwM2NmYi05ODQ0LTRmNTAtYjMzYy1hMWNjYTUxNWIyMGYiLCJsb2NhbGUiOiJlbi1JTiIsIm5hbWUiOiJhYmhpc2hlayByYWpwdXQiLCJzdWIiOiI3NjQ1ZGQ2Ni05YjFlLTQyZTctOWM2YS00Y2I4NDFlMTNiZWYifSwiZW1haWwiOiJhYmhpc2hla3IyNjEwMDJAZ21haWwuY29tIiwibmFtZSI6ImFiaGlzaGVrIHJhanB1dCIsInJvbGxNoYSI6IjIzMDM0OTAxMDAwMDQiLCJhY2Nlc3NDb2RlIjoiQkFWRFNoIiwiY2xpZW50SUQiOiI3NjQ1ZGQ2Ni05YjFlLTQyZTctOWM2YS00Y2I4NDFlMTNiZWYiLCJjbGllbnRTZWNyZXQiOiJQdUt4WW5IYWVoS0hjcGJ0In0.kVqZ6Ne3ZJPNPwYbwJuhWN4QFRy15ALchRB5gXr3StU';

export const fetchNotifications = async (page = 1, limit = 10, type = '') => {
  try {
    let url = `${BASE_URL}/notifications?page=${page}&limit=${limit}`;
    if (type) {
      url += `&notification_type=${type}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP Error Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Pipeline Fetch Exception:', error.message);
    throw error;
  }
};