const fs = require('fs');
let code = fs.readFileSync('utils.ts', 'utf8');

code = code.replace(
    /export const saveItem = async \(item: Item\) => \{[\s\S]*?alert\("Database error"\);\n  \}\n\};/,
    `export const saveItem = async (item: Item) => {
  try {
    await setDoc(doc(db, 'items', item.id), item);
  } catch (error) {
    console.error("Failed to save item:", error);
    alert("Database error: " + (error as Error).message);
    throw error;
  }
};`
);

fs.writeFileSync('utils.ts', code);
