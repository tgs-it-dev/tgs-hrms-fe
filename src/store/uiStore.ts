import { create } from 'zustand';

/** Matches the fixed width set in Sidebar.tsx — update both if changed. */
const DEFAULT_SIDEBAR_WIDTH = 280;

interface UIState {
  sidebarOpen: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

// Ready to wire: import useUIStore into Sidebar/Navbar components
// to replace the prop-drilled open/close state from Layout.
export const useUIStore = create<UIState>(set => ({
  sidebarOpen: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: open => set({ sidebarOpen: open }),
}));
