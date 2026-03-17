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
import Link from 'next/link';
import { generateId, cn } from '@/lib/utils';
import { SharePanel } from '@/components/share/SharePanel';
import { upsertForm, getForm } from '@/app/admin/builder/actions';
import { FormSettingsPanel } from './FormSettingsPanel';
import { useSession } from 'next-auth/react';

// ─── Types ───────────────────────────────────────────────────────────────────

type RightPanel = 'properties' | 'settings' | 'share';

interface Flow {
    id: string;
    name: string;
}

// ─── Left Sidebar Element Definitions ────────────────────────────────────────

const FORM_ELEMENTS: { type: QuestionType; icon: string; label: string }[] = [
    { type: 'text',           icon: 'text_fields',         label: 'Text Input'      },
    { type: 'email',          icon: 'email',               label: 'Email'           },
    { type: 'number',         icon: 'tag',                 label: 'Number'          },
    { type: 'paragraph',      icon: 'notes',               label: 'Paragraph'       },
    { type: 'dropdown',       icon: 'list',                label: 'Dropdown'        },
    { type: 'checkbox',       icon: 'check_box',           label: 'Checkbox'        },
    { type: 'radio',          icon: 'radio_button_checked',label: 'Radio'           },
    { type: 'picture-choice', icon: 'image',               label: 'Picture Choice'  },
    { type: 'rating',         icon: 'star',                label: 'Rating'          },
    { type: 'scale',          icon: 'linear_scale',        label: 'Scale 1–10'      },
    { type: 'date',           icon: 'calendar_today',      label: 'Date Picker'     },
    { type: 'file',           icon: 'cloud_upload',        label: 'File Upload'     },
    { type: 'signature',      icon: 'draw',                label: 'Signature'       },
    { type: 'statement',      icon: 'info',                label: 'Statement'       },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

const createQuestion = (type: QuestionType): Question => {
    if (type === 'statement') {
        return { id: generateId(), type, title: 'Statement Title', description: 'Enter your message here...', required: false };
    }
    return {
        id: generateId(), type, title: '', placeholder: '', description: '', required: false,
        options: ['choice', 'radio', 'checkbox', 'dropdown', 'picture-choice'].includes(type)
            ? [{ id: generateId(), label: 'Option 1', value: '1' }, { id: generateId(), label: 'Option 2', value: '2' }]
            : undefined,
    };
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function FormBuilder({ formId }: { formId?: string }) {
    const { data: session } = useSession();
    const [isLoading,       setIsLoading]       = React.useState(!!formId);
    const [questions,       setQuestions]       = React.useState<Question[]>([]);
    const [flows,           setFlows]           = React.useState<Flow[]>([]);
    const [formTitle,       setFormTitle]       = React.useState('Untitled Form');
    const [selectedQuestion,setSelectedQuestion]= React.useState<Question | null>(null);
    const [selectedScreen,  setSelectedScreen]  = React.useState<'welcome' | 'end' | null>(null);
    const [saving,          setSaving]          = React.useState(false);
    const [lastSaved,       setLastSaved]       = React.useState<Date | null>(null);
    const [rightPanel,      setRightPanel]      = React.useState<RightPanel>('properties');
    const [formSlug,        setFormSlug]        = React.useState<string | null>(null);
    const [formSettings,    setFormSettings]    = React.useState<Record<string, unknown> | null>(null);

    const autoSaveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMounted     = React.useRef(false);

    // ── DnD sensors ──────────────────────────────────────────────────────────
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // ── Load form ─────────────────────────────────────────────────────────────
    React.useEffect(() => {
        if (!formId) return;
        getForm(formId).then(result => {
            if (result.success && result.data) {
                const form = result.data;
                setFormTitle(form.title || 'Untitled Form');
                const schema = form.schema as Record<string, unknown>;
                let loaded: Question[] = [];
                if (Array.isArray(schema)) loaded = schema as Question[];
                else if (schema?.questions && Array.isArray(schema.questions)) loaded = schema.questions as Question[];
                setQuestions(loaded);
                setFormSlug(form.slug);
                setFormSettings((form.settings as Record<string, unknown>) || null);
            }
        }).finally(() => setIsLoading(false));
    }, [formId]);

    // ── Auto-save (debounced, existing forms only) ────────────────────────────
    React.useEffect(() => {
        if (!isMounted.current) { isMounted.current = true; return; }
        if (!formId) return;
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => doSave(true), 2500);
        return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [questions, formTitle, formSettings]);

    // ── Last-saved display ────────────────────────────────────────────────────
    const lastSavedText = React.useMemo(() => {
        if (saving) return 'Saving…';
        if (!lastSaved) return 'Unsaved';
        const s = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
        if (s < 10)   return 'Just now';
        if (s < 60)   return `${s}s ago`;
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        return `${Math.floor(s / 3600)}h ago`;
    }, [saving, lastSaved]);

    // ── Save ──────────────────────────────────────────────────────────────────
    const doSave = async (silent = false) => {
        if (!silent) setSaving(true);
        try {
            const result = await upsertForm(formId || null, formTitle, questions, formSettings || {});
            if (result.success && result.data) {
                setLastSaved(new Date());
                if (!formId && result.data.id) {
                    window.history.pushState({}, '', `/admin/builder?id=${result.data.id}`);
                }
            }
        } catch (e) { console.error('Save error:', e); }
        finally { if (!silent) setSaving(false); }
    };

    // ── Question CRUD ─────────────────────────────────────────────────────────
    const addQuestion = (type: QuestionType) => {
        const q = createQuestion(type);
        setQuestions(prev => [...prev, q]);
        setSelectedQuestion(q);
        setSelectedScreen(null);
        setRightPanel('properties');
    };

    const updateQuestion = (id: string, updates: Partial<Question>) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
        if (selectedQuestion?.id === id) setSelectedQuestion(prev => prev ? { ...prev, ...updates } : null);
    };

    const deleteQuestion = (id: string) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
        if (selectedQuestion?.id === id) setSelectedQuestion(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setQuestions(items => {
                const oi = items.findIndex(q => q.id === active.id);
                const ni = items.findIndex(q => q.id === over.id);
                return arrayMove(items, oi, ni);
            });
        }
    };

    // ── Flow CRUD ─────────────────────────────────────────────────────────────
    const addFlow = () => {
        setFlows(prev => [...prev, { id: generateId(), name: `Flow ${prev.length + 1}` }]);
    };

    // ── Settings helpers ──────────────────────────────────────────────────────
    const updateFormSettings = (updates: Record<string, unknown>) =>
        setFormSettings(prev => ({ ...(prev || {}), ...updates }));

    const updateWelcomeScreen = (updates: Record<string, unknown>) => updateFormSettings({
        welcomeScreen: { enabled: true, title: '', description: '', buttonText: 'Start', ...(formSettings?.welcomeScreen as Record<string, unknown> || {}), ...updates }
    });

    const updateEndScreen = (updates: Record<string, unknown>) => updateFormSettings({
        endScreen: { enabled: true, title: 'Thank you!', description: 'Submission received.', buttonText: 'Submit another', redirectUrl: '', ...(formSettings?.endScreen as Record<string, unknown> || {}), ...updates }
    });

    // ── Derived ───────────────────────────────────────────────────────────────
    const welcomeScreen = formSettings?.welcomeScreen as Record<string, unknown> | undefined;
    const endScreen     = formSettings?.endScreen     as Record<string, unknown> | undefined;
    const userInitial   = (session?.user?.name?.[0] || session?.user?.email?.[0] || 'A').toUpperCase();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0B0E14] text-sm font-medium text-primary animate-pulse">
                Loading editor…
            </div>
        );
    }

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-[#0B0E14] text-slate-100">

            {/* ═══════════════════════════════════════════════════════════════
                TOP HEADER
            ═══════════════════════════════════════════════════════════════ */}
            <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-primary/10 bg-[#0B0E14]/80 px-6 backdrop-blur-md z-50">

                {/* Left: logo + title */}
                <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                        <span className="material-symbols-outlined text-2xl">grid_view</span>
                    </div>
                    <div>
                        <input
                            type="text"
                            value={formTitle}
                            onChange={e => setFormTitle(e.target.value)}
                            className="bg-transparent text-sm font-semibold text-slate-100 focus:outline-none focus:border-b focus:border-primary/50 transition-all min-w-[140px] max-w-[300px]"
                        />
                        <p className="text-[10px] uppercase tracking-wider text-slate-500">
                            Draft · Last saved {lastSavedText}
                        </p>
                    </div>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-3">
                    {/* Undo / Redo */}
                    <div className="flex items-center gap-1 border-r border-primary/10 pr-4 mr-1">
                        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors" title="Undo">
                            <span className="material-symbols-outlined text-xl">undo</span>
                        </button>
                        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors" title="Redo">
                            <span className="material-symbols-outlined text-xl">redo</span>
                        </button>
                    </div>

                    {/* Settings icon */}
                    <button
                        onClick={() => setRightPanel(p => p === 'settings' ? 'properties' : 'settings')}
                        className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                            rightPanel === 'settings' ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-primary/10 hover:text-primary'
                        )}
                        title="Form Settings"
                    >
                        <span className="material-symbols-outlined text-xl">settings</span>
                    </button>

                    {/* Share icon */}
                    <button
                        onClick={() => setRightPanel(p => p === 'share' ? 'properties' : 'share')}
                        className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                            rightPanel === 'share' ? 'bg-primary/20 text-primary' : 'text-slate-400 hover:bg-primary/10 hover:text-primary'
                        )}
                        title="Share"
                    >
                        <span className="material-symbols-outlined text-xl">share</span>
                    </button>

                    {/* Preview */}
                    {formSlug ? (
                        <Link href={`/f/${formSlug}`} target="_blank">
                            <button className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-all">
                                <span className="material-symbols-outlined text-lg">visibility</span>
                                Preview
                            </button>
                        </Link>
                    ) : (
                        <button
                            onClick={() => doSave()}
                            className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">visibility</span>
                            Preview
                        </button>
                    )}

                    {/* Publish */}
                    <button
                        onClick={() => doSave()}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 hover:brightness-110 transition-all disabled:opacity-70"
                    >
                        <span className="material-symbols-outlined text-lg">rocket_launch</span>
                        {saving ? 'Saving…' : 'Publish'}
                    </button>

                    {/* Avatar */}
                    <div className="ml-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/20 text-sm font-bold text-primary">
                        {userInitial}
                    </div>
                </div>
            </header>

            {/* ═══════════════════════════════════════════════════════════════
                BODY  (left sidebar | canvas | right panel)
            ═══════════════════════════════════════════════════════════════ */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── LEFT SIDEBAR ── */}
                <aside className="sidebar-glass w-72 flex-shrink-0 border-r border-primary/10 flex flex-col gap-6 overflow-y-auto p-6">

                    {/* Form Elements */}
                    <div>
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Form Elements</h2>
                        <div className="grid grid-cols-1 gap-2">
                            {FORM_ELEMENTS.map(el => (
                                <button
                                    key={el.type}
                                    onClick={() => addQuestion(el.type)}
                                    className="glass flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:glass-active transition-all group text-left"
                                >
                                    <span className="material-symbols-outlined text-xl text-primary">{el.icon}</span>
                                    <span className="text-sm font-medium text-slate-300 group-hover:text-white">{el.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Flow Control */}
                    <div>
                        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Flow Control</h2>
                        <div className="grid grid-cols-1 gap-2">
                            <button
                                onClick={addFlow}
                                className="glass flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:glass-active transition-all group text-left"
                            >
                                <span className="material-symbols-outlined text-xl text-primary">alt_route</span>
                                <span className="text-sm font-medium text-slate-300 group-hover:text-white">Conditional Logic</span>
                            </button>
                        </div>

                        {/* Active flows list */}
                        {flows.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {flows.map(flow => (
                                    <div key={flow.id} className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/10 px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>alt_route</span>
                                            <span className="text-xs font-medium text-primary">{flow.name}</span>
                                        </div>
                                        <button
                                            onClick={() => setFlows(prev => prev.filter(f => f.id !== flow.id))}
                                            className="text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* ── CANVAS ── */}
                <section className="relative flex-1 overflow-y-auto p-12 bg-[radial-gradient(circle_at_center,_rgba(130,87,229,0.05)_0%,_#0B0E14_60%)]">
                    <div className="mx-auto max-w-2xl space-y-6">

                        {/* Canvas title */}
                        <div className="mb-10 text-center">
                            <input
                                type="text"
                                value={formTitle}
                                onChange={e => setFormTitle(e.target.value)}
                                placeholder="Untitled Form"
                                className="w-full bg-transparent text-2xl font-bold text-white text-center focus:outline-none placeholder:text-white/20"
                            />
                            <p className="mt-1 text-sm text-slate-500">
                                {questions.length === 0 ? 'Click a field in the sidebar to add it here' : 'Identity and access level verification'}
                            </p>
                        </div>

                        {/* Welcome Screen block */}
                        <div
                            onClick={() => { setSelectedScreen('welcome'); setSelectedQuestion(null); setRightPanel('properties'); }}
                            className={cn(
                                'relative group rounded-xl p-6 transition-all cursor-pointer border',
                                selectedScreen === 'welcome'
                                    ? 'glass-active border-primary/50 ring-4 ring-primary/10'
                                    : 'glass border-primary/10 hover:border-primary/30'
                            )}
                        >
                            <div className="absolute top-3 left-3 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                                Welcome Screen
                            </div>
                            <div className="mt-6 space-y-2 text-center">
                                <h3 className={cn('text-xl font-bold', welcomeScreen?.title ? 'text-white' : 'italic text-white/20')}>
                                    {(welcomeScreen?.title as string) || 'Welcome to our form'}
                                </h3>
                                <p className="text-sm text-slate-500">{(welcomeScreen?.description as string) || 'Description goes here…'}</p>
                                <span className="inline-block rounded-full border border-white/5 bg-white/5 px-6 py-1.5 text-sm text-white/30">
                                    {(welcomeScreen?.buttonText as string) || 'Start'}
                                </span>
                            </div>
                            {welcomeScreen?.enabled === false && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/30">Hidden</span>
                                </div>
                            )}
                        </div>

                        {/* Questions via DnD */}
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-4 min-h-[60px]">
                                    {questions.map(question => (
                                        <div
                                            key={question.id}
                                            onClick={() => { setSelectedQuestion(question); setSelectedScreen(null); setRightPanel('properties'); }}
                                        >
                                            <SortableQuestionItem
                                                question={question}
                                                isSelected={selectedQuestion?.id === question.id}
                                                onDelete={() => deleteQuestion(question.id)}
                                                onUpdate={updates => updateQuestion(question.id, updates)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>

                        {/* Flow cards on canvas */}
                        {flows.map(flow => (
                            <div key={flow.id} className="glass rounded-xl border border-primary/20 p-5">
                                <div className="mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-lg">alt_route</span>
                                    <span className="text-sm font-semibold text-primary">{flow.name}</span>
                                    <span className="ml-auto rounded bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Flow</span>
                                </div>
                                <p className="text-xs text-slate-500">Configure conditions and actions in the properties panel.</p>
                            </div>
                        ))}

                        {/* Drop zone */}
                        <div className="flex cursor-pointer justify-center rounded-xl border-2 border-dashed border-primary/20 p-8 transition-all group hover:border-primary/40 hover:bg-primary/5">
                            <div className="flex flex-col items-center gap-2">
                                <span className="material-symbols-outlined text-3xl text-primary/40 transition-colors group-hover:text-primary">add_circle</span>
                                <span className="text-sm font-medium text-slate-500 group-hover:text-slate-300">Drop a component here</span>
                            </div>
                        </div>

                        {/* End Screen block */}
                        <div
                            onClick={() => { setSelectedScreen('end'); setSelectedQuestion(null); setRightPanel('properties'); }}
                            className={cn(
                                'relative group rounded-xl p-6 transition-all cursor-pointer border',
                                selectedScreen === 'end'
                                    ? 'glass-active border-primary/50 ring-4 ring-primary/10'
                                    : 'glass border-primary/10 hover:border-primary/30'
                            )}
                        >
                            <div className="absolute top-3 left-3 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                                End Screen
                            </div>
                            <div className="mt-6 space-y-2 text-center">
                                <h3 className={cn('text-xl font-bold', endScreen?.title ? 'text-white' : 'italic text-white/20')}>
                                    {(endScreen?.title as string) || 'Thank you!'}
                                </h3>
                                <p className="text-sm text-slate-500">{(endScreen?.description as string) || 'Your submission has been received.'}</p>
                            </div>
                            {endScreen?.enabled === false && (
                                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                                    <span className="text-xs font-bold uppercase tracking-widest text-white/30">Hidden</span>
                                </div>
                            )}
                        </div>

                    </div>
                </section>

                {/* ── RIGHT PANEL ── */}
                <aside className="sidebar-glass w-80 flex-shrink-0 border-l border-primary/10 flex flex-col overflow-hidden">

                    {/* ── Properties ── */}
                    {rightPanel === 'properties' && (
                        <>
                            <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 p-6">
                                <h2 className="text-sm font-bold text-white">
                                    {selectedScreen === 'welcome' ? 'Welcome Screen'
                                     : selectedScreen === 'end'   ? 'End Screen'
                                     : selectedQuestion           ? 'Field Properties'
                                     : 'Properties'}
                                </h2>
                                {selectedQuestion && (
                                    <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                                        {selectedQuestion.type}
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                                {/* Welcome Screen props */}
                                {selectedScreen === 'welcome' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">Enable Screen</p>
                                                <p className="text-[10px] text-slate-500">Show welcome screen to respondents</p>
                                            </div>
                                            <ToggleSwitch
                                                checked={welcomeScreen?.enabled !== false}
                                                onChange={v => updateWelcomeScreen({ enabled: v })}
                                            />
                                        </div>
                                        <PropInput label="Title"       value={(welcomeScreen?.title as string) || ''}       onChange={v => updateWelcomeScreen({ title: v })}       placeholder="Welcome to our form" />
                                        <PropInput label="Description" value={(welcomeScreen?.description as string) || ''} onChange={v => updateWelcomeScreen({ description: v })} placeholder="Description…"        />
                                        <PropInput label="Button Text" value={(welcomeScreen?.buttonText as string) || ''} onChange={v => updateWelcomeScreen({ buttonText: v })} placeholder="Start"               />
                                    </div>
                                )}

                                {/* End Screen props */}
                                {selectedScreen === 'end' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-primary/10 pb-4">
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">Enable Screen</p>
                                                <p className="text-[10px] text-slate-500">Show end screen after submission</p>
                                            </div>
                                            <ToggleSwitch
                                                checked={endScreen?.enabled !== false}
                                                onChange={v => updateEndScreen({ enabled: v })}
                                            />
                                        </div>
                                        <PropInput label="Title"        value={(endScreen?.title as string) || ''}       onChange={v => updateEndScreen({ title: v })}       placeholder="Thank you!"       />
                                        <PropInput label="Description"  value={(endScreen?.description as string) || ''} onChange={v => updateEndScreen({ description: v })} placeholder="Message…"          />
                                        <PropInput label="Button Text"  value={(endScreen?.buttonText as string) || ''} onChange={v => updateEndScreen({ buttonText: v })} placeholder="Submit another"   />
                                        <PropInput label="Redirect URL" value={(endScreen?.redirectUrl as string) || ''} onChange={v => updateEndScreen({ redirectUrl: v })} placeholder="https://…"      />
                                    </div>
                                )}

                                {/* Question props */}
                                {selectedQuestion && (
                                    <div className="space-y-6">
                                        <PropInput
                                            label="Field Label"
                                            value={selectedQuestion.title}
                                            onChange={v => updateQuestion(selectedQuestion.id, { title: v })}
                                            placeholder="What is your name?"
                                        />

                                        {['text','email','number','url','website','paragraph'].includes(selectedQuestion.type) && (
                                            <PropInput
                                                label="Placeholder Text"
                                                value={selectedQuestion.placeholder || ''}
                                                onChange={v => updateQuestion(selectedQuestion.id, { placeholder: v })}
                                                placeholder="e.g. John Doe"
                                            />
                                        )}

                                        <PropInput
                                            label="Description"
                                            value={selectedQuestion.description || ''}
                                            onChange={v => updateQuestion(selectedQuestion.id, { description: v })}
                                            placeholder="Help text (optional)"
                                        />

                                        {/* Required toggle */}
                                        <div className="flex items-center justify-between border-t border-primary/10 pt-4">
                                            <div>
                                                <p className="text-sm font-medium text-slate-200">Required Field</p>
                                                <p className="text-[10px] text-slate-500">Users must fill this out</p>
                                            </div>
                                            <ToggleSwitch
                                                checked={selectedQuestion.required}
                                                onChange={v => updateQuestion(selectedQuestion.id, { required: v })}
                                            />
                                        </div>

                                        {/* Validation Rules */}
                                        <div className="border-t border-primary/10 pt-4">
                                            <label className="mb-3 block text-xs font-medium text-slate-400">Validation Rules</label>
                                            <div className="space-y-2">
                                                <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/30 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/5">
                                                    <span className="material-symbols-outlined text-sm">add</span>
                                                    Add Validation
                                                </button>
                                            </div>
                                        </div>

                                        {/* Options */}
                                        {['choice','radio','checkbox','dropdown','picture-choice'].includes(selectedQuestion.type) && selectedQuestion.options && (
                                            <div className="border-t border-primary/10 pt-4">
                                                <label className="mb-3 block text-xs font-medium text-slate-400">Options</label>
                                                <OptionsEditor
                                                    options={selectedQuestion.options}
                                                    onChange={newOpts => updateQuestion(selectedQuestion.id, { options: newOpts })}
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Nothing selected */}
                                {!selectedQuestion && !selectedScreen && (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <span className="material-symbols-outlined mb-3 text-4xl text-slate-600">touch_app</span>
                                        <p className="text-sm text-slate-500">Select a field on the canvas to edit its properties</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* ── Settings ── */}
                    {rightPanel === 'settings' && (
                        <>
                            <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 p-6">
                                <h2 className="text-sm font-bold text-white">Form Settings</h2>
                                <button onClick={() => setRightPanel('properties')} className="text-slate-500 transition-colors hover:text-white">
                                    <span className="material-symbols-outlined text-xl">close</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <FormSettingsPanel settings={formSettings || {}} onChange={setFormSettings} />
                            </div>
                        </>
                    )}

                    {/* ── Share ── */}
                    {rightPanel === 'share' && (
                        <>
                            <div className="flex flex-shrink-0 items-center justify-between border-b border-primary/10 p-6">
                                <h2 className="text-sm font-bold text-white">Share & Embed</h2>
                                <button onClick={() => setRightPanel('properties')} className="text-slate-500 transition-colors hover:text-white">
                                    <span className="material-symbols-outlined text-xl">close</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {formSlug ? (
                                    <SharePanel formId={formId!} formSlug={formSlug} />
                                ) : (
                                    <div className="p-6 text-center">
                                        <p className="mb-4 text-sm text-slate-500">Save your form first to generate a share link.</p>
                                        <button onClick={() => doSave()} className="text-sm text-primary hover:underline">Save now</button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </aside>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                BOTTOM STATUS BAR
            ═══════════════════════════════════════════════════════════════ */}
            <footer className="flex h-10 flex-shrink-0 items-center justify-between border-t border-primary/10 bg-[#0B0E14] px-6 text-[10px] font-medium text-slate-500 z-50">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                        <span
                            className="material-symbols-outlined"
                            style={{ fontSize: '14px', color: lastSaved ? '#22c55e' : saving ? '#f59e0b' : '#64748b' }}
                        >
                            {saving ? 'sync' : 'check_circle'}
                        </span>
                        {lastSaved ? 'Auto-saved' : saving ? 'Saving…' : 'Unsaved changes'}
                    </span>
                    <span>{questions.length} Component{questions.length !== 1 ? 's' : ''}</span>
                    <span>{flows.length} Flow{flows.length !== 1 ? 's' : ''} Active</span>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="transition-colors hover:text-primary">← Dashboard</Link>
                    <button className="transition-colors hover:text-primary">Documentation</button>
                    <button onClick={() => setRightPanel('share')} className="transition-colors hover:text-primary">API Keys</button>
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-900 px-2 py-0.5">
                        <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>zoom_in</span>
                        <span>100%</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Purple pill toggle — matches the Stitch sample exactly */
function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={cn(
                'relative h-6 w-11 rounded-full p-1 transition-colors duration-200',
                checked ? 'bg-primary' : 'bg-slate-700'
            )}
        >
            <div className={cn(
                'h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                checked ? 'translate-x-5' : 'translate-x-0'
            )} />
        </button>
    );
}

/** Labelled text input for the properties panel */
function PropInput({
    label, value, onChange, placeholder
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="mb-2 block text-xs font-medium text-slate-400">{label}</label>
            <input
                type="text"
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-primary/10 bg-slate-900/50 px-3 py-2 text-sm text-white outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
            />
        </div>
    );
}
