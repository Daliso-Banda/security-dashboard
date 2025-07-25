import os
import sys
import base64
import numpy as np
import face_recognition
import json # NEW: For structured output

# === Encode face encoding to base64 for output ===
def encode_face(face_encoding):
    return base64.b64encode(face_encoding.tobytes()).decode('utf-8')

# === Main Processing Function ===
# This function now returns a dictionary with status and data,
# which will be JSON-encoded and printed.
def process_face_for_registration(image_path, name):
    # Prepare a default error response
    response = {
        "success": False,
        "message": "An unknown error occurred during processing."
    }

    if not os.path.exists(image_path):
        response["message"] = f"Image path does not exist: {image_path}"
        return response, 1 # Return response and an error exit code

    try:
        image = face_recognition.load_image_file(image_path)
        encodings = face_recognition.face_encodings(image)
    except Exception as e:
        response["message"] = f"Error loading or processing image file: {e}"
        return response, 2 # Return response and a specific error exit code

    if not encodings:
        response["message"] = "No face found in the image."
        return response, 3 # Return response and a specific error exit code

    # If multiple faces are found, we'll just take the first one for registration
    # You could add logic here if you want to handle multiple faces differently
    encoded_face = encode_face(encodings[0])

    # Optionally, read the image binary to return it to Node.js if Node.js needs to store it
    # (Node.js already has the file, so this is usually not needed unless you want it Base64 encoded)
    image_binary_base64 = None
    try:
        with open(image_path, "rb") as f:
            image_binary_base64 = base64.b64encode(f.read()).decode('utf-8')
    except Exception as e:
        # Log a warning, but don't fail the face encoding process
        sys.stderr.write(f"Warning: Could not read image binary for output: {e}\n")

    response["success"] = True
    response["message"] = "Face processed successfully."
    response["data"] = {
        "name": name,
        "face_encoding": encoded_face,
        "image_binary_base64": image_binary_base64 # Include if Node.js needs it
    }
    return response, 0 # Return success response and success exit code

# === CLI Interface ===
def main():
    if len(sys.argv) != 3:
        # Print usage to stderr, as stdout is for the structured JSON output
        sys.stderr.write("Usage: python3 register_user.py <image_path> <name>\n")
        sys.exit(10) # Unique exit code for argument error

    image_path = sys.argv[1]
    name = sys.argv[2]

    result, exit_code = process_face_for_registration(image_path, name)

    # Print the JSON result to stdout
    print(json.dumps(result))

    # Exit with the determined code
    sys.exit(exit_code)

if __name__ == "__main__":
    main()