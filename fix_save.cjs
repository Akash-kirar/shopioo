const fs = require('fs');
let code = fs.readFileSync('utils.ts', 'utf8');

code = code.replace(
    /await setDoc\(doc\(db, 'items', item\.id\), item\);/,
    `const cleanItem = Object.fromEntries(Object.entries(item).filter(([_, v]) => v !== undefined));\n    await setDoc(doc(db, 'items', item.id), cleanItem);`
);

fs.writeFileSync('utils.ts', code);
