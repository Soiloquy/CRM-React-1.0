import { create } from 'zustand'

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  currentUser: {
    name: string
    role: string
  }
  setCurrentUser: (user: AppState['currentUser']) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  currentUser: {
    name: '张明',
    role: '渠道销售经理',
  },
  setCurrentUser: (user) => set({ currentUser: user }),
}))
