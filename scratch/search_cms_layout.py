filepath = 'c:\\Developer\\Kozmocart\\storefront\\src\\app\\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'cmsLayout' in line:
        print(f"Line {i+1}: {line.strip()}")
