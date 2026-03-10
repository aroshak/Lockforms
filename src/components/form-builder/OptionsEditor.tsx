'use client';

import * as React from 'react';
import { Plus, Trash2, GripVertical, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Option {
    id: string;
    label: string;
    value: string;
    imageUrl?: string;
}

interface OptionsEditorProps {
    options: Option[];
    onChange: (options: Option[]) => void;
}

// Sortable Option Item
function SortableOptionItem({
    option,
    index,
    totalCount,
    onUpdate,
    onRemove,
    onMoveUp,
    onMoveDown
}: {
    option: Option;
    index: number;
    totalCount: number;
    onUpdate: (field: 'label' | 'value' | 'imageUrl', value: string) => void;
    onRemove: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: option.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex flex-col gap-2 group p-2 rounded-lg transition-all border border-transparent",
                isDragging ? "opacity-50 bg-primary/10 shadow-lg border-primary/20" : "hover:bg-white/5 hover:border-white/10"
            )}
        >
            <div className="flex items-center gap-2">
                <div {...attributes} {...listeners} className="cursor-grab hover:text-white text-muted-foreground p-1 rounded hover:bg-white/10">
                    <GripVertical className="h-4 w-4" />
                </div>

                <div className="flex-1">
                    <Input
                        value={option.label}
                        onChange={(e) => {
                            // Auto-sync value with label
                            onUpdate('label', e.target.value);
                            onUpdate('value', e.target.value.toLowerCase().replace(/\s+/g, '-'));
                        }}
                        placeholder={`Option ${index + 1}`}
                        className="h-8 bg-transparent border-white/10 focus:border-primary/50"
                    />
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onRemove}
                        disabled={totalCount <= 1}
                        className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Image URL Field */}
            <div className="flex items-center gap-2 pl-9">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <Input
                    value={option.imageUrl || ''}
                    onChange={(e) => onUpdate('imageUrl', e.target.value)}
                    placeholder="Image URL (optional)"
                    className="h-7 text-xs bg-transparent border-white/5 focus:border-primary/30 text-muted-foreground placeholder:text-muted-foreground/50"
                />
            </div>
        </div>
    );
}

export function OptionsEditor({ options = [], onChange }: OptionsEditorProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const addOption = () => {
        const newOption: Option = {
            id: crypto.randomUUID(),
            label: `Option ${options.length + 1}`,
            value: `${options.length + 1}`
        };
        onChange([...options, newOption]);
    };

    const updateOption = (index: number, field: keyof Option, value: string) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        onChange(newOptions);
    };

    const removeOption = (index: number) => {
        if (options.length <= 1) return;
        onChange(options.filter((_, i) => i !== index));
    };

    const moveOption = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= options.length) return;
        onChange(arrayMove(options, index, newIndex));
    };

    return (
        <div className="space-y-2">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => {
                    const { active, over } = event;
                    if (over && active.id !== over.id) {
                        const oldIndex = options.findIndex((o) => o.id === active.id);
                        const newIndex = options.findIndex((o) => o.id === over.id);
                        onChange(arrayMove(options, oldIndex, newIndex));
                    }
                }}
            >
                <SortableContext
                    items={options.map((o) => o.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-1">
                        {options.map((option, index) => (
                            <SortableOptionItem
                                key={option.id}
                                option={option}
                                index={index}
                                totalCount={options.length}
                                onUpdate={(field, value) => updateOption(index, field, value)}
                                onRemove={() => removeOption(index)}
                                onMoveUp={() => moveOption(index, 'up')}
                                onMoveDown={() => moveOption(index, 'down')}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <Button
                onClick={addOption}
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs text-primary-300 hover:text-white hover:bg-primary/20 border border-dashed border-primary/20"
            >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
            </Button>
        </div>
    );
}
