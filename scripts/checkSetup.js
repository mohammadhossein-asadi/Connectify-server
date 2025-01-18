import fs from "fs";
import path from "path";

const requiredDirs = [
  "public",
  "public/assets",
  "middleware",
  "controllers",
  "models",
  "routes",
  "utils",
];

const checkDirectories = () => {
  requiredDirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(fullPath)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

checkDirectories();
