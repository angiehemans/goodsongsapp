import { ComponentType } from 'react';
import {
  ProfileTheme,
  Section,
  SectionProps,
  SectionType,
  MenuSectionInfo,
} from '@/lib/site-builder/types';
import { ProfileSection } from './ProfileSection';
import {
  AboutSection,
  CustomTextSection,
  EventsSection,
  HeroSection,
  MailingListSection,
  MerchSection,
  MusicSection,
  PostsSection,
  RecommendationsSection,
} from './sections';

// Type-safe map of section renderers
const sectionRenderers: Record<SectionType, ComponentType<SectionProps<any, any, any>>> = {
  hero: HeroSection,
  music: MusicSection,
  events: EventsSection,
  posts: PostsSection,
  about: AboutSection,
  recommendations: RecommendationsSection,
  mailing_list: MailingListSection,
  merch: MerchSection,
  custom_text: CustomTextSection,
};

// Labels for section types in the menu
const sectionLabels: Record<SectionType, string> = {
  hero: 'Home',
  music: 'Music',
  events: 'Events',
  posts: 'Blog',
  about: 'About',
  recommendations: 'Recommendations',
  mailing_list: 'Newsletter',
  merch: 'Merch',
  custom_text: 'More',
};

interface SectionRendererProps {
  section: Section;
  theme: ProfileTheme;
  isPreview?: boolean;
}

export function SectionRenderer({ section, theme, isPreview = false }: SectionRendererProps) {
  const Renderer = sectionRenderers[section.type];

  if (!Renderer) {
    console.warn(`Unknown section type: ${section.type}`);
    return null;
  }

  return (
    <ProfileSection type={section.type} settings={section.settings}>
      <Renderer
        content={section.content || {}}
        data={section.data}
        settings={section.settings}
        theme={theme}
        isPreview={isPreview}
      />
    </ProfileSection>
  );
}

interface ProfileSectionsProps {
  sections: Section[];
  theme: ProfileTheme;
  isPreview?: boolean;
}

export function ProfileSections({ sections, theme, isPreview = false }: ProfileSectionsProps) {
  // Filter to only visible sections and sort by order
  // Treat null/undefined as visible (default to true)
  const visibleSections = sections
    .filter((section) => section.visible !== false)
    .sort((a, b) => a.order - b.order);

  // Generate menu sections for navigation (exclude hero from menu links)
  const menuSections: MenuSectionInfo[] = visibleSections
    .filter((section) => section.type !== 'hero')
    .map((section) => ({
      type: section.type,
      label: (section.content as any)?.menu_label || (section.content as any)?.title || (section.content as any)?.heading || sectionLabels[section.type],
      anchor: `section-${section.type}`,
    }));

  return (
    <>
      {visibleSections.map((section, index) => {
        // Inject menu_sections into hero section data
        const sectionWithMenuData = section.type === 'hero'
          ? {
              ...section,
              data: {
                ...section.data,
                menu_sections: menuSections,
              },
            }
          : section;

        return (
          <SectionRenderer
            key={`${section.type}-${index}`}
            section={sectionWithMenuData}
            theme={theme}
            isPreview={isPreview}
          />
        );
      })}
    </>
  );
}
