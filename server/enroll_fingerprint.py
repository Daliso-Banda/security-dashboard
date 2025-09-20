import os
import sys
import json
import time
import serial
import traceback
import adafruit_fingerprint

def debug(msg):
    """Print debug messages to stderr so JSON output stays clean."""
    print(f"[DEBUG] {msg}", file=sys.stderr)

# ---------------- UART Setup ----------------
try:
    debug("Opening UART on /dev/serial0 at 57600 baud...")
    uart = serial.Serial("/dev/serial0", baudrate=57600, timeout=1)
    debug("UART opened successfully.")
except Exception as e:
    debug(f"Failed to open UART: {e}")
    sys.exit(20)

# ---------------- Fingerprint Init ----------------
try:
    finger = adafruit_fingerprint.Adafruit_Fingerprint(uart)
    debug("Fingerprint sensor object created.")
    if finger.verify_password() != adafruit_fingerprint.OK:
        debug("Failed to verify sensor password.")
        sys.exit(21)
    else:
        debug("Sensor password verified successfully. Sensor is responsive.")
except Exception as e:
    debug("Exception during fingerprint sensor init:")
    debug(traceback.format_exc())
    sys.exit(22)

# ---------------- Enrollment Function ----------------
def wait_for_finger(timeout=30):
    """Wait for a finger to be placed on the sensor, with timeout."""
    start_time = time.time()
    while True:
        if finger.get_image() == adafruit_fingerprint.OK:
            return True
        if time.time() - start_time > timeout:
            return False
        time.sleep(0.5)

def enroll_fingerprint(fingerprint_id, name):
    """
    Guides the user through the fingerprint enrollment process.
    """
    try:
        # Step 1: Capture first image
        print(f"[INFO] Place your finger on the sensor, {name}...", file=sys.stderr)
        debug("Waiting for first finger placement...")
        if not wait_for_finger():
            return {"success": False, "message": "Timeout waiting for first finger."}, 1
        debug("First image captured.")

        # Step 2: Convert to template 1
        debug("Converting first image to template...")
        if finger.image_2_tz(1) != adafruit_fingerprint.OK:
            return {"success": False, "message": "Failed to convert first image to template."}, 2
        debug("Template 1 created.")

        # Step 3: Prompt for second image
        print(f"[INFO] Remove finger and place the same finger again, {name}...", file=sys.stderr)
        time.sleep(1)
        debug("Waiting for second finger placement...")
        if not wait_for_finger():
            return {"success": False, "message": "Timeout waiting for second finger."}, 3
        debug("Second image captured.")

        # Step 4: Convert to template 2
        debug("Converting second image to template...")
        if finger.image_2_tz(2) != adafruit_fingerprint.OK:
            return {"success": False, "message": "Failed to convert second image to template."}, 4
        debug("Template 2 created.")

        # Step 5: Create model
        debug("Creating fingerprint model...")
        if finger.create_model() != adafruit_fingerprint.OK:
            return {"success": False, "message": "Fingerprints did not match."}, 5
        debug("Model created successfully.")

        # Step 6: Store model
        debug(f"Storing model at ID {fingerprint_id}...")
        if finger.store_model(fingerprint_id) != adafruit_fingerprint.OK:
            return {"success": False, "message": f"Failed to store template at ID {fingerprint_id}."}, 6
        debug(f"Model stored at ID {fingerprint_id}.")

        return {"success": True, "message": "Fingerprint enrolled successfully.", "data": {"id": fingerprint_id}}, 0

    except Exception as e:
        debug("Exception during enrollment:")
        debug(traceback.format_exc())
        return {"success": False, "message": f"An error occurred: {str(e)}"}, 7

# ---------------- Main ----------------
def main():
    if len(sys.argv) != 3:
        sys.stderr.write("Usage: python3 enroll_fingerprint.py <fingerprint_id> <name>\n")
        sys.exit(10)

    try:
        fingerprint_id = int(sys.argv[1])
        name = sys.argv[2]
    except ValueError:
        sys.stderr.write("Error: fingerprint_id must be an integer.\n")
        sys.exit(11)

    print(f"[INFO] Waiting for finger from {name} to be placed on the sensor...", file=sys.stderr)

    result, code = enroll_fingerprint(fingerprint_id, name)

    # ✅ Only JSON to stdout
    print(json.dumps(result))
    sys.exit(code)

if __name__ == "__main__":
    main()
