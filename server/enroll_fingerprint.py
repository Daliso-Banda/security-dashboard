#!/usr/bin/env python3

import os
import sys
import json
import time
import serial
import board
import adafruit_fingerprint

# Set up the serial connection for the AS608 sensor
# The Raspberry Pi's TX/RX pins are GPIO14 and GPIO15, but
# we use the /dev/ttyS0 device file for the serial port.
uart = serial.Serial("/dev/ttyS0", baudrate=57600, timeout=1)
finger = adafruit_fingerprint.Adafruit_Fingerprint(uart)

def enroll_fingerprint(fingerprint_id, name):
    """
    Guides the user through the fingerprint enrollment process.
    """
    try:
        if finger.get_image() == adafruit_fingerprint.OK:
            print("Image taken")
        else:
            return {"success": False, "message": "Failed to capture image."}, 1

        if finger.image_2_template_1() != adafruit_fingerprint.OK:
            return {"success": False, "message": "Failed to convert image to template."}, 2

        print(f"Place the same finger again, {name}...")
        time.sleep(1)
        while finger.get_image() != adafruit_fingerprint.OK:
            pass

        if finger.image_2_template_2() != adafruit_fingerprint.OK:
            return {"success": False, "message": "Failed to convert second image to template."}, 3

        if finger.create_model() != adafruit_fingerprint.OK:
            return {"success": False, "message": "Fingerprints did not match."}, 4

        # The AS608 sensor can store a limited number of templates (e.g., 200)
        # We store the template at the given fingerprint_id.
        if finger.store_model(fingerprint_id) != adafruit_fingerprint.OK:
            return {"success": False, "message": f"Failed to store template at ID {fingerprint_id}."}, 5

        return {"success": True, "message": "Fingerprint enrolled successfully.", "data": {"id": fingerprint_id}}, 0

    except Exception as e:
        return {"success": False, "message": f"An error occurred: {str(e)}"}, 6

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
        
    # Announce to the user that we are ready to proceed
    print(f"Waiting for finger from {name} to be placed on the sensor...")

    result, code = enroll_fingerprint(fingerprint_id, name)
    print(json.dumps(result))
    sys.exit(code)

if __name__ == "__main__":
    main()