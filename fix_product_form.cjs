const fs = require('fs');
let code = fs.readFileSync('components/ProductForm.tsx', 'utf8');
code = code.replace(/import \{ Loader2, Plus, Sparkles \} from 'lucide-react';/, "import { Sparkles } from 'lucide-react';");
fs.writeFileSync('components/ProductForm.tsx', code);
