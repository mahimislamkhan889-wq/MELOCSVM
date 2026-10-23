import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Global backgrounds & texts
content = content.replace(/min-h-screen bg-\[\#383944\] text-white/g, "min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white");
content = content.replace(/bg-\[\#2A2B33\] border-b border-\[\#21222A\]/g, "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800");

// Tabs
content = content.replace(/bg-\[\#222329\] p-1 rounded-xl border border-\[\#1A1A1E\]/g, "bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700");
content = content.replace(/bg-\[\#3F404A\] text-white shadow-sm/g, "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm");
content = content.replace(/text-\[\#A0A1AB\] hover:text-white/g, "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white");

// Settings Panel
content = content.replace(/bg-\[\#31323B\] border-none rounded-2xl p-6/g, "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6");
content = content.replace(/"bg-\[\#424450\] border-white text-white"/g, '"bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"');
content = content.replace(/"bg-\[\#202126\] border-transparent text-slate-400 hover:bg-\[\#2a2c33\]"/g, '"bg-slate-50 dark:bg-slate-900/50 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"');
content = content.replace(/bg-\[\#40414F\] px-2 py-0\.5/g, "bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-slate-900 dark:text-white");
content = content.replace(/accent-white h-1\.5 bg-\[\#202126\]/g, "accent-black dark:accent-white h-1.5 bg-slate-200 dark:bg-slate-700");
content = content.replace(/bg-\[\#393A45\]/g, "bg-slate-50 dark:bg-slate-800/50");

// Upload Area
content = content.replace(/bg-\[\#2A2B33\]/g, "bg-white dark:bg-slate-900");
content = content.replace(/border-\[\#4B4C56\] hover:border-\[\#6E7182\] hover:bg-\[\#383944\]/g, "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50");
content = content.replace(/bg-\[\#40414F\] border-none p-5 rounded-3xl/g, "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-3xl");
content = content.replace(/bg-\[\#4A4B56\] text-white rounded-full/g, "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-full");
content = content.replace(/bg-\[\#424450\] text-white text-\[10px\]/g, "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white text-[10px]");
content = content.replace(/bg-\[\#6E7182\] disabled:bg-\[\#6E7182\]\/50 text-white/g, "bg-black dark:bg-white disabled:opacity-50 text-white dark:text-black");

// File Listing
content = content.replace(/bg-\[\#3F404A\] flex flex-col/g, "bg-slate-50 dark:bg-slate-900/50 flex flex-col");
content = content.replace(/bg-\[\#3F404A\] border-slate-200 dark:border-white\/5 text-slate-500/g, "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-white/5 text-slate-500");
content = content.replace(/bg-\[\#3F404A\] p-8/g, "bg-slate-50 dark:bg-slate-900 p-8");
content = content.replace(/bg-\[\#3F404A\] backdrop-blur-xl/g, "bg-white dark:bg-slate-800 backdrop-blur-xl");

// Modals
content = content.replace(/bg-\[\#3F404A\] backdrop-blur-3xl/g, "bg-white dark:bg-slate-900 backdrop-blur-3xl");
content = content.replace(/bg-slate-50 dark:bg-\[\#1A1B23\]/g, "bg-slate-50 dark:bg-slate-900/50");
content = content.replace(/bg-slate-100 dark:bg-\[\#252630\]/g, "bg-slate-100 dark:bg-slate-800");

// Toggle Switch
content = content.replace(/bg-\[\#4B4C56\]/g, "bg-slate-300 dark:bg-slate-600");
content = content.replace(/bg-\[\#31323B\]/g, "bg-black dark:bg-white");

fs.writeFileSync('src/App.tsx', content);
