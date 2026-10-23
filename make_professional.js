import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Typography smoothing: Reduce "black" font weight to "bold" or "semibold" for elegance
content = content.replace(/font-black/g, "font-bold");
content = content.replace(/font-serif/g, "font-display");

// 2. Fix duplicated dark borders from previous bad regex
content = content.replace(/dark:border-slate-200 dark:border-white\/10/g, "dark:border-white/10");
content = content.replace(/dark:border-slate-200 dark:border-\[\#1A1A1E\]/g, "dark:border-[#1A1A1E]");
content = content.replace(/dark:border-slate-200 dark:border-\[\#21222A\]/g, "dark:border-[#21222A]");
content = content.replace(/dark:border-slate-200 dark:border-none/g, "dark:border-transparent");

// 3. Smooth out drop shadows and corner radius (12-16px max for non-pills)
// rounded-3xl (24px) -> rounded-2xl (16px) for cards, to avoid "AI slop" excessive roundness
content = content.replace(/rounded-3xl/g, "rounded-2xl");

// 4. Buttons that use px-6 py-2.5 and active:scale-95 can look a bit bouncy/toy-like, let's keep them but refine the background.
// "bg-black dark:bg-[#31323B] text-white dark:text-black" wait dark:text-black on #31323B (which is dark gray) will be illegible!
content = content.replace(/dark:bg-\[\#31323B\] text-white dark:text-black/g, "dark:bg-[#31323B] text-white dark:text-white");
// Actually, earlier the user might have used light text on that dark button. Let's make sure it's dark:text-white.

// 5. Flatten the nested container borders (glass-panel inside glass)
content = content.replace(/shadow-2xl/g, "shadow-xl");
content = content.replace(/shadow-lg/g, "shadow-md");

fs.writeFileSync('src/App.tsx', content);
