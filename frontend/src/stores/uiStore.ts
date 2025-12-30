'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ModalType =
  | 'settings'
  | 'upgrade'
  | 'share'
  | 'delete-confirm'
  | 'video-preview'
  | 'export'
  | 'login'
  | 'signup'
  | null;

export interface ModalData {
  videoId?: string;
  videoUrl?: string;
  title?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  [key: string]: unknown;
}

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Modals
  activeModal: ModalType;
  modalData: ModalData | null;

  // Theme
  theme: 'light' | 'dark' | 'system';
  resolvedTheme: 'light' | 'dark';

  // Layout
  commandPaletteOpen: boolean;
  fullscreenMode: boolean;
  compactMode: boolean;

  // Notifications
  notificationCount: number;

  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Actions - Modals
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;

  // Actions - Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setResolvedTheme: (theme: 'light' | 'dark') => void;

  // Actions - Layout
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleFullscreen: () => void;
  setFullscreenMode: (fullscreen: boolean) => void;
  toggleCompactMode: () => void;
  setCompactMode: (compact: boolean) => void;

  // Actions - Notifications
  setNotificationCount: (count: number) => void;
  incrementNotifications: () => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarOpen: true,
      sidebarCollapsed: false,
      activeModal: null,
      modalData: null,
      theme: 'system',
      resolvedTheme: 'dark',
      commandPaletteOpen: false,
      fullscreenMode: false,
      compactMode: false,
      notificationCount: 0,

      // Sidebar actions
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      toggleSidebarCollapse: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      // Modal actions
      openModal: (type, data = null) => {
        set({ activeModal: type, modalData: data });
      },

      closeModal: () => {
        set({ activeModal: null, modalData: null });
      },

      // Theme actions
      setTheme: (theme) => {
        set({ theme });

        // Resolve the theme based on system preference if needed
        if (theme === 'system' && typeof window !== 'undefined') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          set({ resolvedTheme: isDark ? 'dark' : 'light' });
        } else if (theme !== 'system') {
          set({ resolvedTheme: theme });
        }
      },

      setResolvedTheme: (resolvedTheme) => {
        set({ resolvedTheme });
      },

      // Layout actions
      toggleCommandPalette: () => {
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen }));
      },

      setCommandPaletteOpen: (open) => {
        set({ commandPaletteOpen: open });
      },

      toggleFullscreen: () => {
        set((state) => ({ fullscreenMode: !state.fullscreenMode }));
      },

      setFullscreenMode: (fullscreen) => {
        set({ fullscreenMode: fullscreen });
      },

      toggleCompactMode: () => {
        set((state) => ({ compactMode: !state.compactMode }));
      },

      setCompactMode: (compact) => {
        set({ compactMode: compact });
      },

      // Notification actions
      setNotificationCount: (count) => {
        set({ notificationCount: count });
      },

      incrementNotifications: () => {
        set((state) => ({ notificationCount: state.notificationCount + 1 }));
      },

      clearNotifications: () => {
        set({ notificationCount: 0 });
      },
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        compactMode: state.compactMode,
      }),
    }
  )
);

// Selectors
export const selectSidebar = (state: UIState) => ({
  isOpen: state.sidebarOpen,
  isCollapsed: state.sidebarCollapsed,
});

export const selectModal = (state: UIState) => ({
  type: state.activeModal,
  data: state.modalData,
  isOpen: state.activeModal !== null,
});

export const selectTheme = (state: UIState) => ({
  theme: state.theme,
  resolved: state.resolvedTheme,
  isDark: state.resolvedTheme === 'dark',
});
