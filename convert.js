const fs = require('fs');
const path = require('path');
const marked = require('marked');

// HTML template
const createHtml = (content, title) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="./assets/styles.css">
</head>
<body>
    <div class="content">
        ${content}
    </div>
</body>
</html>
`;

// Read and convert markdown files
fs.readdirSync('.')
    .filter(file => file.endsWith('.md'))
    .forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const html = marked.parse(content);
        const title = path.basename(file, '.md');
        const htmlContent = createHtml(html, title);
        
        fs.writeFileSync(file.replace('.md', '.html'), htmlContent);
        console.log(`Converted ${file} to ${file.replace('.md', '.html')}`);
    });
