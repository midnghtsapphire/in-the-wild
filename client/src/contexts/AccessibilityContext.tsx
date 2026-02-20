/**
 * InTheWild — Universal Accessibility Modes
 * WCAG AAA, ADHD/Neurodivergent, Dyslexic, ECO CODE, NEURO CODE
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AccessibilityMode = 'default' | 'wcag-aaa' | 'adhd' | 'dyslexic' | 'eco' | 'neuro';

interface AccessibilitySettings {
  mode: AccessibilityMode;
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  focusIndicators: boolean;
  dyslexicFont: boolean;
  simplifiedLayout: boolean;
  ecoMode: boolean;
  neuroMode: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setMode: (mode: AccessibilityMode) => void;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleReducedMotion: () => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  mode: 'default',
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  focusIndicators: true,
  dyslexicFont: false,
  simplifiedLayout: false,
  ecoMode: false,
  neuroMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('inthewild_accessibility');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('inthewild_accessibility', JSON.stringify(settings));
    applyAccessibilitySettings(settings);
  }, [settings]);

  const setMode = (mode: AccessibilityMode) => {
    let newSettings = { ...settings, mode };

    switch (mode) {
      case 'wcag-aaa':
        newSettings = {
          ...newSettings,
          highContrast: true,
          focusIndicators: true,
          reducedMotion: true,
          largeText: false,
          dyslexicFont: false,
          simplifiedLayout: false,
          ecoMode: false,
          neuroMode: false,
        };
        break;
      case 'adhd':
      case 'neuro':
        newSettings = {
          ...newSettings,
          reducedMotion: true,
          simplifiedLayout: true,
          focusIndicators: true,
          neuroMode: true,
          highContrast: false,
          largeText: false,
          dyslexicFont: false,
          ecoMode: false,
        };
        break;
      case 'dyslexic':
        newSettings = {
          ...newSettings,
          dyslexicFont: true,
          largeText: true,
          simplifiedLayout: true,
          highContrast: false,
          reducedMotion: false,
          focusIndicators: true,
          ecoMode: false,
          neuroMode: false,
        };
        break;
      case 'eco':
        newSettings = {
          ...newSettings,
          ecoMode: true,
          reducedMotion: true,
          simplifiedLayout: true,
          highContrast: false,
          largeText: false,
          dyslexicFont: false,
          neuroMode: false,
          focusIndicators: true,
        };
        break;
      default:
        newSettings = { ...defaultSettings, mode: 'default' };
    }

    setSettings(newSettings);
  };

  const toggleHighContrast = () => {
    setSettings((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const toggleLargeText = () => {
    setSettings((prev) => ({ ...prev, largeText: !prev.largeText }));
  };

  const toggleReducedMotion = () => {
    setSettings((prev) => ({ ...prev, reducedMotion: !prev.reducedMotion }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        setMode,
        toggleHighContrast,
        toggleLargeText,
        toggleReducedMotion,
        resetSettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

function applyAccessibilitySettings(settings: AccessibilitySettings) {
  const root = document.documentElement;

  // Remove all accessibility classes
  root.classList.remove(
    'high-contrast',
    'large-text',
    'reduced-motion',
    'dyslexic-font',
    'simplified-layout',
    'eco-mode',
    'neuro-mode'
  );

  // Apply active settings
  if (settings.highContrast) root.classList.add('high-contrast');
  if (settings.largeText) root.classList.add('large-text');
  if (settings.reducedMotion) root.classList.add('reduced-motion');
  if (settings.dyslexicFont) root.classList.add('dyslexic-font');
  if (settings.simplifiedLayout) root.classList.add('simplified-layout');
  if (settings.ecoMode) root.classList.add('eco-mode');
  if (settings.neuroMode) root.classList.add('neuro-mode');

  root.setAttribute('data-accessibility-mode', settings.mode);
}
