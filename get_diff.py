import subprocess
try:
    res = subprocess.run(["git", "diff"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding="utf-8", errors="replace")
    stdout = res.stdout or ""
    stderr = res.stderr or ""
    with open("git_diff_output.txt", "w", encoding="utf-8") as f:
        f.write(stdout)
        f.write("\n=== STDERR ===\n")
        f.write(stderr)
    print("Done diff")
except Exception as e:
    with open("git_diff_output.txt", "w", encoding="utf-8") as f:
        f.write(f"Exception: {str(e)}")
