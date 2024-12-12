from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import face_recognition
import io
from PIL import Image

app = FastAPI()

@app.post("/authenticate-faces/")
async def authenticate_faces(image1: UploadFile, image2: UploadFile):
    # Read and decode the uploaded images
    try:
        img1_bytes = await image1.read()
        img2_bytes = await image2.read()

        img1 = face_recognition.load_image_file(io.BytesIO(img1_bytes))
        img2 = face_recognition.load_image_file(io.BytesIO(img2_bytes))

        # Get face encodings
        encodings1 = face_recognition.face_encodings(img1)
        encodings2 = face_recognition.face_encodings(img2)

        # Check if faces are detected
        if len(encodings1) == 0 or len(encodings2) == 0:
            raise HTTPException(status_code=400, detail="No face detected in one or both images.")

        # Compare faces
        match = face_recognition.compare_faces([encodings1[0]], encodings2[0])[0]

        # Respond with result
        if match:
            return JSONResponse(content={"status": "success", "message": "Faces match!"}, status_code=200)
        else:
            return JSONResponse(content={"status": "failure", "message": "Faces do not match!"}, status_code=401)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


# Run using uvicorn: uvicorn filename:app --reload

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)