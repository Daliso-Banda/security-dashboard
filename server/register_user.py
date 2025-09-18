import os
import sys
import base64
import pickle
import json
import numpy as np
from pymongo import MongoClient
from insightface.app import FaceAnalysis

# === MongoDB Setup ===
client = MongoClient("mongodb://admin:tembo123@172.27.243.149:27017/admin")
db = client["face_access"]
users_collection = db["registered_users"]

# === InsightFace Setup ===
print("[INFO] Initializing InsightFace for registration...")
face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
face_app.prepare(ctx_id=0)

# === Encode embedding for storage ===
def encode_embedding(embedding: np.ndarray) -> str:
    return base64.b64encode(pickle.dumps(embedding)).decode("utf-8")

# === Main Registration Function ===
def register_user(image_path, name):
    response = {"success": False, "message": "Unknown error."}

    if not os.path.exists(image_path):
        response["message"] = f"Image path does not exist: {image_path}"
        return response, 1

    try:
        # Load and detect face
        import cv2
        img = cv2.imread(image_path)
        if img is None:
            response["message"] = "Failed to load image file."
            return response, 2

        faces = face_app.get(img)
    except Exception as e:
        response["message"] = f"Error processing image: {e}"
        return response, 3

    if not faces:
        response["message"] = "No face detected in the image."
        return response, 4

    # Take first detected face
    embedding = faces[0].embedding
    if embedding.shape != (512,):
        response["message"] = f"Invalid embedding shape: {embedding.shape}"
        return response, 5

    try:
        # Save to DB
        users_collection.insert_one({
            "name": name,
            "encoding": encode_embedding(embedding)
        })

        response["success"] = True
        response["message"] = f"User '{name}' registered successfully."
        response["data"] = {"name": name, "embedding_length": len(embedding)}
        return response, 0
    except Exception as e:
        response["message"] = f"Database error: {e}"
        return response, 6

# === CLI ===
def main():
    if len(sys.argv) != 3:
        sys.stderr.write("Usage: python3 register_user.py <image_path> <name>\n")
        sys.exit(10)

    image_path = sys.argv[1]
    name = sys.argv[2]

    result, code = register_user(image_path, name)
    print(json.dumps(result))
    sys.exit(code)

if __name__ == "__main__":
    main()
