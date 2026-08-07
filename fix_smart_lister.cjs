const fs = require('fs');
let code = fs.readFileSync('components/SmartLister.tsx', 'utf8');

code = code.replace(/\(async \(\) => \{[\s\S]*?\}\)\(\);/g, "");

fs.writeFileSync('components/SmartLister.tsx', code);
