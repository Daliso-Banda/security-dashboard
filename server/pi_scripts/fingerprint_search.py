import sys
import time
import serial
import adafruit_fingerprint

def search_fingerprint():
    uart = serial.Serial("/dev/serial0", baudrate=57600, timeout=1)
    finger = adafruit_fingerprint.Adafruit_Fingerprint(uart)
    print("[INFO] Waiting for finger...")
    for _ in range(30):  # Wait up to 30 seconds
        if finger.get_image() == adafruit_fingerprint.OK:
            if finger.image_2_tz(1) == adafruit_fingerprint.OK:
                result = finger.search()
                if result[0] == adafruit_fingerprint.OK:
                    print(f"{finger.finger_id}")
                    return
        time.sleep(1)
    print("NO_MATCH")
if __name__ == "__main__":
    search_fingerprint()