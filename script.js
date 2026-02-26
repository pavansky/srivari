const fs = require('fs'); const lines = fs.readFileSync('src/app/admin/page.tsx', 'utf8').split('\n'); lines.forEach((l, i) => { if (/\buse[A-Z]\w*\s*\(/.test(l)) console.log(i+1 + ': ' + l); });
