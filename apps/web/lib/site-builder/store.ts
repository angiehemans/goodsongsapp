import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import isEqual from 'lodash/isEqual';
import { ProfileTheme, Section, ProfileThemeConfig, ProfileSourceData } from './types';
import { DEFAULT_THEME, DEFAULT_SECTIONS } from './constants';

export interface BuilderState {
  // Global theme fields
  theme: ProfileTheme;

  // Working copy of sections (the draft)
  sections: Section[];

  // Config from API (available section types, limits, etc.)
  config: ProfileThemeConfig | null;

  // Source data for preview (user profile info)
  sourceData: ProfileSourceData | null;

  // Snapshot of the last saved state for dirty detection
  lastSaved: { theme: ProfileTheme; sections: Section[] } | null;

  // UI state
  expandedSectionId: string | null;
  isSaving: boolean;
  isPublishing: boolean;
  isDiscarding: boolean;
  isLoading: boolean;
  error: string | null;

  // Computed
  hasUnsavedChanges: boolean;
}

export interface BuilderActions {
  // Initialization
  initialize: (data: {
    theme: ProfileTheme;
    sections: Section[];
    draftSections: Section[] | null;
    config: ProfileThemeConfig;
    sourceData?: ProfileSourceData;
  }) => void;
  setSourceData: (sourceData: ProfileSourceData) => void;
  reset: () => void;

  // Theme updates
  setThemeField: <K extends keyof ProfileTheme>(field: K, value: ProfileTheme[K]) => void;
  setTheme: (theme: Partial<ProfileTheme>) => void;

  // Section updates
  setSections: (sections: Section[]) => void;
  updateSection: (index: number, updates: Partial<Section>) => void;
  updateSectionContent: (index: number, content: Partial<Section['content']>) => void;
  updateSectionSettings: (index: number, settings: Partial<Section['settings']>) => void;
  toggleSectionVisibility: (index: number) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  addSection: (type: Section['type']) => void;
  removeSection: (index: number) => void;

  // UI state
  setExpandedSectionId: (id: string | null) => void;
  toggleSection: (id: string) => void;

  // Save/Publish/Discard
  setSaving: (isSaving: boolean) => void;
  setPublishing: (isPublishing: boolean) => void;
  setDiscarding: (isDiscarding: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  markAsSaved: () => void;
  restoreFromSaved: () => void;
}

type BuilderStore = BuilderState & BuilderActions;

const initialState: BuilderState = {
  theme: DEFAULT_THEME,
  sections: DEFAULT_SECTIONS,
  config: null,
  sourceData: null,
  lastSaved: null,
  expandedSectionId: null,
  isSaving: false,
  isPublishing: false,
  isDiscarding: false,
  isLoading: true,
  error: null,
  hasUnsavedChanges: false,
};

// Helper to compute hasUnsavedChanges
function computeHasUnsavedChanges(state: BuilderState): boolean {
  if (!state.lastSaved) return false;
  return (
    !isEqual(state.theme, state.lastSaved.theme) ||
    !isEqual(state.sections, state.lastSaved.sections)
  );
}

// Helper to generate section ID for UI purposes
function getSectionId(section: Section, index: number): string {
  return `${section.type}-${index}`;
}

export const useBuilderStore = create<BuilderStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    initialize: (data) => {
      const sections = data.draftSections || data.sections;
      const lastSaved = { theme: data.theme, sections };
      set({
        theme: data.theme,
        sections,
        config: data.config,
        sourceData: data.sourceData || null,
        lastSaved,
        isLoading: false,
        error: null,
        hasUnsavedChanges: false,
      });
    },

    setSourceData: (sourceData) => set({ sourceData }),

    reset: () => set(initialState),

    setThemeField: (field, value) => {
      set((state) => {
        const newTheme = { ...state.theme, [field]: value };
        const newState = { ...state, theme: newTheme };
        return { ...newState, hasUnsavedChanges: computeHasUnsavedChanges(newState) };
      });
    },

    setTheme: (theme) => {
      set((state) => {
        const newTheme = { ...state.theme, ...theme };
        const newState = { ...state, theme: newTheme };
        return { ...newState, hasUnsavedChanges: computeHasUnsavedChanges(newState) };
      });
    },

    setSections: (sections) => {
      set((state) => {
        const newState = { ...state, sections };
        return { ...newState, hasUnsavedChanges: computeHasUnsavedChanges(newState) };
      });
    },

    updateSection: (index, updates) => {
      set((state) => {
        const newSections = [...state.sections];
        newSections[index] = { ...newSections[index], ...updates };
        const newState = { ...state, sections: newSections };
        return { ...newState, hasUnsavedChanges: computeHasUnsavedChanges(newState) };
      });
    },

    updateSectionContent: (index, content) => {
      set((state) => {
        const newSections = [...state.sections];
        newSections[index] = {
          ...newSections[index],
          content: { ...newSections[index].content, ...content },
        };
        const newState = { ...state, sections: newSections };
        return { ...newState, hasUnsavedChanges: computeHasUnsavedChanges(newState) };
      });
    },

    updateSectionSettings: (index, settings) => {
      set((state) => {
        const newSections = [...state.sections];
        newSections[index] = {
          ...newSections[index],
          settings: { ...newSections[index].settings, ...settings },
        };
        const newState = { ...state, sections: newSections };
        return { ...newState, hasUnsavedChanges: computeHasUnsavedChanges(newState) };
      });
    },

    toggleSectionVisibility: (index) => {
      set((state) => {
        const newSections = [...state.sections];
        newSections[index] = {
          ...newSections[index],
          visible: !newSections[index].visible,
        };
        const newState = { ...state, sections: newSections };
        return { ...newState, hasUnsavedChanges: computeHasUnsavedChanges(newState) };
      });
    },

    reorderSections: (fromIndex, toIndex) => {
      set((state) => {
        const newSections = [...state.sections];
        const [removed] = newSections.splice(fromIndex, 1);
        newSections.splice(toIndex, 0, removed);
        // Update order values
        newSections.forEach((section, i) => {
          section.order = i;
        });
        const newState = { ...state, sections: newSections };
        return { ...newState, hasUnsavedChanges: computeHasUnsavedChanges(newState) };
      });
    },

    addSection: (type) => {
      set((state) => {
        const newSection: Section = {
          type,
          visible: true,
          order: state.sections.length,
          content: {},
        };
        const newSections = [...state.sections, newSection];
        const newState = { ...state, sections: newSections };
        return { ...newState, hasUnsavedChanges: computeHasUnsavedChanges(newState) };
      });
    },

    removeSection: (index) => {
      set((state) => {
        const newSections = state.sections.filter((_, i) => i !== index);
        // Update order values
        newSections.forEach((section, i) => {
          section.order = i;
        });
        const newState = { ...state, sections: newSections };
        return { ...newState, hasUnsavedChanges: computeHasUnsavedChanges(newState) };
      });
    },

    setExpandedSectionId: (id) => set({ expandedSectionId: id }),

    toggleSection: (id) => {
      set((state) => ({
        expandedSectionId: state.expandedSectionId === id ? null : id,
      }));
    },

    setSaving: (isSaving) => set({ isSaving }),
    setPublishing: (isPublishing) => set({ isPublishing }),
    setDiscarding: (isDiscarding) => set({ isDiscarding }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    markAsSaved: () => {
      set((state) => ({
        lastSaved: { theme: state.theme, sections: state.sections },
        hasUnsavedChanges: false,
      }));
    },

    restoreFromSaved: () => {
      set((state) => {
        if (!state.lastSaved) return state;
        return {
          theme: state.lastSaved.theme,
          sections: state.lastSaved.sections,
          hasUnsavedChanges: false,
        };
      });
    },
  }))
);

// Selector hooks for common use cases
export const useTheme = () => useBuilderStore((state) => state.theme);
export const useSections = () => useBuilderStore((state) => state.sections);
export const useConfig = () => useBuilderStore((state) => state.config);
export const useSourceData = () => useBuilderStore((state) => state.sourceData);
export const useHasUnsavedChanges = () => useBuilderStore((state) => state.hasUnsavedChanges);
export const useIsLoading = () => useBuilderStore((state) => state.isLoading);
export const useIsSaving = () => useBuilderStore((state) => state.isSaving);
export const useIsPublishing = () => useBuilderStore((state) => state.isPublishing);
