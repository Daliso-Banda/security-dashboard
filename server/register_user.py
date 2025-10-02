import os
import sys
import json
import base64
import pickle
import numpy as np
import warnings

# Suppress FutureWarnings to prevent stdout pollution
warnings.simplefilter(action='ignore', category=FutureWarning)

from insightface.app import FaceAnalysis

# --- Helper to send milestone logs ---
def milestone(msg, status="info"):
    """
    status: info, success, failure
    """
    print(json.dumps({"milestone": msg, "status": status}), flush=True)

# --- Initialize InsightFace ---
milestone("Initializing InsightFace...", "info")
try:
    face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
    face_app.prepare(ctx_id=0)
    milestone("InsightFace ready.", "success")
except Exception as e:
    milestone(f"Failed to initialize InsightFace: {e}", "failure")
    sys.exit(0)

# --- Encode embedding ---
def encode_embedding(embedding: np.ndarray) -> str:
    return base64.b64encode(pickle.dumps(embedding)).decode("utf-8")

# --- Register User ---
def register_user(image_path, name):
    response = {"success": False, "message": "Unknown error."}

    if not os.path.exists(image_path):
        msg = f"Image path does not exist: {image_path}"
        milestone(msg, "failure")
        response["message"] = msg
        return response

    try:
        import cv2
        img = cv2.imread(image_path)
        if img is None:
            msg = "Failed to load image file."
            milestone(msg, "failure")
            response["message"] = msg
            return response

        faces = face_app.get(img)
    except Exception as e:
        msg = f"Error processing image: {e}"
        milestone(msg, "failure")
        response["message"] = msg
        return response

    if not faces:
        msg = "No face detected in the image."
        milestone(msg, "failure")
        response["message"] = msg
        return response

    embedding = faces[0].embedding
    if embedding.shape != (512,):
        msg = f"Invalid embedding shape: {embedding.shape}"
        milestone(msg, "failure")
        response["message"] = msg
        return response

    milestone("Face registration completed. Ready for fingerprint enrollment.", "success")

    response["success"] = True
    response["message"] = f"Face for '{name}' processed successfully."
    response["data"] = {
        "name": name,
        "encoding": encode_embedding(embedding),
        "embedding_length": embedding.shape[0]
    }
    return response

# --- CLI ---
def main():
    if len(sys.argv) != 3:
        msg = "Usage: python3 register_user.py <image_path> <name>"
        milestone(msg, "failure")
        print(json.dumps({"success": False, "message": msg}), flush=True)
        sys.exit(0)

    image_path = sys.argv[1]
    name = sys.argv[2]

    result = register_user(image_path, name)
    print(json.dumps(result), flush=True)
    sys.exit(0)

if __name__ == "__main__":
    main()

