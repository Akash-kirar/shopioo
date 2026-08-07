const fs = require('fs');
let code = fs.readFileSync('components/ProductForm.tsx', 'utf8');

// Remove props
code = code.replace(
    /enhancedImagePreview: string \| null;\n  generatedVariations\?: string\[\];/,
    ""
);

code = code.replace(
    /enhancedImagePreview, \n    generatedVariations = \[\],/,
    ""
);

// Initial activeImage
code = code.replace(
    /const \[activeImage, setActiveImage\] = useState<string \| null>\(enhancedImagePreview \|\| imagePreview\);/,
    "const [activeImage, setActiveImage] = useState<string | null>(imagePreview);"
);

// Remove AI ASSETS gallery
code = code.replace(
    /\{\/\* Gallery \/ Variations \*\/\}[\s\S]*?<\/div>\n                <\/div>/,
    ""
);

fs.writeFileSync('components/ProductForm.tsx', code);
