import subprocess
import requests
import time

BACKEND_URL = "http://localhost:3000"
IMAGE_PATH = "/home/pi/captured_faces/face.jpg"

def log_result(fingerprint_id, result):
    requests.post(f"{BACKEND_URL}/api/log-auth", json={
        "fingerprint_id": fingerprint_id,
        "result": result,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
    })

def run_auth_flow():
    while True:
        print("[AUTH] Waiting for fingerprint...")
        fp_id = subprocess.check_output(["python3", "fingerprint_search.py"]).decode().strip()
        if fp_id == "NO_MATCH":
            print("[AUTH] No fingerprint match.")
            continue

        print(f"[AUTH] Fingerprint matched: {fp_id}")
        subprocess.call(["python3", "face_capture.py", IMAGE_PATH])
        verify_result = subprocess.check_output(["python3", "face_verify.py", IMAGE_PATH, fp_id]).decode().strip()
        print(f"[AUTH] Face verification: {verify_result}")

        log_result(fp_id, verify_result)
        time.sleep(2)  # Small delay before next loop

if __name__ == "__main__":
    run_auth_flow()