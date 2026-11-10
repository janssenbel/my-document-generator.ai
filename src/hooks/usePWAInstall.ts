import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function generateDynamicAppleTouchIcon(monogram = 'SEC'): string {
  if (typeof document === 'undefined') return '';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Full-bleed SEC Philippines Royal Navy background (#0B2545 -> #133E7C) with zero border
    const grad = ctx.createLinearGradient(0, 0, 180, 180);
    grad.addColorStop(0, '#0B2545');
    grad.addColorStop(1, '#133E7C');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 180, 180);

    // Crisp White A4 Document sheet
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(42, 28, 92, 118, 9);
    ctx.fill();

    // SEC Navy & Gold Document Header Bar
    ctx.fillStyle = '#0B2545';
    ctx.fillRect(54, 42, 54, 6);
    ctx.fillStyle = '#C59B27';
    ctx.fillRect(54, 50, 68, 2.5);

    // Document Text Lines
    ctx.fillStyle = '#64748b';
    ctx.fillRect(54, 60, 68, 4);
    ctx.fillRect(54, 70, 68, 4);
    ctx.fillRect(54, 80, 50, 4);

    // Table Divider
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(54, 95, 68, 2);

    // Total Row Bar
    ctx.fillStyle = '#0B2545';
    ctx.fillRect(54, 104, 38, 5);

    // Official SEC Seal Gold Badge at bottom right (borderless)
    ctx.beginPath();
    ctx.arc(124, 130, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#C59B27';
    ctx.fill();

    // Monogram Text
    const cleanMono = (monogram || 'SEC').trim().slice(0, 4).toUpperCase();
    ctx.fillStyle = '#0B2545';
    ctx.font = `bold ${cleanMono.length > 3 ? 11 : 13}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanMono, 124, 131);

    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

export function syncAppIdentityToDOM(appBrandName: string, appIconMonogram: string): string {
  if (typeof document === 'undefined') return '';
  const cleanTitle = (appBrandName || 'SEC Studio').replace(/^LexCorp\s*/i, '').trim() || 'SEC Studio';
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
