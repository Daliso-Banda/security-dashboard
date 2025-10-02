import os
import sys
import json
import time
import serial
import traceback
import adafruit_fingerprint

# ---------------- Helper ----------------
def send_event(event, message, success=None, data=None):
    """Send structured JSON events to stdout for Node to parse."""
    payload = {"event": event, "message": message}
    if success is not None:
        payload["success"] = success
    if data is not None:
        payload["data"] = data
    print(json.dumps(payload), flush=True)

# ---------------- UART Setup ----------------
try:
    uart = serial.Serial("/dev/serial0", baudrate=57600, timeout=1)
    send_event("init", "UART opened successfully.")
except Exception as e:
    send_event("error", f"Failed to open UART: {e}", success=False)
    sys.exit(20)

# ---------------- Fingerprint Init ----------------
try:
    finger = adafruit_fingerprint.Adafruit_Fingerprint(uart)
    if finger.verify_password() != adafruit_fingerprint.OK:
        send_event("error", "Failed to verify sensor password.", success=False)
        sys.exit(21)
    else:
        send_event("init", "Sensor password verified. Sensor is responsive.")
except Exception as e:
    send_event("error", f"Exception during sensor init: {str(e)}", success=False)
    sys.exit(22)

# ---------------- Enrollment ----------------
def wait_for_finger(timeout=30):
    start_time = time.time()
    while True:
        if finger.get_image() == adafruit_fingerprint.OK:
            return True
        if time.time() - start_time > timeout:
            return False
        time.sleep(0.5)

def enroll_fingerprint(fingerprint_id, name):
    try:
        # Step 1
        send_event("prompt", f"Place your finger on the sensor, {name}...")
        if not wait_for_finger():
            return {"success": False, "message": "Timeout waiting for first finger."}, 1
        send_event("status", "First image captured.")

        # Step 2
        if finger.image_2_tz(1) != adafruit_fingerprint.OK:
            return {"success": False, "message": "Failed to convert first image."}, 2
        send_event("status", "Template 1 created.")

        # Step 3
        send_event("prompt", f"Remove finger and place the same finger again, {name}...")
        time.sleep(1)
        if not wait_for_finger():
            return {"success": False, "message": "Timeout waiting for second finger."}, 3
        send_event("status", "Second image captured.")

        # Step 4
        if finger.image_2_tz(2) != adafruit_fingerprint.OK:
            return {"success": False, "message": "Failed to convert second image."}, 4
        send_event("status", "Template 2 created.")

        # Step 5
        if finger.create_model() != adafruit_fingerprint.OK:
            return {"success": False, "message": "Fingerprints did not match."}, 5
        send_event("status", "Model created successfully.")

        # Step 6
        if finger.store_model(fingerprint_id) != adafruit_fingerprint.OK:
            return {"success": False, "message": f"Failed to store template at ID {fingerprint_id}."}, 6
        send_event("status", f"Model stored at ID {fingerprint_id}.")

        # Final success
        return {
            "success": True,
            "message": "Fingerprint enrolled successfully.",
            "data": {"id": fingerprint_id}
        }, 0

    except Exception as e:
        send_event("error", f"Exception during enrollment: {str(e)}", success=False)
        return {"success": False, "message": f"An error occurred: {str(e)}"}, 7

# ---------------- Main ----------------
def main():
    if len(sys.argv) != 3:
        send_event("error", "Usage: python3 enroll_fingerprint.py <fingerprint_id> <name>", success=False)
        sys.exit(10)

    try:
        fingerprint_id = int(sys.argv[1])
        name = sys.argv[2]
    except ValueError:
        send_event("error", "fingerprint_id must be an integer", success=False)
        sys.exit(11)

    send_event("start", f"Waiting for {name}'s fingerprint...")

    result, code = enroll_fingerprint(fingerprint_id, name)

    # Final output
    send_event("done", result["message"], success=result["success"], data=result.get("data"))
    sys.exit(code)

if __name__ == "__main__":
    main()
