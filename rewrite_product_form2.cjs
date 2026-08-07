const fs = require('fs');
let code = fs.readFileSync('components/ProductForm.tsx', 'utf8');

code = code.replace(
    /React\.useEffect\(\(\) => \{[\s\S]*?\}\, \[enhancedImagePreview, imagePreview, activeImage\]\);/,
    ""
);

code = code.replace(
    /\{activeImage === enhancedImagePreview && \([\s\S]*?ENHANCED[\s\S]*?<\/div>\n                    \)\}/,
    ""
);

fs.writeFileSync('components/ProductForm.tsx', code);
