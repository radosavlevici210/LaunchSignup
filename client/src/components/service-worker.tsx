import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function ServiceWorker() {
  const { toast } = useToast();

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast({
                    title: "App Updated",
                    description: "A new version is available. Refresh to update.",
                    duration: 10000,
                  });
                }
              });
            }
          });
        } catch (error) {
          console.log('Service worker registration failed:', error);
        }
      };

      registerSW();
    }
  }, [toast]);

  return null;
}