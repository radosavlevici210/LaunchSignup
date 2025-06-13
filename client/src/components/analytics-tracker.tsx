import { useEffect } from "react";
import { useLocation } from "wouter";

interface AnalyticsEvent {
  event: string;
  page: string;
  timestamp: string;
  userAgent: string;
  referrer: string;
}

export default function AnalyticsTracker() {
  const [location] = useLocation();

  useEffect(() => {
    const trackPageView = () => {
      const analyticsData: AnalyticsEvent = {
        event: 'page_view',
        page: location,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer
      };

      // Store analytics locally for privacy compliance
      const existingData = localStorage.getItem('analytics_data');
      const analytics = existingData ? JSON.parse(existingData) : [];
      analytics.push(analyticsData);
      
      // Keep only last 100 events to avoid storage bloat
      if (analytics.length > 100) {
        analytics.splice(0, analytics.length - 100);
      }
      
      localStorage.setItem('analytics_data', JSON.stringify(analytics));

      // Send to analytics endpoint if available
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(analyticsData),
        }).catch(() => {
          // Silently fail - analytics should not break the app
        });
      }
    };

    trackPageView();
  }, [location]);

  // Track user interactions
  useEffect(() => {
    const trackInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.getAttribute('role') === 'button') {
        const interactionData = {
          event: 'interaction',
          element: target.tagName,
          text: target.textContent?.slice(0, 50) || '',
          page: location,
          timestamp: new Date().toISOString()
        };

        const existingData = localStorage.getItem('interaction_data');
        const interactions = existingData ? JSON.parse(existingData) : [];
        interactions.push(interactionData);
        
        if (interactions.length > 50) {
          interactions.splice(0, interactions.length - 50);
        }
        
        localStorage.setItem('interaction_data', JSON.stringify(interactions));
      }
    };

    document.addEventListener('click', trackInteraction);
    return () => document.removeEventListener('click', trackInteraction);
  }, [location]);

  return null;
}