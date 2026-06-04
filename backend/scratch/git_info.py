import subprocess

def run():
    print("=== GIT STATUS ===")
    res = subprocess.run(["git", "status"], capture_output=True, text=True)
    print(res.stdout)
    print(res.stderr)

    print("=== GIT LOG ===")
    res2 = subprocess.run(["git", "log", "-n", "10", "--oneline"], capture_output=True, text=True)
    print(res2.stdout)
    print(res2.stderr)

if __name__ == "__main__":
    run()
1