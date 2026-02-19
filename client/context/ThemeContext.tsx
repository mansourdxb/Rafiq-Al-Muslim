import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'auto';

type ThemeContextType = {
  isDarkMode: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleDarkMode: () => void;
  colors: {
    // Background colors
    background: string;
    cardBackground: string;
    headerBackground: string;
    headerGradient: string[];

    // Text colors
    text: string;
    textSecondary: string;
    headerText: string;

    // UI elements
    border: string;
    divider: string;
    shadow: string;

    // Accent / semantic
    green: string;
    greenLight: string;
    gold: string;
    danger: string;

    // Component-level
    iconBg: string;
    searchBg: string;
    switchTrackOff: string;

    // Status bar
    statusBarStyle: 'light-content' | 'dark-content';
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme_mode';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('auto');

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleDarkMode = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const isDarkMode = themeMode === 'dark' || (themeMode === 'auto' && systemColorScheme === 'dark');

  const colors = isDarkMode
    ? {
        // ── Dark theme ──
        background: '#121212',
        cardBackground: '#1E1E1E',
        headerBackground: '#0D2818',
        headerGradient: ['#0D2818', '#1A3A28'],

        text: '#E8E3D9',
        textSecondary: '#8A8278',
        headerText: '#FFFFFF',

        border: '#2A2A2A',
        divider: '#2A2A2A',
        shadow: '#000000',

        green: '#3DA06A',
        greenLight: '#1A2E22',
        gold: '#D4AF37',
        danger: '#E74C3C',

        iconBg: '#1A2E22',
        searchBg: '#1E1E1E',
        switchTrackOff: '#3A3A3A',

        statusBarStyle: 'light-content' as const,
      }
    : {
        // ── Light theme ──
        background: '#F3EEE4',
        cardBackground: '#FFFFFF',
        headerBackground: '#1B4332',
        headerGradient: ['#1B4332', '#2D5A45'],

        text: '#1C1714',
        textSecondary: '#968C80',
        headerText: '#FFFFFF',

        border: '#E5E0D6',
        divider: '#E5E0D6',
        shadow: '#000000',

        green: '#2D7A4E',
        greenLight: '#EFF8F2',
        gold: '#D4AF37',
        danger: '#C0392B',

        iconBg: '#EFF8F2',
        searchBg: '#FFFFFF',
        switchTrackOff: '#D5D0C6',

        statusBarStyle: 'light-content' as const,
      };

  return (
    <ThemeContext.Provider value={{ isDarkMode, themeMode, setThemeMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
