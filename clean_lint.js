const fs = require('fs');

let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');
pageContent = pageContent.replace(/aria-hidden="true"\s*aria-hidden="true"/g, 'aria-hidden="true"');
fs.writeFileSync('src/app/page.tsx', pageContent);

let integrationContent = fs.readFileSync('src/app/integration/page.tsx', 'utf8');
integrationContent = integrationContent.replace(/\/\/\s*Initialize Swiss System Request/g, '{/* Initialize Swiss System Request */}');
fs.writeFileSync('src/app/integration/page.tsx', integrationContent);
