import subprocess

try:
    res = subprocess.run(["git", "status"], capture_output=True, text=True, timeout=10)
    with open("git_status_output.txt", "w", encoding="utf-8") as f:
        f.write(res.stdout)
        f.write("\n\n=== ERRORS ===\n")
        f.write(res.stderr)
    print("Done status")
except Exception as e:
    with open("git_status_output.txt", "w", encoding="utf-8") as f:
        f.write(f"Exception: {str(e)}")
    print("Failed status")

try:
    res2 = subprocess.run(["git", "log", "-n", "10", "--oneline"], capture_output=True, text=True, timeout=10)
    with open("git_log_output.txt", "w", encoding="utf-8") as f:
        f.write(res2.stdout)
        f.write("\n\n=== ERRORS ===\n")
        f.write(res2.stderr)
    print("Done log")
except Exception as e:
    print("Failed log")
