import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import isEqual from 'lodash/isEqual';
import { ProfileTheme, Section, ProfileThemeConfig, ProfileSourceData, SinglePostLayout } from './types';
import { DEFAULT_THEME, DEFAULT_SECTIONS } from './constants';

const DEFAULT_SINGLE_POST_LAYOUT: SinglePostLayout = {
  show_featured_image: true,
  show_author: true,
  show_song_embed: true,
  show_comments: true,
  show_related_posts: true,
  show_navigation: true,
  content_layout: 'default',
  background_color: null,
  font_color: null,
  max_width: null,
};

export interface BuilderState {
  // Global theme fields
  theme: ProfileTheme;

  // Working copy of sections (the draft)
  sections: Section[];

  // Single post layout (working copy)
  singlePostLayout: SinglePostLayout;

  // Active page tab in editor
  activePage: 'main' | 'posts';

  // Config from API (available section types, limits, etc.)
  config: ProfileThemeConfig | null;

  // Source data for preview (user profile info)
  sourceData: ProfileSourceData | null;

  // Snapshot of the last saved state for dirty detection
  lastSaved: { theme: ProfileTheme; sections: Section[]; singlePostLayout: SinglePostLayout } | null;

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
    singlePostLayout?: SinglePostLayout;
    draftSinglePostLayout?: SinglePostLayout | null;
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

  // Single post layout
  setActivePage: (page: 'main' | 'posts') => void;
  setSinglePostLayoutField: <K extends keyof SinglePostLayout>(field: K, value: SinglePostLayout[K]) => void;
  setSinglePostLayout: (layout: Partial<SinglePostLayout>) => void;

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
  singlePostLayout: DEFAULT_SINGLE_POST_LAYOUT,
  activePage: 'main',
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
    !isEqual(state.sections, state.lastSaved.sections) ||
    !isEqual(state.singlePostLayout, state.lastSaved.singlePostLayout)
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
      const singlePostLayout = data.draftSinglePostLayout || data.singlePostLayout || DEFAULT_SINGLE_POST_LAYOUT;
      const theme = { ...DEFAULT_THEME, ...data.theme };
      const lastSaved = { theme, sections, singlePostLayout };
      set({
        theme,
        sections,
        singlePostLayout,
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

    setActivePage: (page) => set({ activePage: page }),

    setSinglePostLayoutField: (field, value) => {
      set((state) => {
        const newLayout = { ...state.singlePostLayout, [field]: value };
        const newState = { ...state, singlePostLayout: newLayout };
        return { ...newState, hasUnsavedChanges: computeHasUnsavedChanges(newState) };
      });
    },

    setSinglePostLayout: (layout) => {
      set((state) => {
        const newLayout = { ...state.singlePostLayout, ...layout };
        const newState = { ...state, singlePostLayout: newLayout };
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
        lastSaved: { theme: state.theme, sections: state.sections, singlePostLayout: state.singlePostLayout },
        hasUnsavedChanges: false,
      }));
    },

    restoreFromSaved: () => {
      set((state) => {
        if (!state.lastSaved) return state;
        return {
          theme: state.lastSaved.theme,
          sections: state.lastSaved.sections,
          singlePostLayout: state.lastSaved.singlePostLayout,
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
export const useSinglePostLayout = () => useBuilderStore((state) => state.singlePostLayout);
export const useActivePage = () => useBuilderStore((state) => state.activePage);
