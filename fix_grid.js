import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Remove one `</div>` before the Right Column
content = content.replace(/                  <\/div>\n                  <\/div>\n                <\/div>\n              <\/div>\n            <\/div>\n          <\/div>\n\n\{\/\* Right Column: Upload & Results \*\/\}/, '                  </div>\n                </div>\n              </div>\n            </div>\n          </div>\n\n{/* Right Column: Upload & Results */}');

// Add one `</div>` before `</main>`
content = content.replace(/<\/div><\/div><\/main>/, '</div></div></div></main>');

fs.writeFileSync('src/App.tsx', content);
