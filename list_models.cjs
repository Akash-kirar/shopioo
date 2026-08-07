const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
async function run() {
    let res = await ai.models.list();
    for await (const m of res) {
        if (m.name.includes('flash') || m.name.includes('pro')) {
            console.log(m.name);
        }
    }
}
run();
