import React from 'react';
import { motion } from 'motion/react';
import { TerminalSquare, BrainCircuit, Activity, ChevronRight, Github, Code2, Database, Network, Cpu, ListFilter, Download, CalendarDays, Layers } from 'lucide-react';
import { Logo } from './Logo';
import { BRAND } from '../constants/brand';
import { PublicHeader } from './PublicHeader';

// Illustrative examples explain recorded fields, not observed user outcomes.
const TerminalLog = () => (
    <div className="rounded-xl border border-line bg-canvas p-5 space-y-3 text-xs">
        <p className="text-subtle">Example coding record</p>
        <p className="text-body">LRU Cache · 22 min</p>
        <p className="text-accent">Tests passed · no hints · explanation clear</p>
        <p className="text-muted">One independent attempt. Delayed retention still needs another check.</p>
    </div>
);
const SpacedRepetitionVisual = () => (
    <div className="rounded-xl border border-line bg-canvas p-5 space-y-4 text-sm">
        <p className="text-subtle text-xs">Two distinct checks</p>
        <div><p className="text-accent font-semibold">Recall the approach</p><p className="text-muted mt-1">Explain from memory, then compare with a reference.</p></div>
        <div><p className="text-accent font-semibold">Implement independently</p><p className="text-muted mt-1">Code, test, and explain it after a delay. Record any hints.</p></div>
        <p className="text-xs text-subtle">Intervals respond to your recorded results; the app does not estimate when you will forget.</p>
    </div>
);
const HeatmapVisual = () => (
    <div className="rounded-xl border border-line bg-canvas p-4 h-full space-y-3">
        <p className="text-xs text-subtle">Example study minutes · one week</p>
        <div className="flex gap-2 items-end h-16" role="img" aria-label="Illustrative daily study time, not user measurements">
            {[30, 45, 0, 30, 40, 60, 30].map((minutes, i) => <div key={i} className="flex-1 bg-accent/60 rounded-t" style={{ height: `${minutes}px` }} title={`${minutes} minutes`} />)}
        </div>
        <p className="text-xs text-muted">Review minutes alongside learning outcomes.</p>
    </div>
);

// --- PRODUCT PREVIEW MOCK PANELS ---
const MockPanelChrome = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-xl border border-line/80 bg-canvas overflow-hidden h-full flex flex-col">
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line/80 bg-surface">
            <span className="text-[11px] font-medium text-body tracking-tight">{title}</span>
            <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-hover-surface" />
                <div className="w-1.5 h-1.5 rounded-full bg-hover-surface" />
            </div>
        </div>
        <div className="p-3.5 flex-1">{children}</div>
    </div>
);

const TodayPlanMock = () => (
    <MockPanelChrome title="Example daily plan">
        <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-subtle">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3 text-accent" /> 30 min budget</span>
                <span>30 min planned</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted-surface overflow-hidden">
                <div className="h-full w-full rounded-full bg-accent/80" />
            </div>
            <ul className="space-y-2 pt-1">
                {[
                    { name: 'Clone Graph', tag: 'Code · 21 min', tone: 'text-accent bg-accent/10 border-accent/20' },
                    { name: 'Course Schedule', tag: 'Recall · 3 min', tone: 'text-warning bg-warning/10 border-warning/20' },
                    { name: 'Valid Palindrome', tag: 'Recall · 3 min', tone: 'text-warning bg-warning/10 border-warning/20' },
                    { name: 'Binary Search', tag: 'Recall · 3 min', tone: 'text-warning bg-warning/10 border-warning/20' },
                ].map((row) => (
                    <li key={row.name} className="flex items-center justify-between gap-2 rounded-lg border border-line/70 bg-surface/50 px-2.5 py-2">
                        <span className="text-xs text-body truncate">{row.name}</span>
                        <span className={`shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded border ${row.tone}`}>{row.tag}</span>
                    </li>
                ))}
            </ul>
        </div>
    </MockPanelChrome>
);

const ReviewQueueMock = () => (
    <MockPanelChrome title="Example recall queue">
        <div className="space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-subtle">
                <span className="flex items-center gap-1.5"><ListFilter className="w-3 h-3 text-accent" /> Fits today</span>
                <span>3 checks</span>
            </div>
            <ul className="space-y-2">
                {[
                    { name: 'Course Schedule', due: '3 min', interval: 'Recall the approach first' },
                    { name: 'Valid Palindrome', due: '3 min', interval: 'Explain the correctness argument' },
                    { name: 'Binary Search', due: '3 min', interval: 'Identify complexity and edge cases' },
                ].map((row) => (
                    <li key={row.name} className="rounded-lg border border-line/70 bg-surface/50 px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-body truncate">{row.name}</span>
                            <span className="text-[10px] font-mono text-accent/90 shrink-0">{row.due}</span>
                        </div>
                        <div className="mt-1 text-[10px] font-mono text-subtle">{row.interval}</div>
                    </li>
                ))}
            </ul>
        </div>
    </MockPanelChrome>
);

const PatternMasteryMock = () => (
    <MockPanelChrome title="Example pattern evidence">
        <div className="space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono text-subtle">
                <span className="flex items-center gap-1.5"><Layers className="w-3 h-3 text-accent" /> Core patterns</span>
                <span>5 / 8 dependable</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted-surface overflow-hidden">
                <div className="h-full w-[62%] rounded-full bg-accent/80" />
            </div>
            <ul className="space-y-2">
                {[
                    { name: 'BFS', passed: 2, total: 3 },
                    { name: 'Topological sort', passed: 2, total: 4 },
                    { name: 'Two heaps', passed: 1, total: 1 },
                ].map((row) => (
                    <li key={row.name} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                            <span className="text-body">{row.name}</span>
                            <span className="font-mono text-subtle">{row.passed}/{row.total}</span>
                        </div>
                        <div className="h-1 rounded-full bg-muted-surface overflow-hidden">
                            <div className="h-full rounded-full bg-accent-strong/80" style={{ width: `${(row.passed / row.total) * 100}%` }} />
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    </MockPanelChrome>
);

const FeaturePanel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`rounded-xl border border-line bg-surface ${className}`}>{children}</div>
);

const LOOP_ICONS = [ListFilter, Code2, BrainCircuit] as const;

// --- MAIN PAGE COMPONENT ---
export const LandingPage = () => {
  return (
                <div
                        className="brand-shell min-h-screen text-body selection:bg-accent/30 selection:text-accent font-sans relative overflow-x-hidden"
                >
        <PublicHeader fixed />

        {/* Hero Section */}
        <section className="relative z-10 pt-36 pb-20 px-6 max-w-[52rem] mx-auto min-h-[95vh] flex flex-col justify-center gap-12">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-5 relative z-20 max-w-[34rem] mx-auto lg:mr-auto lg:ml-8 w-full"
            >
                <h1 className="text-[2.2rem] md:text-[3.35rem] font-semibold tracking-tight text-foreground leading-[1.07]">
                    {BRAND.landing.headlineTop}
                    <br />
                    <span className="bg-gradient-to-br from-accent via-accent to-accent bg-clip-text text-transparent">
                        {BRAND.landing.headlineBottom}
                    </span>
                </h1>

                <p className="max-w-md text-[15px] text-muted font-medium leading-relaxed">
                    {BRAND.landing.body}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-5">
                     <a href="/login" className="block w-full sm:w-auto">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="brand-button-primary group relative px-5 py-2.5 font-semibold rounded-lg flex items-center gap-2 w-full sm:w-auto justify-center transition-shadow"
                        >
                            <TerminalSquare className="w-4 h-4" />
                            {BRAND.landing.ctaPrimary}
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                    </a>
                    <a href="https://github.com/Alesiobarquin/LC-Tracker" target="_blank" rel="noopener noreferrer" className="brand-button-secondary group px-5 py-2.5 flex items-center justify-center gap-2.5 backdrop-blur-md rounded-lg font-medium transition-all">
                        <Github className="w-4 h-4 group-hover:text-foreground transition-colors" />
                        <span className="group-hover:text-foreground transition-colors">{BRAND.landing.ctaSecondary}</span>
                    </a>
                </div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-subtle font-mono text-xs z-10"
            >
                <span>Explore</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-subtle to-transparent overflow-hidden">
                    <motion.div
                        className="w-full h-1/2 bg-accent"
                        animate={{ y: [-24, 24] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                </div>
            </motion.div>
        </section>

        {/* Plan → Practice → Retain */}
        <section className="relative z-10 py-20 px-6 border-t border-line/50">
            <div className="max-w-[52rem] mx-auto space-y-10">
                <div className="max-w-lg space-y-2">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{BRAND.landing.loopTitle}</h2>
                    <p className="text-sm text-muted leading-relaxed">{BRAND.landing.loopBody}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    {BRAND.landing.loopSteps.map((step, index) => {
                        const Icon = LOOP_ICONS[index];
                        return (
                            <motion.div
                                key={step.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-40px' }}
                                transition={{ duration: 0.45, delay: index * 0.08 }}
                                className="rounded-xl border border-line/70 bg-canvas/70 p-5 space-y-3"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg border border-line-strong/60 bg-surface flex items-center justify-center">
                                        <Icon className="w-4 h-4 text-accent" />
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[10px] font-mono text-subtle">0{index + 1}</span>
                                        <h3 className="text-base font-semibold text-foreground tracking-tight">{step.title}</h3>
                                    </div>
                                </div>
                                <p className="text-xs text-muted leading-relaxed">{step.body}</p>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>

        {/* Product preview */}
        <section className="relative z-10 py-20 px-6 border-t border-line/50 bg-canvas/60">
            <div className="max-w-[52rem] mx-auto space-y-8">
                <div className="max-w-lg space-y-2">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{BRAND.landing.previewTitle}</h2>
                    <p className="text-sm text-muted leading-relaxed">{BRAND.landing.previewBody}</p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
                        <TodayPlanMock />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.08 }}>
                        <ReviewQueueMock />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45, delay: 0.16 }}>
                        <PatternMasteryMock />
                    </motion.div>
                </div>
            </div>
        </section>

        {/* Features Grids */}
        <section className="relative z-10 py-28 px-6 border-y border-line/50 bg-canvas/80 backdrop-blur-3xl">
            <div className="max-w-[52rem] mx-auto space-y-6 perspective-[2000px]">

                {/* Feature 1 */}
                <FeaturePanel className="p-5 md:p-7">
                    <div className="grid md:grid-cols-2 gap-7 md:gap-12 items-center">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-muted-surface border border-line-strong/50  flex items-center justify-center mb-5">
                                <BrainCircuit className="w-5 h-5 text-accent" />
                            </div>
                            <h2 className="text-xl md:text-[1.65rem] font-bold text-foreground mb-4 tracking-tight">{BRAND.landing.featuresHeadlineA}</h2>
                            <p className="text-muted text-sm leading-relaxed mb-5">
                                Recall checks and coding attempts have separate schedules. Success after a delay extends an interval; gaps in recall or implementation bring practice closer. The daily plan selects only what fits your time budget.
                            </p>
                            <a href="https://github.com/Alesiobarquin/LC-Tracker/blob/main/docs/study-strategy.md" target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-accent mb-5">Study strategy and evidence limits</a>
                            <ul className="space-y-2.5 text-xs font-mono text-subtle">
                                <li className="flex gap-3 items-center">
                                    <div className="p-1 rounded bg-accent/10 text-accent border border-accent/20">
                                        <ChevronRight className="w-3 h-3"/>
                                    </div>
                                    Separate recall and coding dates per problem
                                </li>
                                <li className="flex gap-3 items-center">
                                    <div className="p-1 rounded bg-accent/10 text-accent border border-accent/20">
                                        <ChevronRight className="w-3 h-3"/>
                                    </div>
                                    Retained implementation and unseen variations
                                </li>
                            </ul>
                        </div>
                        <div className="h-full min-h-[220px]">
                            <SpacedRepetitionVisual />
                        </div>
                    </div>
                </FeaturePanel>

                {/* Feature 2 & 3 in a grid */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Feature 2 */}
                    <FeaturePanel className="p-5 md:p-6 flex flex-col justify-between">
                        <div className="mb-7">
                            <div className="w-9 h-9 rounded-xl bg-muted-surface border border-line-strong/50  flex items-center justify-center mb-4">
                                <Activity className="w-4.5 h-4.5 text-accent" />
                            </div>
                            <h2 className="text-lg font-bold text-foreground mb-2.5 tracking-tight">{BRAND.landing.featuresHeadlineB}</h2>
                            <p className="text-muted text-xs leading-relaxed">
                                See recall outcomes, delayed independent coding, unseen variations, and recorded study minutes over the last fourteen days.
                            </p>
                        </div>
                        <div className="h-36 mt-auto">
                            <HeatmapVisual />
                        </div>
                    </FeaturePanel>

                    {/* Feature 3 */}
                    <FeaturePanel className="p-5 md:p-6 flex flex-col justify-between">
                        <div className="mb-7">
                            <div className="w-9 h-9 rounded-xl bg-muted-surface border border-line-strong/50  flex items-center justify-center mb-4">
                                <TerminalSquare className="w-4.5 h-4.5 text-accent" />
                            </div>
                            <h2 className="text-lg font-bold text-foreground mb-2.5 tracking-tight">{BRAND.landing.featuresHeadlineC}</h2>
                            <p className="text-muted text-xs leading-relaxed">
                                Record correctness, assistance, explanations, and notes. Confidence remains a self-rating, separate from coding evidence.
                            </p>
                        </div>
                        <div className="h-36 mt-auto">
                            <TerminalLog />
                        </div>
                    </FeaturePanel>
                </div>

            </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative z-10 py-28 px-6 overflow-hidden bg-surface">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-accent/10 via-canvas to-canvas pointer-events-none"></div>

            <div className="max-w-xl mx-auto text-center space-y-7 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl md:text-[2.8rem] font-semibold text-foreground tracking-tight mb-4">{BRAND.landing.finalCtaTitle}</h2>
                    <p className="text-sm text-muted max-w-lg mx-auto leading-relaxed">
                        {BRAND.landing.finalCtaBody}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="pt-8"
                >
                    <a href="/login" className="inline-block relative group">
                        <button className="brand-button-secondary relative px-7 py-3 font-semibold text-sm rounded-xl flex items-center gap-2.5 transition-all group-hover:scale-[1.02] active:scale-[0.98]">
                            <span>{BRAND.landing.finalCtaAction}</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </a>
                </motion.div>
            </div>
        </section>

        {/* Trust footer */}
        <section className="relative z-10 py-24 px-6 bg-canvas/90 border-t border-line">
            <div className="max-w-[52rem] mx-auto">
                <h2 className="text-sm font-medium text-muted mb-8 tracking-tight">{BRAND.landing.trustTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {BRAND.landing.trustItems.map((item, index) => {
                        const isGithub = item.title === 'Open source';
                        const content = (
                            <>
                                <div className="flex items-center gap-2 text-body text-sm font-medium">
                                    {index === 0 && <Download className="w-4 h-4 text-accent" />}
                                    {index === 1 && <Github className="w-4 h-4 text-accent" />}
                                    {index === 2 && <Database className="w-4 h-4 text-accent" />}
                                    {item.title}
                                </div>
                                <p className="text-xs text-subtle leading-relaxed">{item.body}</p>
                            </>
                        );

                        return (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.05 * (index + 1) }}
                                className="space-y-2 border-l border-line pl-4 py-1"
                            >
                                {isGithub ? (
                                    <a
                                        href="https://github.com/Alesiobarquin/LC-Tracker"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block space-y-2 hover:opacity-90 transition-opacity"
                                    >
                                        {content}
                                    </a>
                                ) : (
                                    content
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                <div className="mt-16 pt-8 border-t border-line flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] text-subtle uppercase tracking-wide">
                    <div className="flex items-center gap-3 opacity-80">
                        <TerminalSquare className="w-3.5 h-3.5" />
                        © 2026 {BRAND.name}
                    </div>
                    <div className="flex gap-6">
                        <a href="/privacy" className="hover:text-accent transition-colors">Privacy</a>
                        <a href="/terms" className="hover:text-accent transition-colors">Terms</a>
                        <span className="flex items-center gap-2 text-accent/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                            {BRAND.landing.footerStatus}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    </div>
  );
};

export default LandingPage;
