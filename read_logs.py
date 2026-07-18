import sys

def detect_and_read(filepath):
    # Try different encodings
    for encoding in ['utf-16', 'utf-16le', 'utf-16be', 'utf-8', 'latin1']:
        try:
            with open(filepath, 'r', encoding=encoding) as f:
                content = f.read(2000) # Read first 2000 chars
                print(f"--- Encoding {encoding} success ---")
                print(content[:1000])
                return
        except Exception as e:
            print(f"Encoding {encoding} failed: {e}")

if __name__ == '__main__':
    detect_and_read('C:\\Developer\\Pommastore\\api_logs.txt')
