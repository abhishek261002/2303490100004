// logging_middleware/logger.js

/**
 * Reusable Logging Package Utility Module
 * Relays operational application telemetry logs directly to the assessment logging server.
 * * @param {string} stack - "backend" | "frontend"
 * @param {string} level - "debug" | "info" | "warn" | "error" | "fatal"
 * @param {string} pckg - Component or service package descriptor 
 * @param {string} message - Context string containing execution details
 * @param {string} token - Live Authorization Bearer string
 */
export const logApplicationTelemetry = async (stack, level, pckg, message, token) => {
  if (!token) {
    console.warn("Telemetry engine stalled: Missing authorization parameter.");
    return;
  }
  
  try {
    await fetch('http://4.224.186.213/evaluation-service/logs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        stack,
        level,
        package: pckg,
        message
      })
    });
  } catch (err) {
    console.error("Core Logging Middleware execution error:", err.message);
  }
};