const fs = require('fs');
let code = fs.readFileSync('components/ShopDetails.tsx', 'utf8');

code = code.replace(
    /showDistance=\{false\}/,
    "showDistance={!!userLocation}\n                        userLocation={userLocation}"
);

fs.writeFileSync('components/ShopDetails.tsx', code);
