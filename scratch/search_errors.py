import os

filepath = 'c:\\Developer\\Pommastore\\api_logs.txt'

# Let's read the file and look for occurrences of error, exception, fail, 500, 400, etc.
# We'll print the last 100 lines of the file first to see what's happening recently.

if os.path.exists(filepath):
    try:
        with open(filepath, 'r', encoding='utf-16') as f:
            lines = f.readlines()
        
        print(f"Total lines: {len(lines)}")
        
        print("\n--- Last 50 lines ---")
        for line in lines[-50:]:
            print(line.strip())
            
        print("\n--- Error/Exception lines ---")
        count = 0
        for i, line in enumerate(lines):
            lower_line = line.lower()
            if 'error' in lower_line or 'exception' in lower_line or 'traceback' in lower_line or 'failed' in lower_line:
                # print line and a few context lines if possible, or just the line
                print(f"Line {i}: {line.strip()}")
                count += 1
                if count > 100:
                    print("Too many errors, truncating list...")
                    break
    except Exception as e:
        print(f"Error reading file: {e}")
else:
    print(f"File not found: {filepath}")
