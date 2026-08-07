const fs = require('fs');
let code = fs.readFileSync('components/ShopDetails.tsx', 'utf8');

code = code.replace(
    /import \{ MapPin, ArrowLeft, Clock, Phone, Store, Navigation \} from 'lucide-react';/,
    "import { MapPin, ArrowLeft, Clock, Phone, Store, Navigation } from 'lucide-react';\nimport { calculateDistance } from '../utils';"
);

code = code.replace(
    /<Navigation className="w-4 h-4" \/> Get Directions/,
    `{userLocation ? \`\${calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude)} km • Directions\` : 'Get Directions'}`
);

fs.writeFileSync('components/ShopDetails.tsx', code);
