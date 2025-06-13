import { useEffect } from "react";

export default function SecurityHeaders() {
  useEffect(() => {
    // Add security-related meta tags if not already present
    const addMetaTag = (name: string, content: string) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // Content Security Policy
    addMetaTag('Content-Security-Policy', 
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' wss: https:;"
    );

    // Referrer Policy
    addMetaTag('referrer', 'strict-origin-when-cross-origin');

    // Permissions Policy
    addMetaTag('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    // X-Content-Type-Options
    addMetaTag('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options
    addMetaTag('X-Frame-Options', 'DENY');

    // X-XSS-Protection
    addMetaTag('X-XSS-Protection', '1; mode=block');
  }, []);

  return null;
}