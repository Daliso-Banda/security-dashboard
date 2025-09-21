import sys
import requests
import base64
import pickle
import numpy as np
from insightface.app import FaceAnalysis

def verify_face(image_path, fingerprint_id, backend_url="http://localhost:3000"):
    # Get encoding from backend
    resp = requests.get(f"{backend_url}/api/user-encoding/{fingerprint_id}")
    if resp.status_code != 200 or not resp.json().get("encoding"):
        print("NO_ENCODING")
        return
    encoding_b64 = resp.json()["encoding"]
    encoding = pickle.loads(base64.b64decode(encoding_b64))

    # Get embedding from image
    face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    face_app.prepare(ctx_id=0)
    faces = face_app.get(image_path)
    if not faces or not hasattr(faces[0], "embedding"):
        print("NO_FACE")
        return
    captured_embedding = faces[0].embedding

    # Compare
    dist = np.linalg.norm(captured_embedding - encoding)
    print("MATCH" if dist < 1.1 else "NO_MATCH")  # Threshold can be tuned

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 face_verify.py <image_path> <fingerprint_id>")
    else:
        verify_face(sys.argv[1], sys.argv[2])