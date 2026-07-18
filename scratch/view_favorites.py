filepath = 'c:\\Developer\\Pommastore\\storefront\\src\\app\\page.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(740, 785):
    if i < len(lines):
        print(f"{i+1}: {lines[i].rstrip()}")
