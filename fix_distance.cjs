const fs = require('fs');
let code = fs.readFileSync('components/ProductGrid.tsx', 'utf8');

code = code.replace(
    /showDistance && product.distance !== undefined && product.distance < 9000 \?/g,
    'showDistance && product.distance !== undefined ?'
);

fs.writeFileSync('components/ProductGrid.tsx', code);
