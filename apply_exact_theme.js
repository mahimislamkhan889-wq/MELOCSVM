import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove background blobs
content = content.replace(/\{\/\* Background Blobs for Glassmorphism Effect \*\/\}.*?<\/div>\s*<\/div>\s*<\/div>/s, '');

// 2. Set exact colors for the main layout
content = content.replace(/className="min-h-screen[^"]*"/, 'className="min-h-screen bg-[#3B3C46] text-white font-sans selection:bg-white/30 relative overflow-hidden"');

// 3. Header
content = content.replace(/<header className="border-b[^"]*"/, '<header className="bg-[#2D2E36] border-b border-[#21222A] sticky top-0 z-50 shadow-sm"');

// 4. Header Logo
content = content.replace(/<div className="bg-black dark:bg-white p-1\.5 rounded-lg text-white dark:text-black shadow-md">/, '<div className="bg-white p-1.5 rounded-lg text-black shadow-md">');

// 5. Header Center Buttons (Metadata / Image to Prompt)
content = content.replace(/bg-neutral-100\/50 dark:bg-neutral-900\/50 p-1 rounded-xl border border-neutral-200 dark:border-white\/5/, 'bg-[#222329] p-1 rounded-xl border border-[#1A1A1E]');
// Fix active tab style
content = content.replace(/tab === 'metadata' \? "bg-black\/10 dark:bg-white\/10 dark:bg-neutral-900\/20 dark:bg-white\/20 text-black dark:text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-black dark:text-white hover:bg-neutral-100 dark:bg-white\/5"/g, "tab === 'metadata' ? 'bg-[#3F404A] text-white shadow-sm' : 'text-[#A0A1AB] hover:text-white'");
content = content.replace(/tab === 'admin' \? "bg-black\/10 dark:bg-white\/10 dark:bg-neutral-900\/20 dark:bg-white\/20 text-black dark:text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-black dark:text-white hover:bg-neutral-100 dark:bg-white\/5"/g, "tab === 'admin' ? 'bg-[#3F404A] text-white shadow-sm' : 'text-[#A0A1AB] hover:text-white'");
content = content.replace(/tab === 'builder' \? "bg-black\/10 dark:bg-white\/10 dark:bg-neutral-900\/20 dark:bg-white\/20 text-black dark:text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-black dark:text-white hover:bg-neutral-100 dark:bg-white\/5"/g, "tab === 'builder' ? 'bg-[#3F404A] text-white shadow-sm' : 'text-[#A0A1AB] hover:text-white'");
content = content.replace(/tab === 'prompt' \? "bg-black\/10 dark:bg-white\/10 dark:bg-neutral-900\/20 dark:bg-white\/20 text-black dark:text-white shadow-md" : "text-slate-500 dark:text-slate-400 hover:text-black dark:text-white hover:bg-neutral-100 dark:bg-white\/5"/g, "tab === 'prompt' ? 'bg-[#3F404A] text-white shadow-sm' : 'text-[#A0A1AB] hover:text-white'");

// 6. Header Theme Toggle
content = content.replace(/bg-slate-200\/70 dark:bg-slate-900 border border-slate-300 dark:border-white\/10/, 'bg-[#1C1D22] border border-[#111114]');
content = content.replace(/bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-white\/10/, 'bg-[#2D2E36] shadow-sm border border-[#40414F]');

// 7. Login Button
content = content.replace(/bg-white text-slate-900 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"/g, 'bg-white text-black rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"');

// 8. Left Column Card
content = content.replace(/<div className="bg-\[\#2D2E36\] dark:bg-\[\#2D2E36\] border-none rounded-2xl p-6 shadow-sm">/, '<div className="bg-[#31323B] border-none rounded-2xl p-6 shadow-sm">');
// Re-replace modifiers text
content = content.replace(/text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs/g, 'text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]');

// 9. Dropzone Area
content = content.replace(/bg-white\/40 dark:bg-slate-900\/40 backdrop-blur-3xl border border-slate-200 dark:border-white\/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden/g, 'bg-[#31323B] border border-[#21222A] rounded-3xl p-8 relative overflow-hidden');
content = content.replace(/border-slate-800 hover:border-slate-700 hover:bg-white\/50 dark:bg-slate-900\/50 p-12/g, 'border-[#1C1D22] hover:border-[#4B4C56] hover:bg-[#383944] p-12');
content = content.replace(/bg-white\/30 dark:bg-slate-900\/30/g, 'bg-[#2A2B33]'); // dropzone inner
content = content.replace(/bg-slate-100\/40 dark:bg-slate-900\/40/g, 'bg-[#3F404A]'); // upload buttons
content = content.replace(/text-slate-700 dark:text-slate-300/g, 'text-white');

// Modifiers Toggle Track
content = content.replace(/checked \? "bg-black dark:bg-white" : "bg-slate-700"/g, 'checked ? "bg-white" : "bg-[#4B4C56]"');
content = content.replace(/checked \? "translate-x-5 shadow-sm" : "translate-x-0"/g, 'checked ? "translate-x-5 shadow-sm bg-[#31323B]" : "translate-x-0 bg-white"'); // Wait, thumb should be white on both? The screenshot shows white thumb always.
content = content.replace(/<span className={cn\(\s*"absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-300 ease-in-out",/g, '<span className={cn(\n            "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-300 ease-in-out",\n            checked ? "bg-[#31323B]" : "bg-white",');

// Ensure Left Column border is correct
content = content.replace(/<div className="space-y-3 border-t border-slate-200 dark:border-white\/5 pt-5">/g, '<div className="space-y-3 border-t border-white/5 pt-5">');

// Add API Key styling
content = content.replace(/<button onClick=\{\(\) => setSettings\(s => \(\{ \.\.\.s, showApiConfig: \!s\.showApiConfig \}\)\)\}.*?<\/button>/s, `<button onClick={() => setSettings(s => ({ ...s, showApiConfig: !s.showApiConfig }))} className="w-full flex items-center justify-between py-3 px-4 bg-[#393A45] hover:bg-[#40414F] text-white rounded-xl transition-all border border-[#21222A]">
                        <span className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold"><Key size={14} /> ADD API KEY</span>
                        <ChevronDown size={16} />
                      </button>`);
                      
// Upload Dropzone Header text
content = content.replace(/<h3 className="text-xl font-medium text-white tracking-tight">\s*Drag & drop files here, or <span className="border-b border-slate-400 pb-0.5">browse<\/span>\s*<\/h3>/g, '<h3 className="text-[17px] font-medium text-white tracking-tight">\n                    Drag & drop files here, or <span className="border-b border-slate-400 pb-0.5">browse</span>\n                  </h3>');
content = content.replace(/<p className="text-sm text-slate-500 dark:text-slate-400 mt-3 text-center font-medium">\s*Supports image, video, SVG, EPS & AI • Unlimited files\s*<\/p>/g, '<p className="text-[13px] text-[#A0A1AB] mt-3 text-center font-medium">\n                    Supports image, video, SVG, EPS & AI • Unlimited files\n                  </p>');

// Upload buttons icons
content = content.replace(/<span className="px-4 py-2 bg-slate-100\/40 dark:bg-slate-900\/40 backdrop-blur-xl text-black dark:text-white rounded-full font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-slate-200 dark:border-white\/5">/g, '<span className="px-4 py-2 bg-[#424450] text-white rounded-full font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 border border-[#21222A]">');

// Remove extra opacity classes
content = content.replace(/opacity-90/g, '');
content = content.replace(/className="text-white "/g, 'className="text-white"');

fs.writeFileSync('src/App.tsx', content);
