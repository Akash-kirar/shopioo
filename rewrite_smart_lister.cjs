const fs = require('fs');
let code = fs.readFileSync('components/SmartLister.tsx', 'utf8');

// Remove enhance functions import
code = code.replace(
    /analyzeProductImage, enhanceProductImage, fileToGenerativePart, generateProductVariations/,
    "analyzeProductImage, fileToGenerativePart"
);

// Remove state
code = code.replace(/const \[enhancedImage, setEnhancedImage\] = useState<string \| null>\(null\);\n  const \[generatedVariations, setGeneratedVariations\] = useState<string\[\]>\(\[\]\);\n  const \[isEnhancing, setIsEnhancing\] = useState\(false\);/, 
"");

// Handle handleCapture
code = code.replace(
    /setIsEnhancing\(true\);/,
    ""
);

code = code.replace(
    /setStep\('review'\);\n      \/\/ 4\. Start Background Image Tasks \(Staggered\)\n[\s\S]*?}\)\(\);\n    \} catch \(error\) \{/,
    `setStep('review');\n    } catch (error) {`
);

code = code.replace(
    /setIsEnhancing\(false\);/g,
    ""
);

// Handle handleSave
code = code.replace(
    /let imageToSave = finalImage \|\| enhancedImage \|\| originalImageBase64 \|\| '';/,
    `let imageToSave = finalImage || originalImageBase64 || '';`
);

// Handle handleRetake
code = code.replace(
    /setEnhancedImage\(null\);\n    setOriginalImageBase64\(null\);\n    setGeneratedVariations\(\[\]\);/,
    ""
);

// Handle handleReset
code = code.replace(
    /setEnhancedImage\(null\);\n      setGeneratedVariations\(\[\]\);/,
    ""
);

// Render Review text
code = code.replace(
    /\{isEnhancing && <span className="text-indigo-600 font-bold flex items-center gap-1 animate-pulse"><Sparkles size=\{12\}\/> Enhancing images\.\.\.<\/span>\}/,
    ""
);

// Render ProductForm
code = code.replace(
    /enhancedImagePreview=\{enhancedImage\}\n                    generatedVariations=\{generatedVariations\}/,
    ""
);

fs.writeFileSync('components/SmartLister.tsx', code);
