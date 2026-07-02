import os
from PIL import Image

folder = '/app/static_uploads'
print('Starting image compression scan inside container...')
for filename in os.listdir(folder):
    filepath = os.path.join(folder, filename)
    if os.path.isfile(filepath) and filename.lower().endswith(('.jpg', '.jpeg', '.png')):
        orig_size = os.path.getsize(filepath)
        if orig_size > 150000: # Only compress files larger than 150KB
            try:
                img = Image.open(filepath)
                max_size = 1200
                if img.width > max_size or img.height > max_size:
                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                ext = os.path.splitext(filename)[1].lower()
                fmt = 'JPEG' if ext in ('.jpg', '.jpeg') else 'PNG'
                
                if fmt == 'JPEG' and img.mode in ('RGBA', 'P'):
                    img = img.convert('RGB')
                    
                img.save(filepath, fmt, quality=70)
                new_size = os.path.getsize(filepath)
                print(f'Compressed {filename}: {orig_size/1024:.1f}KB -> {new_size/1024:.1f}KB')
            except Exception as e:
                print(f'Failed to compress {filename}: {str(e)}')
print('Scan complete.')
