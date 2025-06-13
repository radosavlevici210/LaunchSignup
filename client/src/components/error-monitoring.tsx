import { useEffect } from "react";

interface ErrorDetails {
  message: string;
  stack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
}

export default function ErrorMonitoring() {
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const errorDetails: ErrorDetails = {
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      logError(errorDetails);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorDetails: ErrorDetails = {
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };

      logError(errorDetails);
    };

    const logError = (errorDetails: ErrorDetails) => {
      // Store errors locally
      const existingErrors = localStorage.getItem('error_logs');
      const errorLogs = existingErrors ? JSON.parse(existingErrors) : [];
      errorLogs.push(errorDetails);

      // Keep only last 50 errors
      if (errorLogs.length > 50) {
        errorLogs.splice(0, errorLogs.length - 50);
      }

      localStorage.setItem('error_logs', JSON.stringify(errorLogs));

      // Send to monitoring endpoint in production
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorDetails),
        }).catch(() => {
          // Silently fail to prevent error loops
        });
      }

      console.error('Logged error:', errorDetails);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null;
}