import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// The goal: map the hardcoded dark hex colors to dark:bg-[hex] and provide a light equivalent.
// Here are the replacements:

content = content.replace(/min-h-screen bg-\[\#383944\] text-white/g, "min-h-screen bg-slate-50 dark:bg-[#383944] text-slate-900 dark:text-white");
content = content.replace(/bg-\[\#2A2B33\] border-b border-\[\#21222A\]/g, "bg-white dark:bg-[#2A2B33] border-b border-slate-200 dark:border-[#21222A]");

// Tabs
content = content.replace(/bg-\[\#222329\] p-1 rounded-xl border border-\[\#1A1A1E\]/g, "bg-slate-100 dark:bg-[#222329] p-1 rounded-xl border border-slate-200 dark:border-[#1A1A1E]");
content = content.replace(/bg-\[\#3F404A\] text-white shadow-sm/g, "bg-white dark:bg-[#3F404A] text-slate-900 dark:text-white shadow-sm");
content = content.replace(/text-\[\#A0A1AB\] hover:text-white/g, "text-slate-500 dark:text-[#A0A1AB] hover:text-slate-900 dark:hover:text-white");

// Settings Panel
content = content.replace(/bg-\[\#31323B\] border-none rounded-2xl p-6/g, "bg-white dark:bg-[#31323B] border border-slate-200 dark:border-none rounded-2xl p-6");
content = content.replace(/"bg-\[\#424450\] border-white text-white"/g, '"bg-slate-200 dark:bg-[#424450] border-slate-300 dark:border-white text-slate-900 dark:text-white"');
content = content.replace(/"bg-\[\#202126\] border-transparent text-slate-400 hover:bg-\[\#2a2c33\]"/g, '"bg-slate-50 dark:bg-[#202126] border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2a2c33]"');
content = content.replace(/bg-\[\#40414F\] px-2 py-0\.5 text-white/g, "bg-slate-100 dark:bg-[#40414F] px-2 py-0.5 text-slate-900 dark:text-white");
content = content.replace(/accent-white h-1\.5 bg-\[\#202126\]/g, "accent-black dark:accent-white h-1.5 bg-slate-200 dark:bg-[#202126]");
content = content.replace(/bg-\[\#393A45\]/g, "bg-slate-50 dark:bg-[#393A45]");

// Upload Area
content = content.replace(/bg-\[\#2A2B33\]/g, "bg-white dark:bg-[#2A2B33]");
content = content.replace(/border-\[\#4B4C56\] hover:border-\[\#6E7182\] hover:bg-\[\#383944\]/g, "border-slate-300 dark:border-[#4B4C56] hover:border-slate-400 dark:hover:border-[#6E7182] hover:bg-slate-50 dark:hover:bg-[#383944]");
content = content.replace(/bg-\[\#40414F\] border-none p-5 rounded-3xl/g, "bg-slate-100 dark:bg-[#40414F] border border-slate-200 dark:border-none p-5 rounded-3xl");
content = content.replace(/bg-\[\#4A4B56\] text-white rounded-full/g, "bg-slate-200 dark:bg-[#4A4B56] text-slate-900 dark:text-white rounded-full");
content = content.replace(/bg-\[\#424450\] text-white text-\[10px\]/g, "bg-slate-200 dark:bg-[#424450] text-slate-900 dark:text-white text-[10px]");
content = content.replace(/bg-\[\#6E7182\] disabled:bg-\[\#6E7182\]\/50 text-white/g, "bg-black dark:bg-[#6E7182] disabled:opacity-50 dark:disabled:bg-[#6E7182]/50 text-white");

// File Listing
content = content.replace(/bg-\[\#3F404A\] flex flex-col/g, "bg-slate-50 dark:bg-[#3F404A] flex flex-col");
content = content.replace(/bg-\[\#3F404A\] border-slate-200 dark:border-white\/5 text-slate-500/g, "bg-slate-100 dark:bg-[#3F404A] border-slate-200 dark:border-white/5 text-slate-500");
content = content.replace(/bg-\[\#3F404A\] p-8/g, "bg-slate-50 dark:bg-[#3F404A] p-8");
content = content.replace(/bg-\[\#3F404A\] backdrop-blur-xl/g, "bg-white dark:bg-[#3F404A] backdrop-blur-xl");

// Modals
content = content.replace(/bg-\[\#3F404A\] backdrop-blur-3xl/g, "bg-white dark:bg-[#3F404A] backdrop-blur-3xl");

// Toggle Switch
content = content.replace(/bg-\[\#4B4C56\]/g, "bg-slate-300 dark:bg-[#4B4C56]");
content = content.replace(/bg-\[\#31323B\]/g, "bg-black dark:bg-[#31323B]");

fs.writeFileSync('src/App.tsx', content);
