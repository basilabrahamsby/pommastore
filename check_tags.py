import re
import sys

def check_tags(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove strings
    content = re.sub(r'\'[^\']*\'', "''", content)
    content = re.sub(r'"[^"]*"', '""', content)
    content = re.sub(r'`[^`]*`', "``", content)
    
    # Remove comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    content = re.sub(r'//.*', '', content)
    
    lines = content.split('\n')
    stack = []
    
    # Find all <div> or </div>
    for i, line in enumerate(lines):
        line_num = i + 1
        # Match <div but not </div> and check for self-closing
        opens = re.findall(r'<div(?![/])', line)
        closes = re.findall(r'</div', line)
        # Check if any opening div is self-closing
        # This is a bit rough but works for this file
        self_closing = re.findall(r'<div[^>]*/>', line)
        
        for _ in range(len(opens) - len(self_closing)):
            stack.append(line_num)
        for _ in range(len(closes)):
            if stack:
                stack.pop()
            else:
                print(f"Extra </div> at {line_num}")
                
    if stack:
        print(f"Unclosed <div> opened at: {stack}")
    else:
        print("All balanced.")

if __name__ == "__main__":
    check_tags(sys.argv[1])
