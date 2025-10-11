import { create } from 'zustand'

type SetState = {
  selectedLeague: string | null;
  selectedModel: string;
};

interface Store {
  selectedLeague: string | null;
  setSelectedLeague: (league: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export const useStore = create<Store>((set: (fn: (state: SetState) => SetState) => void) => ({
  selectedLeague: null,
  setSelectedLeague: (league: string) => set((state) => ({ ...state, selectedLeague: league })),
  selectedModel: 'RandomForest',
  setSelectedModel: (model: string) => set((state) => ({ ...state, selectedModel: model })),
}))