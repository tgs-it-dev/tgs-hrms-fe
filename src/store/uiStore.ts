import { create } from 'zustand';

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
  sidebarWidth: 280,
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: open => set({ sidebarOpen: open }),
}));
