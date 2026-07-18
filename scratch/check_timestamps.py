import os
import re

filepath = 'c:\\Developer\\Pommastore\\api_logs.txt'

if os.path.exists(filepath):
    try:
        with open(filepath, 'r', encoding='utf-16') as f:
            lines = f.readlines()
        
        print(f"Total lines: {len(lines)}")
        
        # Let's find any lines that look like timestamps (YYYY-MM-DD)
        dates = []
        for line in lines:
            match = re.search(r'\b(2026-\d{2}-\d{2})\b', line)
            if match:
                dates.append(match.group(1))
        
        if dates:
            print(f"First timestamp found: {dates[0]}")
            print(f"Last timestamp found: {dates[-1]}")
            # Unique dates
            print(f"All unique dates in log: {sorted(list(set(dates)))}")
        else:
            print("No timestamps of format YYYY-MM-DD found.")
            
        # Let's look for uvicorn startups or errors in the last 1000 lines
        last_lines = lines[-1000:]
        print("\n--- Any error/exception/warn in the last 1000 lines ---")
        err_count = 0
        for i, line in enumerate(last_lines):
            lower_line = line.lower()
            if any(k in lower_line for k in ['error', 'exception', 'traceback', 'failed', '500', '400', '403', '404']):
                print(f"Line {len(lines) - 1000 + i}: {line.strip()}")
                err_count += 1
                if err_count > 50:
                    print("Truncated errors in last 1000 lines...")
                    break
        if err_count == 0:
            print("No errors in the last 1000 lines.")
            
    except Exception as e:
        print(f"Error: {e}")
else:
    print("File not found")
