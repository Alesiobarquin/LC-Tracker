const fs = require('fs');
let code = fs.readFileSync('src/components/LandingPage.tsx', 'utf8');

code = code.replace(
  "import { TerminalSquare, BrainCircuit, Activity, ChevronRight, Github, Code2, Database, Network, Cpu } from 'lucide-react';",
  "import { TerminalSquare, BrainCircuit, Activity, ChevronRight, Github, Code2, Database, Network, Cpu, ListFilter } from 'lucide-react';"
);

code = code.replace(
  '<div className="flex items-center gap-5">\n                     <a href="/login" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors relative group">\n                        Log In\n                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full"></span>\n                    </a>',
  `<div className="flex flex-wrap items-center gap-5 justify-end">
                     <a href="/library" className="hidden sm:inline-block text-xs font-medium text-zinc-400 hover:text-white transition-colors relative group">
                        Library
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full"></span>
                    </a>
                     <a href="/patterns" className="hidden sm:inline-block text-xs font-medium text-zinc-400 hover:text-white transition-colors relative group">
                        Patterns
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full"></span>
                    </a>
                     <a href="/syntax" className="hidden md:inline-block text-xs font-medium text-zinc-400 hover:text-white transition-colors relative group">
                        Syntax
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full"></span>
                    </a>
                     <a href="/login" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors relative group">
                        Log In
                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-400 transition-all group-hover:w-full"></span>
                    </a>`
);

code = code.replace(
  '<a href="https://github.com/Alesiobarquin/LC-Tracker" target="_blank" rel="noreferrer" className="brand-button-secondary group px-5 py-2.5 flex items-center justify-center gap-2.5 backdrop-blur-md rounded-lg font-medium transition-all">\n                        <Github className="w-4 h-4 group-hover:text-white transition-colors" /> \n                        <span className="group-hover:text-white transition-colors">{BRAND.landing.ctaSecondary}</span>\n                    </a>',
  `<a href="https://github.com/Alesiobarquin/LC-Tracker" target="_blank" rel="noreferrer" className="hidden sm:flex brand-button-secondary group px-5 py-2.5 items-center justify-center gap-2.5 backdrop-blur-md rounded-lg font-medium transition-all">
                        <Github className="w-4 h-4 group-hover:text-white transition-colors" /> 
                        <span className="group-hover:text-white transition-colors">{BRAND.landing.ctaSecondary}</span>
                    </a>
                    
                    <a href="/patterns" className="brand-button-secondary group px-5 py-2.5 flex items-center justify-center gap-2.5 backdrop-blur-md rounded-lg font-medium transition-all">
                        <ListFilter className="w-4 h-4 group-hover:text-white transition-colors" /> 
                        <span className="group-hover:text-white transition-colors">Explore</span>
                    </a>`
);

fs.writeFileSync('src/components/LandingPage.tsx', code);
console.log("Nav replaced successfully.");
