'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { useBuilderStore } from '@/lib/site-builder/store';
import { SectionCard, SectionCardOverlay } from './SectionCard';

export function SectionList() {
  const { sections, reorderSections } = useBuilderStore();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get IDs for sortable context
  const sectionIds = sections.map((section, index) => `${section.type}-${index}`);

  // Find the active section for drag overlay
  const activeSection = activeId
    ? sections.find((_, index) => `${sections[index].type}-${index}` === activeId)
    : null;
  const activeIndex = activeId
    ? sections.findIndex((_, index) => `${sections[index].type}-${index}` === activeId)
    : -1;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = sectionIds.indexOf(active.id as string);
      const newIndex = sectionIds.indexOf(over.id as string);
      reorderSections(oldIndex, newIndex);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <div className="section-list">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
          {sections.map((section, index) => (
            <SectionCard
              key={`${section.type}-${index}`}
              id={`${section.type}-${index}`}
              section={section}
              index={index}
            />
          ))}
        </SortableContext>

        <DragOverlay>
          {activeSection && activeIndex >= 0 ? (
            <SectionCardOverlay section={activeSection} index={activeIndex} />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
