import fs from 'fs';
let content = fs.readFileSync('src/components/PatternFoundations.tsx', 'utf8');

// Font replacements
content = content.replace(/font-serif/g, 'font-black');
content = content.replace(/italic text-emerald-400\/90 text-2xl mx-1.5/g, 'bg-emerald-500/10 px-2 py-0.5 rounded-md text-emerald-400');
content = content.replace(/className="text-sm font-mono opacity-90"/g, 'className="text-base sm:text-lg font-mono opacity-95"');
content = content.replace(/p-2 sm:p-4 shadow-2xl/g, 'p-4 sm:p-6 shadow-2xl');

// Add icons and store import
content = content.replace(/import { ChevronLeft } from 'lucide-react';/, "import { ChevronLeft, ExternalLink, Play } from 'lucide-react';\nimport { useStore } from '../store/useStore';");

// Inside React.FC
content = content.replace(/const { data: problemProgress } = useProblemProgress\(\);/, "const { data: problemProgress } = useProblemProgress();\n  const startSession = useStore(state => state.startSession);");

// Map loop problem action buttons
const newProblemBlock = `
                    <div className="ml-[30px] sm:ml-0 mt-4 sm:mt-0 flex items-center justify-between sm:w-auto w-full gap-4">
                      <span className={clsx(
                        "text-[10px] uppercase tracking-widest font-bold",
                        prob.difficulty === 'Easy' ? 'text-emerald-400' : 
                        prob.difficulty === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                      )}>
                        {prob.difficulty}
                      </span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={prob.leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                          title="Open on LeetCode"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={16} />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startSession({ problemId: prob.id, type: 'PRACTICE' });
                          }}
                          className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all flex items-center gap-2"
                          title="Start Session"
                        >
                          <Play size={16} />
                        </button>
                      </div>
                    </div>
`;

content = content.replace(/<div className="ml-\[30px\] sm:ml-0 mt-2 sm:mt-0 flex items-center gap-3">[\s\S]*?<\/div>\s*<\/div>\s*\);\s*}\)\}/m, newProblemBlock + `                  </div>
                );
              })}`);

fs.writeFileSync('src/components/PatternFoundations.tsx', content);
