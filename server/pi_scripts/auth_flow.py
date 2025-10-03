import time
import sys
import subprocess
import RPi.GPIO as GPIO
from pyfingerprint.pyfingerprint import PyFingerprint

# GPIO setup
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
MATCH_PIN = 18    # Output HIGH for match
GPIO.setup(MATCH_PIN, GPIO.OUT)
GPIO.output(MATCH_PIN, GPIO.LOW)

def trigger_match_pin(duration=5):
    GPIO.output(MATCH_PIN, GPIO.HIGH)
    time.sleep(duration)
    GPIO.output(MATCH_PIN, GPIO.LOW)

def search_fingerprint():
    try:
        # Initialize the sensor
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

        if positionNumber == -1:
            print("[AUTH] NO MATCH")
        else:
            print(f"[AUTH] Fingerprint matched! ID: {positionNumber}")
            trigger_match_pin()  # Pin 18 HIGH for 5 seconds

            # Trigger Face Recognition Script
            try:
                subprocess.run(["python3", "/home/codeofwar/FinalYearProject/FacialRecogition/facialReconigtion2.py"])
            except Exception as e:
                print(f"[ERROR] Failed to start face recognition: {e}")

    except Exception as e:
        print(f"Fingerprint search failed: {e}")
        sys.exit(1)
    finally:
        GPIO.cleanup()  # Reset GPIO pins

if __name__ == "__main__":
    search_fingerprint()
