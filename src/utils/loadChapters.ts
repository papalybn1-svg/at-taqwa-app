// src/utils/loadChapters.ts
import fs from 'fs';
import path from 'path';

export const loadChapters = () => {
  const chaptersDir = path.join(__dirname, '../data/chapitres');
  const files = fs.readdirSync(chaptersDir);
  const chapters = files.map(file => {
    const filePath = path.join(chaptersDir, file);
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  });
  return chapters;
};