import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { TerminalSquare, BrainCircuit, Activity, ChevronRight, Github, Code2, Database } from 'lucide-react';

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

// --- SCRAMBLE TEXT EFFECT ---
const ScrambleText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let iteration = 0;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";
    const interval = setInterval(() => {
      setDisplayText(text.split('').map((letter, index) => {
        if(index < iteration) return text[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(''));
      
      if(iteration >= text.length){
        clearInterval(interval);
      }
      iteration += 1 / 3;
    }, 30);
    
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayText}</span>;
}

// --- TYPEWRITER TERMINAL EVENT LOG ---
const TerminalLog = () => {
    const [logs, setLogs] = useState<{text: string, type: 'info' | 'success' | 'warn' | 'error'}[]>([
        { text: '> INIT session_tracker...', type: 'info' }
    ]);
    const maxLogs = 6;

    useEffect(() => {
        const possibleLogs = [
            { text: "> SOLVED: Reverse Linked List (Easy) - 3m 12s", type: "success" },
            { text: "> RATING: OPTIMAL. Pushing review +7 days.", type: "success" },
            { text: "> FAILED: DP Edge Case detected.", type: "error" },
            { text: "> RE-SCHEDULING: 2D Matrix Search.", type: "warn" },
            { text: "> SYNCING: User Data to Cloud...", type: "info" },
            { text: "> VELOCITY: +14% compared to last week.", type: "info" }
        ];

        const intervalId = setInterval(() => {
            setLogs(prevLogs => {
                const newLog = possibleLogs[Math.floor(Math.random() * possibleLogs.length)];
                const updatedLogs = [...prevLogs, newLog as any];
                if (updatedLogs.length > maxLogs) updatedLogs.shift();
                return updatedLogs;
            });
        }, 2200);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="bg-[#0c0c0e] border border-zinc-800/80 rounded-xl p-6 font-mono text-sm shadow-2xl relative overflow-hidden h-full group">
            {/* Terminal reflection/glare effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
            
            <div className="absolute top-0 left-0 w-full h-10 bg-[#121214] border-b border-zinc-800/80 flex items-center px-4 gap-2 z-10">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                <div className="ml-auto flex gap-2">
                    <Database className="w-4 h-4 text-zinc-600" />
                    <span className="text-xs text-zinc-600">session_log.sh</span>
                </div>
            </div>
            
            <div className="mt-8 flex flex-col gap-2 relative z-0">
                {logs.map((log, i) => (
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
                    </motion.div>
                ))}
                <motion.div 
                    animate={{ opacity: [1, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-2.5 h-4 bg-emerald-500 mt-1"
                />
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

    return <span ref={ref} className="font-mono text-4xl font-bold text-white tracking-tight">{from}{suffix}</span>;
}

// --- SPACED REPETITION VISUAL ---
const SpacedRepetitionVisual = () => {
    return (
        <div className="relative h-full min-h-[250px] border border-zinc-800/80 rounded-xl bg-[#0c0c0e] p-6 overflow-hidden flex items-end">
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
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-md shadow-[0_0_20px_rgba(16,185,129,0.25)] font-mono text-sm z-10 whitespace-nowrap backdrop-blur-md"
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: [0, 1.1, 1], opacity: [0, 1, 1, 0], y: [20, 0, 0, -20] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.1, 0.8, 1], ease: "anticipate" }}
            >
                <div className="flex gap-2 items-center">
                    <Code2 className="w-4 h-4" />
                    Review: Reverse Linked List
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
        <div ref={containerRef} className="border border-zinc-800/80 rounded-xl bg-[#0c0c0e] p-6 overflow-hidden h-full flex flex-col justify-center">
            <div className="grid grid-rows-6 grid-flow-col gap-1.5 w-full justify-between overflow-hidden">
                {days.map((_, i) => {
                    const intensity = Math.random();
                     let bgClass = "bg-zinc-800/50";
                     if (intensity > 0.8) bgClass = "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]";
                     else if (intensity > 0.6) bgClass = "bg-emerald-600";
                     else if (intensity > 0.3) bgClass = "bg-emerald-900/40";

                    return (
                        <motion.div
                            key={i}
                            className={`w-3.5 h-3.5 rounded-[3px] ${bgClass}`}
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
            <div className="mt-6 flex justify-between text-xs text-zinc-500 font-mono items-center">
                <span className="flex items-center gap-1.5 border border-zinc-800 px-2 py-1 rounded bg-zinc-900/50 shadow-inner">
                    <Activity className="w-3 h-3 text-emerald-500" />
                    Current Streak: <span className="text-emerald-400 font-bold">14 Days</span>
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

// --- GLOWING SPOTLIGHT CARD ---
const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            ref={divRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setOpacity(1)}
            onMouseLeave={() => setOpacity(0)}
            className={`relative overflow-hidden rounded-2xl border border-zinc-800/60 bg-black/40 shadow-2xl transition-colors duration-500 hover:border-zinc-700/80 ${className}`}
        >
            <div
                className="pointer-events-none absolute inset-0 transition-opacity duration-500 z-0"
                style={{
                    opacity,
                    background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(16,185,129,0.06), transparent 40%)`,
                }}
            />
            <div className="relative z-10 h-full">{children}</div>
        </motion.div>
    );
}

// --- MAIN PAGE COMPONENT ---
export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 selection:bg-emerald-500/30 selection:text-emerald-100 font-sans relative overflow-x-hidden">
        <NoiseOverlay />
        <MagnetCanvas />
        
        {/* Navigation */}
        <nav className="fixed top-0 w-full z-50 border-b border-white/[0.08] backdrop-blur-xl bg-[#09090b]/60 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono font-bold text-white group cursor-pointer">
                    <div className="relative">
                        <TerminalSquare className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-emerald-400 blur-md opacity-20 group-hover:opacity-60 transition-opacity duration-300"></div>
                    </div>
                    <span className="tracking-tight text-lg">LC_TRACKER<span className="text-emerald-400 animate-pulse">_</span></span>
                </div>
                <div className="flex items-center gap-6">
                     <a href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors relative group">
                        Log In
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full"></span>
                    </a>
                     <a href="/login" className="relative group overflow-hidden px-5 py-2 text-sm font-semibold rounded bg-white text-black hover:bg-zinc-100 transition-colors">
                        <span className="relative z-10">Start Sprint</span>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    </a>
                </div>
            </div>
            {/* Scanning line indicator underneath nav */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent scale-x-0 animate-[scanline_3s_ease-in-out_infinite_alternate]"></div>
        </nav>

        {/* Hero Section */}
        <section className="relative z-10 pt-40 pb-20 px-6 max-w-5xl mx-auto min-h-[95vh] flex flex-col justify-center gap-12">
            {/* Subtle background glow for hero */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="space-y-8"
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/40 bg-[#09090b] shadow-[0_0_15px_rgba(16,185,129,0.15)] text-emerald-400 text-xs font-mono mb-4 w-fit"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    SYSTEM ONLINE / KERNEL v2.0
                </motion.div>
                
                <h1 className="text-6xl md:text-[5.5rem] font-black tracking-tighter text-white leading-[1.05]">
                    <ScrambleText text="Master Algorithms." />
                    <br />
                    <span className="text-zinc-600 inline-block drop-shadow-md">Destroy The</span>
                    <br />
                    <span className="bg-gradient-to-br from-emerald-300 via-emerald-500 to-teal-700 bg-clip-text text-transparent relative">
                        Forgetting Curve.
                        <div className="absolute -inset-2 bg-emerald-500/10 blur-2xl -z-10 rounded-full"></div>
                    </span>
                </h1>

                <p className="max-w-2xl text-xl text-zinc-400 font-medium leading-relaxed">
                    Stop grinding blindly. Track every LeetCode session, reveal your weak points, and let our spaced repetition engine schedule your reviews.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 pt-8">
                     <a href="/login" className="block w-full sm:w-auto">
                        <motion.button 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative px-8 py-4 bg-emerald-500 text-[#09090b] font-bold rounded-lg flex items-center gap-2 overflow-hidden w-full sm:w-auto justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-shadow hover:shadow-[0_0_60px_rgba(16,185,129,0.4)]"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <TerminalSquare className="w-5 h-5" />
                                Initialize Sprint
                            </span>
                            <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                            {/* Inner animated gradient line */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,transparent,rgba(255,255,255,0.3),transparent)] -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        </motion.button>
                    </a>
                    <a href="https://github.com" target="_blank" rel="noreferrer" className="group px-8 py-4 flex items-center justify-center gap-3 bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-lg font-medium text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 transition-all">
                        <Github className="w-5 h-5 group-hover:text-white transition-colors" /> 
                        <span className="group-hover:text-white transition-colors">View Architect</span>
                    </a>
                </div>
            </motion.div>
            
            {/* Scroll Indicator */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-600 font-mono text-xs"
            >
                <span>SCROLL_DOWN</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-zinc-600 to-transparent">
                    <motion.div 
                        className="w-full h-1/2 bg-emerald-500" 
                        animate={{ y: [0, 24, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    />
                </div>
            </motion.div>
        </section>

        {/* Features Grids */}
        <section className="relative z-10 py-32 px-6 border-y border-zinc-800/50 bg-[#09090b]/80 backdrop-blur-2xl">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Feature 1 */}
                <SpotlightCard className="p-8 md:p-12">
                    <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-center">
                        <div>
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-inner flex items-center justify-center mb-8 relative group">
                                <BrainCircuit className="w-7 h-7 text-emerald-400" />
                                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 tracking-tight">Automated Review Scheduling</h2>
                            <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                                Our SuperMemo-2 derived algorithm tracks your performance metrics. It autonomously schedules reviews exactly when you are about to forget them.
                            </p>
                            <ul className="space-y-4 text-sm font-mono text-zinc-500">
                                <li className="flex gap-3 items-center">
                                    <div className="p-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        <ChevronRight className="w-3 h-3"/>
                                    </div>
                                    Dynamic decay intervals computed per problem
                                </li>
                                <li className="flex gap-3 items-center">
                                    <div className="p-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                        <ChevronRight className="w-3 h-3"/>
                                    </div>
                                    Attack weaknesses, not memorized solutions
                                </li>
                            </ul>
                        </div>
                        <div className="h-full min-h-[300px]">
                            <SpacedRepetitionVisual />
                        </div>
                    </div>
                </SpotlightCard>

                {/* Feature 2 & 3 in a grid */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Feature 2 */}
                    <SpotlightCard className="p-8 md:p-10 flex flex-col justify-between">
                        <div className="mb-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-inner flex items-center justify-center mb-6">
                                <Activity className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Data-Driven Sprints</h2>
                            <p className="text-zinc-400 leading-relaxed">
                                Visualize your solve velocity. Treat tactical interview prep like a continuous production deployment schedule.
                            </p>
                        </div>
                        <div className="h-48 mt-auto">
                            <HeatmapVisual />
                        </div>
                    </SpotlightCard>

                    {/* Feature 3 */}
                    <SpotlightCard className="p-8 md:p-10 flex flex-col justify-between">
                        <div className="mb-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-inner flex items-center justify-center mb-6">
                                <TerminalSquare className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4 tracking-tight">Track Every Edge Case</h2>
                            <p className="text-zinc-400 leading-relaxed">
                                Log attempts, execution times, and time complexities. Build a personal database of solutions for immediate reference.
                            </p>
                        </div>
                        <div className="h-48 mt-auto">
                            <TerminalLog />
                        </div>
                    </SpotlightCard>
                </div>

            </div>
        </section>

        {/* Metrics Footer */}
        <section className="relative z-10 py-32 px-6 bg-zinc-950/80 border-t border-zinc-900">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="space-y-4 border-l-2 border-emerald-500/30 pl-6 bg-gradient-to-r from-emerald-500/5 to-transparent py-4 rounded-r-lg"
                    >
                        <div className="flex items-center gap-2 text-zinc-500 font-mono text-sm md:justify-start justify-center">
                            <Database className="w-4 h-4" /> Problems Indexed
                        </div>
                        <div className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                            <Counter from={0} to={1248} />
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="space-y-4 border-l-2 border-emerald-500/30 pl-6 bg-gradient-to-r from-emerald-500/5 to-transparent py-4 rounded-r-lg"
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
                        className="space-y-4 border-l-2 border-emerald-500/30 pl-6 bg-gradient-to-r from-emerald-500/5 to-transparent py-4 rounded-r-lg"
                    >
                        <div className="flex items-center gap-2 text-zinc-500 font-mono text-sm md:justify-start justify-center">
                            <Activity className="w-4 h-4" /> Active Engineers
                        </div>
                        <div className="text-white">
                            <Counter from={0} to={8500} suffix="+" />
                        </div>
                    </motion.div>
                </div>
                
                <div className="mt-32 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-mono text-zinc-600 uppercase">
                    <div className="flex items-center gap-3 opacity-80">
                        <TerminalSquare className="w-4 h-4" />
                        © 2026 LC Tracker System
                    </div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-emerald-400 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-emerald-400 transition-colors">Terms</a>
                        <a href="#" className="flex items-center gap-2 text-emerald-500/80 hover:text-emerald-400 transition-colors">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Status: Extant
                        </a>
                    </div>
                </div>
            </div>
        </section>
        
        {/* Adds keyframe definition for shimmer effects used in buttons & nav */}
        <style dangerouslySetInnerHTML={{__html: `
            @keyframes shimmer {
                100% { transform: translateX(100%); }
            }
            @keyframes scanline {
                0% { transform: scaleX(0); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: scaleX(1); opacity: 0; }
            }
        `}} />
    </div>
  );
};

export default LandingPage;