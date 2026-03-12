'use client';

import * as React from 'react';
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
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Question, QuestionType } from '@/types/form';
import { SortableQuestionItem } from './SortableQuestionItem';
import { OptionsEditor } from './OptionsEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Save, Eye, Type, Mail, Hash, AlignLeft, Calendar, Clock,
    CircleDot, CheckSquare, ChevronDown, Star, Upload, PenTool, Minus, MessageSquare, BarChart2, Link as LinkIcon, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import { generateId, cn } from '@/lib/utils';
import { SharePanel } from '@/components/share/SharePanel';
import { upsertForm, getForm } from '@/app/admin/builder/actions';
import { FormSettingsPanel } from './FormSettingsPanel';

const createQuestion = (type: QuestionType): Question => {
    if (type === 'statement') {
        return {
            id: generateId(),
            type,
            title: "Statement Title",
            description: "Enter your message here...",
            required: false
        };
    }

    return {
        id: generateId(),
        type,
        title: "",
        placeholder: "",
        description: "",
        required: false,
        options: ['choice', 'radio', 'checkbox', 'dropdown', 'picture-choice'].includes(type)
            ? [{ id: generateId(), label: 'Option 1', value: '1' }, { id: generateId(), label: 'Option 2', value: '2' }]
            : undefined
    };
};

export function FormBuilder({ formId }: { formId?: string }) {
    const [isLoading, setIsLoading] = React.useState(!(!formId));
    const [questions, setQuestions] = React.useState<Question[]>([]);
    const [formTitle, setFormTitle] = React.useState("Untitled Form");
    const [selectedQuestion, setSelectedQuestion] = React.useState<Question | null>(null);
    const [selectedScreen, setSelectedScreen] = React.useState<'welcome' | 'end' | null>(null);
    const [saving, setSaving] = React.useState(false);
    const [activeView, setActiveView] = React.useState<'build' | 'settings' | 'share'>('build');
    const [formSlug, setFormSlug] = React.useState<string | null>(null);
    const [formSettings, setFormSettings] = React.useState<any>(null);

    const handleScreenSelect = (screen: 'welcome' | 'end') => {
        setSelectedScreen(screen);
        setSelectedQuestion(null);
    };

    const handleQuestionSelect = (question: Question) => {
        setSelectedQuestion(question);
        setSelectedScreen(null);
    };

    const updateFormSettings = (updates: any) => {
        setFormSettings((prev: any) => ({ ...prev, ...updates }));
    };

    const updateWelcomeScreen = (updates: any) => {
        const current = formSettings?.welcomeScreen || { enabled: true, title: '', description: '', buttonText: "Start" };
        updateFormSettings({
            welcomeScreen: { ...current, ...updates }
        });
    };

    const updateEndScreen = (updates: any) => {
        const current = formSettings?.endScreen || { enabled: true, title: 'Thank you!', description: 'Submission received.', buttonText: 'Submit another', redirectUrl: '' };
        updateFormSettings({
            endScreen: { ...current, ...updates }
        });
    };

    // FIXED: Added activationConstraint so clicks are not swallowed by drag events (distance: 8px)
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

    React.useEffect(() => {
        if (formId) {
            getForm(formId).then(result => {
                if (result.success && result.data) {
                    const form = result.data;
                    setFormTitle(form.title || "Untitled Form");

                    // Extract questions from schema
                    const schema = form.schema as any;
                    let loadedQuestions: Question[] = [];

                    if (Array.isArray(schema)) {
                        loadedQuestions = schema;
                    } else if (schema && typeof schema === 'object' && Array.isArray(schema.questions)) {
                        loadedQuestions = schema.questions;
                    }

                    setQuestions(loadedQuestions);
                    setFormSlug(form.slug);
                    setFormSettings(form.settings || null);
                }
            }).finally(() => setIsLoading(false));
        }
    }, [formId]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((q) => q.id === active.id);
                const newIndex = items.findIndex((q) => q.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const addQuestion = (type: QuestionType) => {
        const newQuestion = createQuestion(type);
        setQuestions((prev) => [...prev, newQuestion]);
        handleQuestionSelect(newQuestion);
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === id ? { ...q, ...updates } : q))
        );
        if (selectedQuestion?.id === id) {
            setSelectedQuestion((prev) => prev ? { ...prev, ...updates } : null);
        }
    };

    const deleteQuestion = (id: string) => {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        if (selectedQuestion?.id === id) {
            setSelectedQuestion(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await upsertForm(
                formId || null,
                formTitle,
                questions,
                formSettings || {}
            );

            if (result.success && result.data) {
                if (!formId && result.data.id) {
                    window.history.pushState({}, '', `/admin/builder?id=${result.data.id}`);
                }
            } else {
                console.error('Failed to save form:', result.message);
            }
        } catch (error) {
            console.error('Error saving form:', error);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen bg-[#0B0E14] text-primary-400 font-medium animate-pulse">Loading editor...</div>;
    }

    return (
        <div className="flex h-screen bg-[#0B0E14] text-foreground overflow-hidden">
            {/* Left Sidebar - Toolbox */}
            <div className="hidden lg:flex w-72 border-r border-white/10 flex-col bg-black/20 backdrop-blur-xl z-20">
                <div className="p-5 border-b border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="font-bold text-white text-lg font-display">L</span>
                        </div>
                        <span className="font-bold text-white text-lg tracking-tight">LockForms</span>
                    </div>
                    <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/5">
                        {['build', 'settings', 'share'].map((view) => (
                            <Button
                                key={view}
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "flex-1 h-8 text-xs font-medium capitalize transition-all duration-300",
                                    activeView === view ? "bg-primary text-white shadow-md rounded-lg" : "text-muted-foreground hover:text-white hover:bg-white/5"
                                )}
                                onClick={() => setActiveView(view as any)}
                            >
                                {view}
                            </Button>
                        ))}
                    </div>
                </div>

                {activeView === 'build' && (
                    <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-8">
                        <div>
                            <h3 className="text-xs font-bold text-white/40 mb-3 px-1 uppercase tracking-widest">Core Fields</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <ToolButton icon={Type} label="Text" onClick={() => addQuestion('text')} />
                                <ToolButton icon={Mail} label="Email" onClick={() => addQuestion('email')} />
                                <ToolButton icon={Hash} label="Number" onClick={() => addQuestion('number')} />
                                <ToolButton icon={AlignLeft} label="Paragraph" onClick={() => addQuestion('paragraph')} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-white/40 mb-3 px-1 uppercase tracking-widest">Layout & Content</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <ToolButton icon={MessageSquare} label="Statement" onClick={() => addQuestion('statement')} />
                                <ToolButton icon={LinkIcon} label="Website" onClick={() => addQuestion('website')} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-white/40 mb-3 px-1 uppercase tracking-widest">Selection</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <ToolButton icon={CircleDot} label="Radio" onClick={() => addQuestion('radio')} />
                                <ToolButton icon={CheckSquare} label="Checkbox" onClick={() => addQuestion('checkbox')} />
                                <ToolButton icon={ChevronDown} label="Dropdown" onClick={() => addQuestion('dropdown')} />
                                <ToolButton icon={ImageIcon} label="Picture Choice" onClick={() => addQuestion('picture-choice')} />
                                <ToolButton icon={Star} label="Rating" onClick={() => addQuestion('rating')} />
                                <ToolButton icon={BarChart2} label="Scale 1-10" onClick={() => addQuestion('scale')} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-white/40 mb-3 px-1 uppercase tracking-widest">Advanced</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <ToolButton icon={Upload} label="File Upload" onClick={() => addQuestion('file')} />
                                <ToolButton icon={PenTool} label="Signature" onClick={() => addQuestion('signature')} />
                                <ToolButton icon={Calendar} label="Date" onClick={() => addQuestion('date')} />
                                <ToolButton icon={Clock} label="Time" onClick={() => addQuestion('datetime')} />
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'settings' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <FormSettingsPanel
                            settings={formSettings || {}}
                            onChange={setFormSettings}
                        />
                    </div>
                )}

                {activeView === 'share' && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {formSlug ? (
                            <SharePanel formId={formId!} formSlug={formSlug} />
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-muted-foreground text-sm mb-4">Save your form to generate a share link.</p>
                            </div>
                        )}
                    </div>
                )}

                <div className="p-4 border-t border-white/10 bg-black/40">
                    <Button
                        onClick={handleSave}
                        className="w-full bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(130,87,229,0.3)] hover:shadow-[0_0_25px_rgba(130,87,229,0.5)] transition-all h-10 font-medium"
                        disabled={saving}
                    >
                        {saving ? (
                            <>Saving...</>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" /> Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 flex flex-col h-full bg-[#0B0E14] relative overflow-hidden transition-all duration-300">
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#8257e5 1px, transparent 1px)', backgroundSize: '32px 32px' }}
                />

                <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 backdrop-blur-md z-10">
                    <div className="flex items-center gap-3 lg:hidden">
                        {/* Mobile Menu Toggle would go here */}
                        <span className="font-bold text-white">LockForms</span>
                    </div>

                    <div className="hidden lg:flex items-center gap-2">
                        <div className="flex items-center px-3 py-1 bg-white/5 rounded-full border border-white/5">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></span>
                            <span className="text-xs font-medium text-white/70">Canvas Active</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {formSlug && (
                            <Link href={`/f/${formSlug}`} target="_blank">
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white hover:bg-white/5">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                </Button>
                            </Link>
                        )}
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-10 relative z-10 custom-scrollbar scroll-smooth">
                    <div className="max-w-3xl mx-auto space-y-6 pb-24">
                        {/* Title Editor */}
                        <div className="glass p-8 rounded-2xl border-l-4 border-l-primary group transition-all hover:bg-white/[0.07] mb-6">
                            <label className="block text-xs uppercase tracking-widest text-primary-400 font-bold mb-3">Form Header</label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                className="w-full bg-transparent text-4xl lg:text-5xl font-bold text-white placeholder:text-muted-foreground/30 focus:outline-none font-display leading-tight"
                                placeholder="Untitled Form"
                            />
                        </div>

                        {/* Welcome Screen Block */}
                        <div
                            onClick={() => handleScreenSelect('welcome')}
                            className={cn(
                                "p-6 rounded-xl border-2 transition-all cursor-pointer relative group",
                                selectedScreen === 'welcome'
                                    ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(130,87,229,0.15)]"
                                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5"
                            )}
                        >
                            <div className="absolute top-4 left-4 px-2 py-1 rounded-md bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white/50">
                                Welcome Screen
                            </div>
                            <div className="mt-8 text-center space-y-2">
                                <h3 className={cn("text-2xl font-bold", formSettings?.welcomeScreen?.title ? "text-white" : "text-white/30 italic")}>
                                    {formSettings?.welcomeScreen?.title || "Welcome to our form"}
                                </h3>
                                <p className={cn("text-sm", formSettings?.welcomeScreen?.description ? "text-muted-foreground" : "text-white/20 italic")}>
                                    {formSettings?.welcomeScreen?.description || "Description goes here..."}
                                </p>
                                <div className="pt-4">
                                    <span className="px-6 py-2 rounded-full bg-white/10 text-white/40 text-sm font-medium border border-white/5">
                                        {formSettings?.welcomeScreen?.buttonText || "Start"}
                                    </span>
                                </div>
                            </div>
                            {!formSettings?.welcomeScreen?.enabled && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl border border-white/5">
                                    <div className="px-4 py-2 rounded-lg bg-black/80 border border-white/10 text-white/50 text-xs font-mono uppercase tracking-widest">
                                        Hidden
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drop / Sort Area */}
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={questions.map(q => q.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-4 min-h-[200px]">
                                    {questions.map((question) => (
                                        <div
                                            key={question.id}
                                            onClick={() => handleQuestionSelect(question)}
                                            className="transform transition-all duration-200"
                                        >
                                            <SortableQuestionItem
                                                question={question}
                                                isSelected={selectedQuestion?.id === question.id}
                                                onDelete={() => deleteQuestion(question.id)}
                                                onUpdate={(updates) => updateQuestion(question.id, updates)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {/* End Screen Block */}
                        <div
                            onClick={() => handleScreenSelect('end')}
                            className={cn(
                                "p-6 rounded-xl border-2 transition-all cursor-pointer relative group",
                                selectedScreen === 'end'
                                    ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(130,87,229,0.15)]"
                                    : "border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/5"
                            )}
                        >
                            <div className="absolute top-4 left-4 px-2 py-1 rounded-md bg-white/10 text-[10px] font-bold uppercase tracking-widest text-white/50">
                                End Screen
                            </div>
                            <div className="mt-8 text-center space-y-2">
                                <h3 className={cn("text-2xl font-bold", formSettings?.endScreen?.title ? "text-white" : "text-white/30 italic")}>
                                    {formSettings?.endScreen?.title || "Thank you!"}
                                </h3>
                                <p className={cn("text-sm", formSettings?.endScreen?.description ? "text-muted-foreground" : "text-white/20 italic")}>
                                    {formSettings?.endScreen?.description || "Your submission has been received."}
                                </p>
                            </div>
                            {!formSettings?.endScreen?.enabled && (
                                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl border border-white/5">
                                    <div className="px-4 py-2 rounded-lg bg-black/80 border border-white/10 text-white/50 text-xs font-mono uppercase tracking-widest">
                                        Hidden
                                    </div>
                                </div>
                            )}
                        </div>

                        {(!questions || questions.length === 0) && (
                            <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group" onClick={() => setActiveView('build')}>
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                                    <PenTool className="h-8 w-8 text-white/40 group-hover:text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">Start Building</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">Select a field type from the sidebar to begin crafting your form.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Properties */}
            {
                (selectedQuestion || selectedScreen) && activeView === 'build' && (
                    <div className="hidden xl:flex w-80 border-l border-white/10 bg-black/20 backdrop-blur-xl flex-col h-full z-20 animate-in slide-in-from-right-4 duration-300">
                        <div className="p-5 border-b border-white/10 bg-white/5">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-white tracking-wide">
                                    {selectedScreen === 'welcome' && "Welcome Screen"}
                                    {selectedScreen === 'end' && "End Screen"}
                                    {selectedQuestion && "Properties"}
                                </h3>
                                <button onClick={() => { setSelectedQuestion(null); setSelectedScreen(null); }} className="text-muted-foreground hover:text-white transition-colors">
                                    <Minus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                            {/* Welcome Screen Properties */}
                            {selectedScreen === 'welcome' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                        <Label className="text-white cursor-pointer" onClick={() => updateWelcomeScreen({ enabled: !formSettings?.welcomeScreen?.enabled })}>Enable Screen</Label>
                                        <input
                                            type="checkbox"
                                            checked={formSettings?.welcomeScreen?.enabled !== false}
                                            onChange={(e) => updateWelcomeScreen({ enabled: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Title</Label>
                                        <Input
                                            value={formSettings?.welcomeScreen?.title || ''}
                                            onChange={(e) => updateWelcomeScreen({ title: e.target.value })}
                                            placeholder="Welcome to our form"
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Description</Label>
                                        <Input
                                            value={formSettings?.welcomeScreen?.description || ''}
                                            onChange={(e) => updateWelcomeScreen({ description: e.target.value })}
                                            placeholder="Description..."
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Button Text</Label>
                                        <Input
                                            value={formSettings?.welcomeScreen?.buttonText || ''}
                                            onChange={(e) => updateWelcomeScreen({ buttonText: e.target.value })}
                                            placeholder="Start"
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* End Screen Properties */}
                            {selectedScreen === 'end' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                        <Label className="text-white cursor-pointer" onClick={() => updateEndScreen({ enabled: !formSettings?.endScreen?.enabled })}>Enable Screen</Label>
                                        <input
                                            type="checkbox"
                                            checked={formSettings?.endScreen?.enabled !== false}
                                            onChange={(e) => updateEndScreen({ enabled: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Title</Label>
                                        <Input
                                            value={formSettings?.endScreen?.title || ''}
                                            onChange={(e) => updateEndScreen({ title: e.target.value })}
                                            placeholder="Thank you!"
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Description</Label>
                                        <Input
                                            value={formSettings?.endScreen?.description || ''}
                                            onChange={(e) => updateEndScreen({ description: e.target.value })}
                                            placeholder="Message..."
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Button Text</Label>
                                        <Input
                                            value={formSettings?.endScreen?.buttonText || ''}
                                            onChange={(e) => updateEndScreen({ buttonText: e.target.value })}
                                            placeholder="Submit another"
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Redirect URL</Label>
                                        <Input
                                            value={formSettings?.endScreen?.redirectUrl || ''}
                                            onChange={(e) => updateEndScreen({ redirectUrl: e.target.value })}
                                            placeholder="https://..."
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Question Properties */}
                            {selectedQuestion && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Question Text</Label>
                                        <Input
                                            value={selectedQuestion.title}
                                            onChange={(e) => updateQuestion(selectedQuestion.id, { title: e.target.value })}
                                            placeholder="What is your name?"
                                            className="bg-white/5 border-white/10 h-9"
                                        />
                                    </div>

                                    {['text', 'email', 'number', 'url', 'website', 'paragraph'].includes(selectedQuestion.type) && (
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Placeholder</Label>
                                            <Input
                                                value={selectedQuestion.placeholder || ''}
                                                onChange={(e) => updateQuestion(selectedQuestion.id, { placeholder: e.target.value })}
                                                placeholder="e.g. John Doe"
                                                className="bg-white/5 border-white/10"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Description</Label>
                                        <Input
                                            value={selectedQuestion.description || ''}
                                            onChange={(e) => updateQuestion(selectedQuestion.id, { description: e.target.value })}
                                            className="bg-white/5 border-white/10"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                        <Label className="text-white cursor-pointer" onClick={() => updateQuestion(selectedQuestion.id, { required: !selectedQuestion.required })}>Required Field</Label>
                                        <input
                                            type="checkbox"
                                            checked={selectedQuestion.required}
                                            onChange={(e) => updateQuestion(selectedQuestion.id, { required: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                                        />
                                    </div>

                                    {['choice', 'radio', 'checkbox', 'dropdown', 'picture-choice'].includes(selectedQuestion.type) && selectedQuestion.options && (
                                        <div className="space-y-4 pt-4 border-t border-white/10">
                                            <Label className="text-muted-foreground text-xs uppercase tracking-wider">Options</Label>
                                            <OptionsEditor
                                                options={selectedQuestion.options}
                                                onChange={(newOptions) => updateQuestion(selectedQuestion.id, { options: newOptions })}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )
            }
        </div >
    );
}

function ToolButton({ icon: Icon, label, onClick, disabled }: { icon: any, label: string, onClick: () => void, disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(130,87,229,0.2)] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
        >
            <Icon className="w-5 h-5 mb-2 text-muted-foreground group-hover:text-primary-300 transition-colors" />
            <span className="text-xs font-medium text-muted-foreground group-hover:text-white">{label}</span>
        </button>
    )
}
