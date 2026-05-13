import { create } from 'zustand'

export const useMapStore = create((set, get) => ({
  // Draft drop carried from /create form
  draftDrop: null,
  setDraftDrop: (draft) => set({ draftDrop: draft }),
  updateDraftDrop: (patch) =>
    set((s) => ({ draftDrop: { ...s.draftDrop, ...patch } })),
  clearDraftDrop: () => set({ draftDrop: null }),

  // Nodes (draft + live/scheduled from Supabase)
  nodes: [],
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
  removeNode: (id) => set((s) => ({ nodes: s.nodes.filter((n) => n.id !== id) })),
  setNodes: (nodes) => set({ nodes }),
  updateNodeStatus: (id, status) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, status } : n)),
    })),

  // User location
  userLocation: null,
  setUserLocation: (loc) => set({ userLocation: loc }),
}))
