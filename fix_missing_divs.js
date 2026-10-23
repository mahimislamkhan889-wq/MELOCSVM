import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `                  </div>
                </div>
              </div>
            </div>
          </div>

{/* Right Column: Upload & Results */}`;

content = content.replace(/                <\/div>\n\{\/\* Right Column: Upload & Results \*\/\}/, replacement);
fs.writeFileSync('src/App.tsx', content);

