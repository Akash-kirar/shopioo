const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf8');

// find the index of "/** * Enhances"
const idx = code.indexOf('/**\n * Enhances');
if (idx !== -1) {
    code = code.substring(0, idx);
}
fs.writeFileSync('services/geminiService.ts', code);
