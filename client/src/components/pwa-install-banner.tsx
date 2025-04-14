import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Store the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) {
      toast({
        title: "Installation not supported",
        description: "Your browser doesn't support PWA installation or the app is already installed",
        variant: "destructive",
      });
      return;
    }

    // Show the install prompt
    installPrompt.prompt();

    // Wait for the user to respond to the prompt
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        toast({
          title: "Thank you!",
          description: "Qyuqa has been installed on your device",
        });
        setIsInstalled(true);
      }
      // Clear the prompt reference
      setInstallPrompt(null);
    });
  };

  if (isInstalled || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 p-4 bg-black text-white rounded-lg shadow-lg z-50 flex items-center justify-between">
      <div className="flex-1">
        <h3 className="font-bold">Install Qyuqa</h3>
        <p className="text-sm opacity-90">Add our app to your home screen for a better experience</p>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setInstallPrompt(null)}>
          Not now
        </Button>
        <Button onClick={handleInstallClick} className="bg-white text-black hover:bg-gray-200">
          <Download className="mr-2 h-4 w-4" /> Install
        </Button>
      </div>
    </div>
  );
}