import { useCallback, useMemo } from 'react';

declare global {
  interface Window {
    OwnSkillAndroid?: {
      showToast(message: string): void;
      vibrate(durationMs: number): void;
      updateThemeColor(statusBarHex: string, navBarHex: string): void;
      exitApp(): void;
      openUrl?(url: string): void;
    };
  }
}

export function useAndroidBridge() {
  const showToast = useCallback((message: string) => {
    try {
      if (window.OwnSkillAndroid && typeof window.OwnSkillAndroid.showToast === 'function') {
        window.OwnSkillAndroid.showToast(message);
      } else {
        console.log('📱 Android Toast Mock:', message);
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-800 text-slate-100 text-xs px-4 py-2 rounded-full shadow-lg z-50 border border-slate-700 pointer-events-none opacity-0 transition-opacity duration-300';
        toast.innerText = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.classList.add('opacity-100'); }, 50);
        setTimeout(() => {
          toast.classList.remove('opacity-100');
          setTimeout(() => { toast.remove(); }, 300);
        }, 2500);
      }
    } catch (error) {
      console.warn('📱 Native Toast failed safely:', error);
    }
  }, []);

  const vibrate = useCallback((durationMs: number) => {
    try {
      if (window.OwnSkillAndroid && typeof window.OwnSkillAndroid.vibrate === 'function') {
        window.OwnSkillAndroid.vibrate(durationMs);
      } else if (navigator.vibrate) {
        navigator.vibrate(durationMs);
        console.log(`📱 Android Vibrate Mock: ${durationMs}ms`);
      } else {
        console.log(`📱 Android Vibrate Mock (unsupported): ${durationMs}ms`);
      }
    } catch (error) {
      console.warn('📱 Haptic vibration failed safely:', error);
    }
  }, []);

  const updateThemeColor = useCallback((statusBarHex: string, navBarHex: string) => {
    try {
      if (window.OwnSkillAndroid && typeof window.OwnSkillAndroid.updateThemeColor === 'function') {
        window.OwnSkillAndroid.updateThemeColor(statusBarHex, navBarHex);
      } else {
        console.log(`📱 Android Theme Colors: Status=${statusBarHex}, Nav=${navBarHex}`);
      }
    } catch (error) {
      console.warn('📱 Native Theme Color update failed safely:', error);
    }
  }, []);

  const exitApp = useCallback(() => {
    try {
      if (window.OwnSkillAndroid && typeof window.OwnSkillAndroid.exitApp === 'function') {
        window.OwnSkillAndroid.exitApp();
      } else {
        console.log('📱 Android Exit App triggered');
        alert('Exiting OwnSkill Hybrid Container');
      }
    } catch (error) {
      console.warn('📱 Native Exit App failed safely:', error);
    }
  }, []);

  const openUrl = useCallback((url: string) => {
    try {
      if (window.OwnSkillAndroid && typeof window.OwnSkillAndroid.openUrl === 'function') {
        window.OwnSkillAndroid.openUrl(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.warn('📱 Native openUrl failed safely:', error);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  return useMemo(() => ({
    showToast,
    vibrate,
    updateThemeColor,
    exitApp,
    openUrl,
  }), [showToast, vibrate, updateThemeColor, exitApp, openUrl]);
}
