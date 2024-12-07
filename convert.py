import markdown
import os
import glob

def convert_md_to_html(md_file):
    # Read markdown content
    with open(md_file, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Convert markdown to HTML
    html_content = markdown.markdown(md_content, extensions=['extra'])
    
    # Create HTML template with CSS
    html_template = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{os.path.basename(md_file).replace('.md', '')}</title>
    <link rel="stylesheet" href="./assets/styles.css">
</head>
<body>
    <div class="content">
        {html_content}
    </div>
</body>
</html>
'''
    
    # Write HTML file
    html_file = md_file.replace('.md', '.html')
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_template)
    
    print(f'Converted {md_file} to {html_file}')

def main():
    # Get all markdown files in the current directory
    md_files = glob.glob('*.md')
    
    for md_file in md_files:
        convert_md_to_html(md_file)

if __name__ == '__main__':
    main()
