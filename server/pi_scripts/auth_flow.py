#!/usr/bin/env python3

import time
import sys
import subprocess
from pyfingerprint.pyfingerprint import PyFingerprint

def search_fingerprint():
    try:
        # Initialize the sensor (adjust serial port and baudrate as needed)
        f = PyFingerprint('/dev/serial0', 57600, 0xFFFFFFFF, 0x00000000)

        if not f.verifyPassword():
            print("Could not verify fingerprint sensor password")
            sys.exit(1)

    except Exception as e:
        print(f"Sensor initialization failed: {e}")
        sys.exit(1)

    print("[AUTH] Waiting for fingerprint...")

    try:
        # Wait for finger to be placed
        while not f.readImage():
            time.sleep(0.1)

        # Convert image to template
        f.convertImage(0x01)

        # Search template
        result = f.searchTemplate()
        positionNumber = result[0]  # index of the matched template
        accuracyScore = result[1]   # matching score

        if positionNumber == -1:
            print("NO_MATCH")
        else:
            print(f"[AUTH] Fingerprint matched! ID: {positionNumber}")
            # ==============================
            # === Trigger Face Recognition Script ===
            # ==============================
            try:
                subprocess.run(["python3", "/home/codeofwar/FinalYearProject/FacialRecogition/facialReconigtion2.py"])
            except Exception as e:
                print(f"[ERROR] Failed to start face recognition: {e}")

    except Exception as e:
        print(f"Fingerprint search failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    search_fingerprint()
