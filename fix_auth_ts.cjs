const fs = require('fs');
let code = fs.readFileSync('components/Auth.tsx', 'utf8');

code = code.replace(/window\.recaptchaVerifier/g, "(window as any).recaptchaVerifier");

fs.writeFileSync('components/Auth.tsx', code);
