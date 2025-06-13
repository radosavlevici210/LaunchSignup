import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Clock, Globe } from "lucide-react";

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  connectionType: string;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const measurePerformance = () => {
      if ('performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const paint = performance.getEntriesByType('paint');
        
        const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
        const connection = (navigator as any).connection;
        
        const performanceData: PerformanceMetrics = {
          loadTime: Math.round(navigation.loadEventEnd - navigation.fetchStart),
          firstContentfulPaint: fcp ? Math.round(fcp.startTime) : 0,
          largestContentfulPaint: 0,
          cumulativeLayoutShift: 0,
          connectionType: connection ? connection.effectiveType || 'unknown' : 'unknown'
        };

        // Web Vitals observer for LCP and CLS
        if ('PerformanceObserver' in window) {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'largest-contentful-paint') {
                performanceData.largestContentfulPaint = Math.round(entry.startTime);
              }
              if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
                performanceData.cumulativeLayoutShift += (entry as any).value;
              }
            }
            setMetrics({ ...performanceData });
          });

          observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
        }

        setMetrics(performanceData);
      }
    };

    // Only measure in development or when specifically enabled
    if (process.env.NODE_ENV === 'development' || 
        localStorage.getItem('show_performance') === 'true') {
      setIsVisible(true);
      measurePerformance();
    }
  }, []);

  if (!isVisible || !metrics) return null;

  const getScoreColor = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return "bg-green-500";
    if (value <= thresholds[1]) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Load Time
          </span>
          <Badge 
            className={`text-xs ${getScoreColor(metrics.loadTime, [1000, 3000])}`}
          >
            {metrics.loadTime}ms
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs flex items-center gap-1">
            <Zap className="h-3 w-3" />
            FCP
          </span>
          <Badge 
            className={`text-xs ${getScoreColor(metrics.firstContentfulPaint, [1800, 3000])}`}
          >
            {metrics.firstContentfulPaint}ms
          </Badge>
        </div>

        {metrics.largestContentfulPaint > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-xs">LCP</span>
            <Badge 
              className={`text-xs ${getScoreColor(metrics.largestContentfulPaint, [2500, 4000])}`}
            >
              {metrics.largestContentfulPaint}ms
            </Badge>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs flex items-center gap-1">
            <Globe className="h-3 w-3" />
            Connection
          </span>
          <Badge variant="outline" className="text-xs">
            {metrics.connectionType}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}