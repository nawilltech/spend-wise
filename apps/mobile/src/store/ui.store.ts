import { create } from 'zustand';
import type { AnalyticsPeriod } from '@/types';

interface UIState {
  isOnline: boolean;
  isSyncing: boolean;
  selectedPeriod: AnalyticsPeriod;
  addTransactionVisible: boolean;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setSelectedPeriod: (period: AnalyticsPeriod) => void;
  setAddTransactionVisible: (visible: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  isOnline: true,
  isSyncing: false,
  selectedPeriod: 'monthly',
  addTransactionVisible: false,
  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setSelectedPeriod: (selectedPeriod) => set({ selectedPeriod }),
  setAddTransactionVisible: (addTransactionVisible) => set({ addTransactionVisible }),
}));
