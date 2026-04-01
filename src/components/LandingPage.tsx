import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate, useMotionValue, useSpring } from 'framer-motion';
import { TerminalSquare, BrainCircuit, Activity, ChevronRight, Github, Code2, Database, Network, Cpu } from 'lucide-react';
import { Logo } from './Logo';
import { BRAND } from '../constants/brand';

// --- MAGNETIC CANVAS BACKGROUND ---
const MagnetCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    // Grid settings
    const spacing = 35;
    const mouseRadius = 250;
    const returnSpeed = 0.15;
    const pullStrength = 0.12;

    let mouse = { x: -1000, y: -1000 };

    class Particle {
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      size: number;
      baseSize: number;

      constructor(x: number, y: number) {
        this.baseX = x;
        this.baseY = y;
        this.x = x;
        this.y = y;
        this.baseSize = 1.5;
        this.size = this.baseSize;
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(16, 185, 129, ${(this.size / 6) + 0.1})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
        
        // Optional reactive connecting effect if near mouse
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < mouseRadius * 0.5) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(16, 185, 129, ${(mouseRadius * 0.5 - distance) / (mouseRadius * 0.5) * 0.3})`;
            ctx.lineWidth = 1;
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
        }
      }

      update() {
        const dx = mouse.x - this.baseX;
        const dy = mouse.y - this.baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseRadius) {
          const force = (mouseRadius - distance) / mouseRadius;
          const targetX = this.baseX + dx * force * pullStrength;
          const targetY = this.baseY + dy * force * pullStrength;
          
          this.x += (targetX - this.x) * 0.4;
          this.y += (targetY - this.y) * 0.4;
          this.size = this.baseSize + (force * 7); 
        } else {
          if (this.x !== this.baseX) {
            this.x -= (this.x - this.baseX) * returnSpeed;
          }
          if (this.y !== this.baseY) {
            this.y -= (this.y - this.baseY) * returnSpeed;
          }
           this.size = Math.max(this.baseSize, this.size - 0.2);
        }
        this.draw();
      }
    }

    const init = () => {
      particles = [];
      const cols = Math.floor(window.innerWidth / spacing);
      const rows = Math.floor(window.innerHeight / spacing);
      
      const offsetX = (window.innerWidth - cols * spacing) / 2;
      const offsetY = (window.innerHeight - rows * spacing) / 2;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          particles.push(new Particle(offsetX + i * spacing, offsetY + j * spacing));
        }
      }
    };

    const animateParams = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => p.update());
      animationFrameId = requestAnimationFrame(animateParams);
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.x;
      mouse.y = e.y;
    };
    
    const handleMouseLeave = () => {
        mouse.x = -1000;
        mouse.y = -1000;
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    
    handleResize();
    animateParams();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <canvas ref={canvasRef} className="w-full h-full opacity-40 mix-blend-screen" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#09090b_80%)]" />
    </div>
  );
};

// --- SUBTLE FILM GRAIN NOISE ---
const NoiseOverlay = () => (
    <div 
        className="pointer-events-none fixed inset-0 z-50 h-full w-full opacity-[0.03] mix-blend-difference" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
    </div>
);

// --- TYPEWRITER TERMINAL EVENT LOG ---
const TerminalLog = () => {
    const [logs, setLogs] = useState<{text: string, type: 'info' | 'success' | 'warn' | 'error'}[]>([
        { text: '> INIT local_storage_layer...', type: 'info' }
    ]);
    const maxLogs = 6;

    useEffect(() => {
        const possibleLogs = [
            { text: "> SOLVED: LRU Cache (Medium) - 12m 04s", type: "success" },
            { text: "> RATING: OPTIMAL. Pushing review +14 days.", type: "success" },
            { text: "> FAILED: Cycle detection missing.", type: "error" },
            { text: "> COMPILING: syntax_tree.ast...", type: "info" },
            { text: "> RE-SCHEDULING: Graph Traversal.", type: "warn" },
            { text: "> SYNC: 100% Data integrity verified.", type: "info" },
            { text: "> VELOCITY: +22% compared to average.", type: "success" }
        ];

        let intervalId = setInterval(() => {
            setLogs(prevLogs => {
                const newLog = possibleLogs[Math.floor(Math.random() * possibleLogs.length)];
                const updatedLogs = [...prevLogs, newLog as any];
                if (updatedLogs.length > maxLogs) updatedLogs.shift();
                return updatedLogs;
            });
        }, 2500);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="bg-[#0a0a0c] border border-zinc-800/80 rounded-xl p-5 font-mono text-xs sm:text-sm shadow-2xl relative overflow-hidden h-full group">
            {/* Terminal reflection/glare effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
            
            <div className="absolute top-0 left-0 w-full h-9 bg-[#121214] border-b border-zinc-800/80 flex items-center px-3 gap-2 z-10">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                <div className="ml-auto flex gap-2">
                    <Database className="w-4 h-4 text-zinc-600" />
                    <span className="text-xs text-zinc-600">session_log.sh</span>
                </div>
            </div>
            
            <div className="mt-7 flex flex-col gap-1.5 relative z-0">
                {logs.map((log, i) => {
                    const isLast = i === logs.length - 1;
                    return (
                        <motion.div 
                            key={i + log.text} 
                            initial={{ opacity: 0, x: -10 }} 
                            animate={{ opacity: 1, x: 0 }}
                            className={`
                                ${log.type === 'error' ? 'text-red-400' : ''}
                                ${log.type === 'success' ? 'text-emerald-400' : ''}
                                ${log.type === 'warn' ? 'text-yellow-400' : ''}
                                ${log.type === 'info' ? 'text-zinc-400' : ''}
                            `}
                        >
                            {log.text}
                            {/* Blinking cursor only on the most recent log */}
                            {isLast && (
                                <motion.span 
                                    animate={{ opacity: [1, 0] }} 
                                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                                    className="inline-block w-2 h-3.5 bg-emerald-500 ml-2 align-middle -translate-y-[1px]"
                                />
                            )}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
}

// --- COUNT UP METRIC ---
const Counter = ({ from, to, suffix = "", duration = 2 }: { from: number, to: number, suffix?: string, duration?: number }) => {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });

    useEffect(() => {
        if (!inView || !ref.current) return;
        const controls = animate(from, to, {
            duration: duration,
            onUpdate(value) {
                if(ref.current) {
                   ref.current.textContent = value.toFixed(0) + suffix;
                }
            },
        });
        return controls.stop;
    }, [from, to, inView, duration, suffix]);

    return <span ref={ref} className="font-mono text-3xl font-bold text-white tracking-tight">{from}{suffix}</span>;
}

// --- SPACED REPETITION VISUAL ---
const SpacedRepetitionVisual = () => {
    return (
        <div className="relative h-full min-h-[200px] border border-zinc-800/80 rounded-xl bg-[#0a0a0c] p-5 overflow-hidden flex items-end">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            
            {/* Mock Graph Line */}
            <svg className="absolute inset-0 w-full h-full text-emerald-500/40 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" preserveAspectRatio="none">
                 <motion.path 
                    d="M 0 50 Q 100 200 200 220" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                 />
                 <motion.path 
                    d="M 200 220 L 200 20 C 300 100 400 150 500 170" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3"
                    strokeDasharray="4 4"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, delay: 1, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
                 />
            </svg>
            
            {/* Flashcard Pop */}
            <motion.div 
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-emerald-500/50 text-emerald-400 px-3 py-1.5 rounded-md shadow-[0_0_30px_rgba(16,185,129,0.25)] font-mono text-xs z-10 whitespace-nowrap backdrop-blur-md"
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: [0, 1.1, 1], opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.8, 1], ease: "anticipate" }}
            >
                <div className="flex gap-2 items-center">
                    <Code2 className="w-3.5 h-3.5" />
                    Review: Topological Sort
                </div>
            </motion.div>
        </div>
    )
}

// --- HEATMAP MAP VISUAL ---
const HeatmapVisual = () => {
    const containerRef = useRef(null);
    const inView = useInView(containerRef, { once: true, margin: "-50px" });

    const cols = 22;
    const rows = 6;
    const days = Array.from({ length: cols * rows });

    return (
        <div ref={containerRef} className="border border-zinc-800/80 rounded-xl bg-[#0a0a0c] p-5 overflow-hidden h-full flex flex-col justify-center relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/10 blur-[60px] pointer-events-none"></div>
            
            <div className="grid grid-rows-6 grid-flow-col gap-1 w-full justify-between overflow-hidden relative z-10">
                {days.map((_, i) => {
                    const intensity = Math.random();
                     let bgClass = "bg-zinc-800/50";
                     if (intensity > 0.8) bgClass = "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]";
                     else if (intensity > 0.6) bgClass = "bg-emerald-600";
                     else if (intensity > 0.3) bgClass = "bg-emerald-900/40";

                    return (
                        <motion.div
                            key={i}
                            className={`w-3 h-3 rounded-[2px] ${bgClass}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
                            transition={{ 
                                duration: 0.4, 
                                type: "spring",
                                bounce: 0.5,
                                delay: (Math.floor(i / rows) * 0.03) + ((i % rows) * 0.015) 
                            }}
                        />
                    )
                })}
            </div>
            <div className="mt-4 flex justify-between text-[10px] text-zinc-500 font-mono items-center relative z-10">
                <span className="flex items-center gap-1.5 border border-zinc-800 px-2 py-1 rounded bg-zinc-900/80 shadow-inner">
                    <Activity className="w-3 h-3 text-emerald-500" />
                    Sprint Streak: <span className="text-emerald-400 font-bold">14 Days</span>
                </span>
                <span className="flex gap-1.5 items-center">
                    Less 
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-zinc-800/50 shadow-inner"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-900/40"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600"></div>
                    <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400"></div> 
                    More
                </span>
            </div>
        </div>
    )
}

// --- GLOWING SPOTLIGHT CARD WITH 3D TILT ---
const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const springX = useSpring(rotateX, { stiffness: 300, damping: 30, mass: 0.8 });
    const springY = useSpring(rotateY, { stiffness: 300, damping: 30, mass: 0.8 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setPosition({ x, y });

        // Calculate 3D tilt
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        rotateX.set((y - centerY) / -30); // Negative to tilt towards mouse
        rotateY.set((x - centerX) / 30);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
        rotateX.set(0);
        rotateY.set(0);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            style={{
                rotateX: springX,
                rotateY: springY,
                transformStyle: "preserve-3d",
                perspective: 1000
            }}
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-[#0a0a0c]/80 shadow-2xl transition-colors duration-500 hover:border-zinc-700/80 ${className}`}
        >
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-500 z-0"
                style={{
                    opacity,
                    background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(16,185,129,0.06), transparent 40%)`,
                }}
            />
            {/* The content container translated up in Z space slightly for depth */}
            <div className="relative z-10 h-full" style={{ transform: "translateZ(30px)" }}>
                {children}
            </div>
        </motion.div>
    );
}

// --- FLOATING HERO BADGES ---
const FloatingBadge = ({ text, icon: Icon, top, left, delay }: { text: string, icon: any, top: string, left: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: [0.2, 0.5, 0.2], y: [0, -15, 0] }}
        transition={{ 
            opacity: { duration: 4, repeat: Infinity, delay }, 
            y: { duration: 6, repeat: Infinity, delay, ease: "easeInOut" } 
        }}
        className="absolute hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-800 bg-black/40 backdrop-blur-md text-zinc-500 font-mono text-[10px] shadow-xl pointer-events-none"
        style={{ top, left }}
    >
        <Icon className="w-2.5 h-2.5 text-emerald-500/50" />
        {text}
    </motion.div>
);

// --- MAIN PAGE COMPONENT ---
export const LandingPage = () => {
  return (
                <div
                        className="brand-shell min-h-screen text-zinc-200 selection:bg-emerald-500/30 selection:text-emerald-100 font-sans relative overflow-x-hidden"
                        style={{ fontFamily: '"Plus Jakarta Sans", "Avenir Next", "Segoe UI", ui-sans-serif, system-ui, sans-serif' }}
                >
        <NoiseOverlay />
        <MagnetCanvas />
        
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/[0.08] backdrop-blur-xl bg-[#09090b]/60 transition-all duration-300">
            <div className="max-w-[52rem] mx-auto px-6 h-14 flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-white group cursor-pointer">
                    <motion.div
                        animate={{ y: [0, -1.5, 0] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                        className="relative"
                    >
                        <Logo className="text-emerald-400 group-hover:scale-110 transition-transform duration-300" size={18} />
                        <div className="absolute inset-0 bg-emerald-400 blur-[8px] opacity-15 group-hover:opacity-45 transition-opacity duration-300"></div>
                    </motion.div>
                    <span className="tracking-tight text-base">{BRAND.name}</span>
                </div>
                <div className="flex items-center gap-5">
                     <a href="/login" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors relative group">
                        Log In
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full"></span>
                    </a>
                     <a href="/login" className="brand-button-primary relative group overflow-hidden px-4 py-1.5 text-xs font-semibold rounded transition-colors">
                        <span className="relative z-10">{BRAND.landing.ctaPrimary}</span>
                        <div className="absolute inset-0 -translate-x-[150%] skew-x-[-20deg] bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    </a>
                </div>
            </div>
            {/* Scanning line indicator underneath nav */}
            <div className="brand-scanline"></div>
        </nav>

        {/* Hero Section */}
        <section className="relative z-10 pt-36 pb-20 px-6 max-w-[52rem] mx-auto min-h-[95vh] flex flex-col justify-center gap-12">
            
            {/* Floating Context Badges */}
            <div className="absolute inset-0 pointer-events-none overflow-visible">
                <FloatingBadge icon={Network} text={BRAND.landing.badges[0]} top="25%" left="-5%" delay={0} />
                <FloatingBadge icon={Cpu} text={BRAND.landing.badges[1]} top="70%" left="90%" delay={1.5} />
                <FloatingBadge icon={Database} text={BRAND.landing.badges[2]} top="35%" left="85%" delay={0.8} />
                <FloatingBadge icon={BrainCircuit} text={BRAND.landing.badges[3]} top="80%" left="10%" delay={2.2} />
            </div>

            {/* Subtle background glow for hero */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[620px] h-[400px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-5 relative z-20 max-w-[34rem] mx-auto lg:mr-auto lg:ml-8 w-full"
            >
                <h1 className="text-[2.2rem] md:text-[3.35rem] font-black tracking-tight text-white leading-[1.07]">
                    {BRAND.landing.headlineTop}
                    <br />
                    <span className="bg-gradient-to-br from-emerald-200 via-emerald-400 to-teal-500 bg-clip-text text-transparent relative">
                        {BRAND.landing.headlineBottom}
                        <div className="absolute -inset-2 bg-emerald-500/10 blur-[40px] -z-10 rounded-full"></div>
                    </span>
                </h1>

                <p className="max-w-md text-[15px] text-zinc-400 font-medium leading-relaxed">
                    {BRAND.landing.body}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-5">
                     <a href="/login" className="block w-full sm:w-auto">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="brand-button-primary group relative px-5 py-2.5 font-semibold rounded-lg flex items-center gap-2 overflow-hidden w-full sm:w-auto justify-center transition-shadow"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <TerminalSquare className="w-4 h-4" />
                                {BRAND.landing.ctaPrimary}
                            </span>
                            <ChevronRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.3),transparent)] -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        </motion.button>
                    </a>
                    <a href="https://github.com/Alesiobarquin/LC-Tracker" target="_blank" rel="noreferrer" className="brand-button-secondary group px-5 py-2.5 flex items-center justify-center gap-2.5 backdrop-blur-md rounded-lg font-medium transition-all">
                        <Github className="w-4 h-4 group-hover:text-white transition-colors" /> 
                        <span className="group-hover:text-white transition-colors">{BRAND.landing.ctaSecondary}</span>
                    </a>
                </div>
            </motion.div>
            
            {/* Scroll Indicator */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600 font-mono text-xs z-10"
            >
                <span>Explore</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-zinc-600 to-transparent overflow-hidden">
                    <motion.div 
                        className="w-full h-1/2 bg-emerald-500" 
                        animate={{ y: [-24, 24] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                </div>
            </motion.div>
        </section>

        {/* Features Grids */}
        <section className="relative z-10 py-28 px-6 border-y border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-3xl">
            <div className="max-w-[52rem] mx-auto space-y-6 perspective-[2000px]">
                
                {/* Feature 1 */}
                <SpotlightCard className="p-5 md:p-7">
                    <div className="grid md:grid-cols-2 gap-7 md:gap-12 items-center">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-inner flex items-center justify-center mb-5 relative group">
                                <BrainCircuit className="w-5 h-5 text-emerald-400" />
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <h2 className="text-xl md:text-[1.65rem] font-bold text-white mb-4 tracking-tight">{BRAND.landing.featuresHeadlineA}</h2>
                            <p className="text-zinc-400 text-sm leading-relaxed mb-5">
                                Our SuperMemo-2 derived algorithm tracks your performance metrics. It autonomously schedules reviews exactly when you are about to forget them.
                            </p>
                            <ul className="space-y-2.5 text-xs font-mono text-zinc-500">
                                <li className="flex gap-3 items-center">
                                    <div className="p-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                                        <ChevronRight className="w-3 h-3"/>
                                    </div>
                                    Dynamic decay intervals computed per problem
                                </li>
                                <li className="flex gap-3 items-center">
                                    <div className="p-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                                        <ChevronRight className="w-3 h-3"/>
                                    </div>
                                    Attack weaknesses, not memorized solutions
                                </li>
                            </ul>
                        </div>
                        <div className="h-full min-h-[220px]">
                            <SpacedRepetitionVisual />
                        </div>
                    </div>
                </SpotlightCard>

                {/* Feature 2 & 3 in a grid */}
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Feature 2 */}
                    <SpotlightCard className="p-5 md:p-6 flex flex-col justify-between">
                        <div className="mb-7">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-inner flex items-center justify-center mb-4 relative group">
                                <Activity className="w-4.5 h-4.5 text-emerald-400" />
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2.5 tracking-tight">{BRAND.landing.featuresHeadlineB}</h2>
                            <p className="text-zinc-400 text-xs leading-relaxed">
                                Visualize your solve velocity. Treat tactical interview prep like a continuous production deployment schedule.
                            </p>
                        </div>
                        <div className="h-36 mt-auto">
                            <HeatmapVisual />
                        </div>
                    </SpotlightCard>

                    {/* Feature 3 */}
                    <SpotlightCard className="p-5 md:p-6 flex flex-col justify-between">
                        <div className="mb-7">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-inner flex items-center justify-center mb-4 relative group">
                                <TerminalSquare className="w-4.5 h-4.5 text-emerald-400" />
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <h2 className="text-lg font-bold text-white mb-2.5 tracking-tight">{BRAND.landing.featuresHeadlineC}</h2>
                            <p className="text-zinc-400 text-xs leading-relaxed">
                                Log attempts, execution times, and time complexities. Build a personal database of solutions for immediate reference.
                            </p>
                        </div>
                        <div className="h-36 mt-auto">
                            <TerminalLog />
                        </div>
                    </SpotlightCard>
                </div>

            </div>
        </section>

        {/* Massive Final CTA Section */}
        <section className="relative z-10 py-28 px-6 overflow-hidden bg-black">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#09090b] to-[#09090b] pointer-events-none"></div>
            
            {/* Ambient abstract shapes */}
             <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none"></div>
             <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-teal-500/5 blur-[150px] rounded-full pointer-events-none"></div>

            <div className="max-w-xl mx-auto text-center space-y-7 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl md:text-[2.8rem] font-black text-white tracking-tight mb-4">{BRAND.landing.finalCtaTitle}</h2>
                    <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
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
                        {/* Huge glow matching button curve */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-25 group-hover:opacity-70 transition duration-500 group-hover:duration-200"></div>
                        <button className="brand-button-secondary relative px-7 py-3 font-semibold text-sm rounded-xl flex items-center gap-2.5 overflow-hidden shadow-2xl transition-all group-hover:scale-[1.02] active:scale-[0.98]">
                            <span>{BRAND.landing.finalCtaAction}</span>
                            <ChevronRight className="w-4 h-4" />
                            {/* Matrix shine effect */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(16,185,129,0.2),transparent)] -translate-x-[150%] skew-x-[-20deg] group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        </button>
                    </a>
                </motion.div>
            </div>
        </section>

        {/* Metrics Footer */}
        <section className="relative z-10 py-24 px-6 bg-zinc-950/90 border-t border-zinc-900">
            <div className="max-w-[52rem] mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="space-y-3 border-l-2 border-emerald-500/30 pl-4 bg-gradient-to-r from-emerald-500/5 to-transparent py-3 rounded-r-lg"
                    >
                        <div className="flex items-center gap-2 text-zinc-500 font-mono text-sm md:justify-start justify-center">
                            <Database className="w-4 h-4" /> Problems Indexed
                        </div>
                        <div className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                            <Counter from={0} to={3300} suffix="+" />
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="space-y-3 border-l-2 border-emerald-500/30 pl-4 bg-gradient-to-r from-emerald-500/5 to-transparent py-3 rounded-r-lg"
                    >
                        <div className="flex items-center gap-2 text-zinc-500 font-mono text-sm md:justify-start justify-center">
                            <BrainCircuit className="w-4 h-4" /> Retention Rate
                        </div>
                        <div className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                            <Counter from={0} to={94} suffix="%" />
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 }}
                        className="space-y-3 border-l-2 border-emerald-500/30 pl-4 bg-gradient-to-r from-emerald-500/5 to-transparent py-3 rounded-r-lg"
                    >
                        <div className="flex items-center gap-2 text-zinc-500 font-mono text-sm md:justify-start justify-center">
                            <Activity className="w-4 h-4" /> Active Engineers
                        </div>
                        <div className="text-white">
                            <Counter from={0} to={8500} suffix="+" />
                        </div>
                    </motion.div>
                </div>
                
                <div className="mt-16 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] text-zinc-600 uppercase tracking-wide">
                    <div className="flex items-center gap-3 opacity-80">
                        <TerminalSquare className="w-3.5 h-3.5" />
                        © 2026 {BRAND.name}
                    </div>
                    <div className="flex gap-6">
                        <a href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy</a>
                        <a href="/terms" className="hover:text-emerald-400 transition-colors">Terms</a>
                        <span className="flex items-center gap-2 text-emerald-500/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
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