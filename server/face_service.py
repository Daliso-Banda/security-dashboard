from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
import uvicorn
import numpy as np
import base64, pickle, cv2
from insightface.app import FaceAnalysis

print("[INIT] Loading InsightFace...")
face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
face_app.prepare(ctx_id=0)
print("[INIT] Ready.")

app = FastAPI()

def encode_embedding(embedding: np.ndarray) -> str:
    return base64.b64encode(pickle.dumps(embedding)).decode("utf-8")

@app.post("/register-face")
async def register_face(name: str = Form(...), image: UploadFile = None):
    try:
        file_bytes = await image.read()
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return JSONResponse({"success": False, "message": "Invalid image"})

        faces = face_app.get(img)
        if not faces:
            return JSONResponse({"success": False, "message": "No face detected"})

        embedding = faces[0].embedding
        if embedding.shape != (512,):
            return JSONResponse({"success": False, "message": "Invalid embedding"})

        return {
            "success": True,
            "message": f"Face for {name} processed successfully.",
            "data": {
                "name": name,
                "encoding": encode_embedding(embedding),
                "embedding_length": embedding.shape[0]
            }
        }
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse
import uvicorn
import numpy as np
import base64, pickle, cv2
from insightface.app import FaceAnalysis

print("[INIT] Loading InsightFace...")
face_app = FaceAnalysis(name="buffalo_l", providers=["CPUExecutionProvider"])
face_app.prepare(ctx_id=0)
print("[INIT] Ready.")

app = FastAPI()

def encode_embedding(embedding: np.ndarray) -> str:
    return base64.b64encode(pickle.dumps(embedding)).decode("utf-8")

@app.post("/register-face")
async def register_face(name: str = Form(...), image: UploadFile = None):
    try:
        file_bytes = await image.read()
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return JSONResponse({"success": False, "message": "Invalid image"})

        faces = face_app.get(img)
        if not faces:
            return JSONResponse({"success": False, "message": "No face detected"})

        embedding = faces[0].embedding
        if embedding.shape != (512,):
            return JSONResponse({"success": False, "message": "Invalid embedding"})

        return {
            "success": True,
            "message": f"Face for {name} processed successfully.",
            "data": {
                "name": name,
                "encoding": encode_embedding(embedding),
                "embedding_length": embedding.shape[0]
            }
        }
    except Exception as e:
        return JSONResponse({"success": False, "message": str(e)})

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5001)
