const fs = require('fs');
let code = fs.readFileSync('components/OwnerDashboard.tsx', 'utf8');

// Fix 1: ShopMapPicker has a rogue <input>
const rogueInput = `        <input type="file" id="native-cam-owner" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
        if (e.target.files && e.target.files[0]) {
            handleShopImageFile(e.target.files[0]);
        }
      }} />`;
code = code.replace(rogueInput, '');

// Fix 2: Remove setShowWebcam
code = code.replace("setShowWebcam(false);", "");

// Fix 3: Remove showWebcam conditional block
code = code.replace(/      \{showWebcam && \([\s\S]*?<WebcamCapture[\s\S]*?\/>\n      \}\)/, "");

fs.writeFileSync('components/OwnerDashboard.tsx', code);
