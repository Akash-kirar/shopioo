const fs = require('fs');
let code = fs.readFileSync('components/ProductGrid.tsx', 'utf8');

code = code.replace(
    /import \{ MapPin, Navigation, ShoppingCart \} from 'lucide-react';/,
    "import { MapPin, Navigation, ShoppingCart } from 'lucide-react';\nimport { calculateDistance } from '../utils';"
);

code = code.replace(
    /const isInCart = currentUser\?\.cartItems\?\.includes\(product\.id\);/,
    "const isInCart = currentUser?.cartItems?.includes(product.id);\n            const displayDistance = product.distance !== undefined ? product.distance : (shop && userLocation ? calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude) : undefined);"
);

code = code.replace(
    /\{showDistance && product\.distance !== undefined \? \(/,
    "{showDistance && displayDistance !== undefined ? ("
);

code = code.replace(
    /<span className="text-xs font-bold text-\[\#a82283\] tracking-tight">\{product\.distance\} km away<\/span>/,
    `<span className="text-xs font-bold text-[#a82283] tracking-tight">{displayDistance} km away</span>`
);

fs.writeFileSync('components/ProductGrid.tsx', code);
