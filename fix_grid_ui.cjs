const fs = require('fs');
let code = fs.readFileSync('components/ProductGrid.tsx', 'utf8');

code = code.replace(
    /\{showDistance && displayDistance !== undefined \? \([\s\S]*?\)\} : \([\s\S]*?\)\}/m,
    `<span className="text-xs font-bold text-[#a82283] tracking-tight">{displayDistance !== undefined ? \`\${displayDistance} km\` : 'Distance unknown'}</span>`
);

fs.writeFileSync('components/ProductGrid.tsx', code);
