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

    // Dark slate background (#0f172a -> #1e293b)
    const grad = ctx.createLinearGradient(0, 0, 180, 180);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 180, 180);

    // Subtle inner frame
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 156, 156);

    // Crisp White A4 Document sheet
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(44, 30, 88, 114, 8);
    ctx.fill();

    // Document Header Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(56, 44, 48, 7);

    // Document Text Lines
    ctx.fillStyle = '#64748b';
    ctx.fillRect(56, 60, 64, 4);
    ctx.fillRect(56, 70, 64, 4);
    ctx.fillRect(56, 80, 48, 4);

    // Table Divider
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(56, 94, 64, 2);

    // Total Row Bar
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(56, 102, 36, 5);

    // Gold SEC / Custom Monogram Badge at bottom right
    ctx.beginPath();
    ctx.arc(122, 128, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#f59e0b';
    ctx.stroke();

    // Monogram Text
    const cleanMono = (monogram || 'SEC').trim().slice(0, 4).toUpperCase();
    ctx.fillStyle = '#f8fafc';
    ctx.font = `bold ${cleanMono.length > 3 ? 11 : 13}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanMono, 122, 129);

    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
}

export function syncAppIdentityToDOM(appBrandName: string, appIconMonogram: string): string {
  if (typeof document === 'undefined') return '';
  const cleanTitle = (appBrandName || 'LexCorp SEC Studio').trim();
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
