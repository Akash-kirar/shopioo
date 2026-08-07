const fs = require('fs');
let code = fs.readFileSync('components/OwnerDashboard.tsx', 'utf8');

code = code.replace(
    /<div className="relative mb-4">\s*<div className="relative mb-4 bg-\[#f8fafc\] border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-\[#a82283\]\/10">/,
    `<div className="relative mb-4 bg-[#f8fafc] border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#a82283]/10">`
);

fs.writeFileSync('components/OwnerDashboard.tsx', code);
