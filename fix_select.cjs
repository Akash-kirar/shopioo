const fs = require('fs');
let code = fs.readFileSync('components/OwnerDashboard.tsx', 'utf8');

code = code.replace(
    /<select\s+value=\{shopCategory\}[\s\S]*?<\/select>\s*<ChevronRight[^>]*\/>\s*<\/div>/,
    `<div className="relative mb-4 bg-[#f8fafc] border border-gray-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#a82283]/10">
                     <select 
                        value={shopCategory} 
                        onChange={e => { setShopCategory(e.target.value); setFormError(''); }} 
                        className={\`w-full bg-transparent py-4 px-6 text-sm font-black outline-none appearance-none relative z-10 \${!shopCategory ? 'text-gray-400' : 'text-black'}\`}
                     >
                        <option value="" disabled>Select Shop Category</option>
                        <option value="Mobiles">Mobiles</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Shoes">Shoes</option>
                        <option value="Jewellery">Jewellery</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Watches">Watches</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Grocery">Grocery</option>
                        <option value="Other">Other</option>
                     </select>
                     <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 z-0" />
                  </div>`
);

fs.writeFileSync('components/OwnerDashboard.tsx', code);
