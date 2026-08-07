const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

if (!code.includes('LocationPermissionModal')) {
    code = code.replace(
        /import \{ ShopDetails \} from '.\/components\/ShopDetails';/,
        "import { ShopDetails } from './components/ShopDetails';\nimport { LocationPermissionModal } from './components/LocationPermissionModal';"
    );
    
    code = code.replace(
        /const \[showMap, setShowMap\] = useState\(false\);/,
        "const [showMap, setShowMap] = useState(false);\n  const [showLocationPrompt, setShowLocationPrompt] = useState(false);"
    );
    
    code = code.replace(
        /useEffect\(\(\) => \{\n    const init = async \(\) => \{/,
        "useEffect(() => {\n    const init = async () => {\n      const hasPrompted = localStorage.getItem('locationPrompted');\n      if (!hasPrompted) {\n          setShowLocationPrompt(true);\n      }"
    );
    
    code = code.replace(
        /<div className="min-h-screen pb-16 bg-white">/,
        `<div className="min-h-screen pb-16 bg-white">\n        {showLocationPrompt && (\n            <LocationPermissionModal onAllow={() => {\n                setShowLocationPrompt(false);\n                localStorage.setItem('locationPrompted', 'true');\n                getLocation();\n            }} />\n        )}`
    );
    
    fs.writeFileSync('App.tsx', code);
}
