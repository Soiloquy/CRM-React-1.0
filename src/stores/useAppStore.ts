import { create } from 'zustand'

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  currentUser: {
    name: string
    avatar: string
    role: string
  }
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  currentUser: {
    name: '张明',
    avatar: '',
    role: '渠道销售经理',
  },
}))
