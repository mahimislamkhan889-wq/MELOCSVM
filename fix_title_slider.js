import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const titleWordsBlock = `<div className="space-y-2">
                          <div className="flex justify-between items-center text-sm mb-1">
                            <label className="text-[#a1a1aa] font-bold text-[11px] tracking-wider">Title Words</label>
                            <span className="text-white font-mono bg-[#40414F] px-2 py-0.5 rounded text-xs">{settings.titleWords}</span>
                          </div>
                          <input 
                            type="range" min="3" max="15" 
                            value={settings.titleWords}
                            onChange={(e) => setSettings(s => ({ ...s, titleWords: parseInt(e.target.value) }))}
                            className="w-full accent-white h-1.5 bg-[#202126] rounded-lg appearance-none cursor-pointer"
                          />
                        </div>`;

const wrappedBlock = `{settings.platform !== 'shutterstock' && (
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm mb-1">
                              <label className="text-[#a1a1aa] font-bold text-[11px] tracking-wider">Title Words</label>
                              <span className="text-white font-mono bg-[#40414F] px-2 py-0.5 rounded text-xs">{settings.titleWords}</span>
                            </div>
                            <input 
                              type="range" min="3" max="15" 
                              value={settings.titleWords}
                              onChange={(e) => setSettings(s => ({ ...s, titleWords: parseInt(e.target.value) }))}
                              className="w-full accent-white h-1.5 bg-[#202126] rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        )}`;

if (content.includes(titleWordsBlock)) {
  content = content.replace(titleWordsBlock, wrappedBlock);
  fs.writeFileSync('src/App.tsx', content);
  console.log('Successfully wrapped Title Words block.');
} else {
  console.log('Failed to find Title Words block. Retrying with regex.');
  
  // Regex approach in case spacing is slightly different
  const regex = /<div className="space-y-2">\s*<div className="flex justify-between items-center text-sm mb-1">\s*<label className="text-\[#a1a1aa\] font-bold text-\[11px\] tracking-wider">Title Words<\/label>[\s\S]*?<\/div>/;
  
  if(regex.test(content)) {
    content = content.replace(regex, `{settings.platform !== 'shutterstock' && (\n$& \n)}`);
    fs.writeFileSync('src/App.tsx', content);
    console.log('Successfully wrapped Title Words block via regex.');
  } else {
    console.log('Could not find Title Words via regex either.');
  }
}
