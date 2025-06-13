import { useEffect } from "react";
import { useLocation } from "wouter";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export default function SEOMeta({ 
  title = "AI-Powered Waitlist Platform",
  description = "Join our exclusive waitlist for the next generation AI-powered platform. Get early access to revolutionary features and be part of the future.",
  image = "/og-image.png",
  url 
}: SEOProps) {
  const [location] = useLocation();

  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, property);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', 'AI, waitlist, platform, early access, technology, innovation');
    updateMetaTag('author', 'AI Platform Team');
    updateMetaTag('robots', 'index, follow');

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', `${window.location.origin}${image}`, true);
    updateMetaTag('og:url', url || `${window.location.origin}${location}`, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:site_name', 'AI Platform', true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', `${window.location.origin}${image}`);

    // Additional SEO tags
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    updateMetaTag('theme-color', '#3b82f6');
    updateMetaTag('apple-mobile-web-app-capable', 'yes');
    updateMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url || `${window.location.origin}${location}`);

  }, [title, description, image, url, location]);

  return null;
}