import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const copies = [
  ["frontend/pages", "public/pages"],
  ["frontend/assets", "public/assets"]
];

for (const [from, to] of copies) {
  const source = path.join(root, from);
  const destination = path.join(root, to);

  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(source, destination, { recursive: true });
}

console.log("Prepared Vercel public assets.");
