import cv2
import sys
import time

def capture_face_image(save_path):
    cam = cv2.VideoCapture(0)
    if not cam.isOpened():
        print("ERROR")
        return
    print("[INFO] Capturing face...")
    time.sleep(2)  # Warm up
    ret, frame = cam.read()
    if ret:
        cv2.imwrite(save_path, frame)
        print("OK")
    else:
        print("ERROR")
    cam.release()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 face_capture.py <save_path>")
    else:
        capture_face_image(sys.argv[1])