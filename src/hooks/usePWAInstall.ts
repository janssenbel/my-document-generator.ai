import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function generateDynamicAppleTouchIcon(_monogram = 'SEC'): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Full-bleed Pink background (#EC4899 -> #DB2777) with zero outer border
    const grad = ctx.createLinearGradient(0, 0, 180, 180);
    grad.addColorStop(0, '#EC4899');
    grad.addColorStop(1, '#DB2777');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 180, 180);

    // 1. Top Paper Feeder (White)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(54, 26, 72, 25, 6);
    ctx.fill();

    // 2. Main Printer Body (White)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(28, 56, 124, 64, 16);
    ctx.fill();

    // 3. Printer Status LED Dots (Pink)
    ctx.fillStyle = '#DB2777';
    ctx.beginPath();
    ctx.arc(130, 76, 5.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.arc(114, 76, 4, 0, Math.PI * 2);
    ctx.fill();

    // 4. Recessed Paper Output Slot (Pink)
    ctx.fillStyle = '#DB2777';
    ctx.beginPath();
    ctx.roundRect(48, 98, 84, 26, 6);
    ctx.fill();

    // 5. Bottom Printed Paper (White)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(54, 104, 72, 48, 6);
    ctx.fill();

    // 6. Printed Document Lines on Paper (Pink)
    ctx.fillStyle = '#EC4899';
    ctx.beginPath();
    ctx.roundRect(66, 118, 48, 5.5, 2.75);
    ctx.fill();

    ctx.beginPath();
    ctx.roundRect(66, 131, 34, 5.5, 2.75);
    ctx.fill();

    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

export function syncAppIdentityToDOM(appBrandName: string, appIconMonogram: string): string {
  if (typeof document === 'undefined') return '';
  const cleanTitle =
    (appBrandName || 'SEC Studio').replace(/^LexCorp\s*/i, '').trim() || 'SEC Studio';
  document.title = cleanTitle;

  const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (appleTitleMeta) {
    appleTitleMeta.setAttribute('content', cleanTitle.slice(0, 15));
  }

  const iconDataUrl = generateDynamicAppleTouchIcon(appIconMonogram || 'SEC');
  if (iconDataUrl) {
    const appleIconLink = document.getElementById(
      'dynamic-apple-touch-icon'
    ) as HTMLLinkElement | null;
    if (appleIconLink) {
      appleIconLink.href = iconDataUrl;
    }
  }
  return iconDataUrl;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}
