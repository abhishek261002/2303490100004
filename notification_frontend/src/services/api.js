// src/services/api.js

const BASE_URL = 'http://4.224.186.213/evaluation-service';

const AUTH_PAYLOAD = {
  email: "abhishekr261002@gmail.com",
  name: "abhishek rajput",
  rollNo: "2303490100004",
  accessCode: "BAVDSh",
  clientID: "7645dd66-9b1e-42e7-9c6a-4cb841e13bef",
  clientSecret: "PuKxYnHaehKHcpbt"
};

let cachedToken = "";

/**
 * Robust authentication dynamic handshaker
 */
export const getOrRefreshToken = async () => {
  if (cachedToken) return cachedToken;

  try {
    const response = await fetch(`${BASE_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(AUTH_PAYLOAD)
    });

    if (!response.ok) {
      throw new Error(`Auth Endpoint Rejected Payload: ${response.status}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    return cachedToken;
  } catch (err) {
    console.error("Critical Authentication Gateway Failure:", err.message);
    throw err;
  }
};

/**
 * Mandatory Pre-Test Setup Reusable Logging Middleware
 */
export const sendLog = async (stack, level, pckg, message) => {
  try {
    const token = await getOrRefreshToken();
    await fetch(`${BASE_URL}/logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stack, level, package: pckg, message })
    });
  } catch (err) {
    console.warn('Logging telemetry skipped:', err.message);
  }
};

/**
 * Main Notification Fetch Pipeline for Stage 7
 */
export const fetchNotifications = async (page = 1, limit = 10, type = '') => {
  try {
    // 1. Mandatory requirement: Emit frontend API lifecycle telemetry log
    await sendLog('frontend', 'info', 'api', `Requesting notification batch for page ${page}`);

    const token = await getOrRefreshToken();
    let url = `${BASE_URL}/notifications?page=${page}&limit=${limit}`;
    if (type) {
      url += `&notification_type=${type}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 401) cachedToken = ""; // Flush expired token on auth failure
      throw new Error(`Server returned response code: ${response.status}`);
    }

    const data = await response.json();
    
    // 2. Emit corresponding verification success log entry
    await sendLog('frontend', 'debug', 'api', `Successfully loaded ${data.notifications?.length || 0} items`);
    return data;
  } catch (error) {
    await sendLog('frontend', 'fatal', 'api', `Data Stream Exception: ${error.message}`);
    console.error('API Pipeline Fetch Exception:', error.message);
    throw error;
  }
};