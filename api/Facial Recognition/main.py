import face_recognition
import cv2
import numpy as np
import os
from datetime import datetime
from PIL import Image
from io import BytesIO

def file_image(bytes)->np.ndarray:

    return np.array(Image.open(BytesIO(bytes)))

class FaceAuthSystem:
    def __init__(self):
        self.video_capture = cv2.VideoCapture(0)
        
        # Adjusted security settings
        self.face_tolerance = 0.5
        self.min_face_size = 100
        self.required_frames = 5
        
    def check_face_size(self, face_location):
        top, right, bottom, left = face_location
        face_height = bottom - top
        return face_height >= self.min_face_size
    
    def show_preview(self, frame, face_location):
        """Show preview of captured face and ask for confirmation"""
        top, right, bottom, left = face_location
        
        # Add padding around the face
        padding = 50
        top = max(top - padding, 0)
        bottom = min(bottom + padding, frame.shape[0])
        left = max(left - padding, 0)
        right = min(right + padding, frame.shape[1])
        
        # Extract face region with padding
        face_img = frame[top:bottom, left:right]
        
        # Resize for display if too large
        display_height = 400
        aspect_ratio = face_img.shape[1] / face_img.shape[0]
        display_width = int(display_height * aspect_ratio)
        preview = cv2.resize(face_img, (display_width, display_height))
        
        # Create window with instructions
        cv2.namedWindow('Preview - Press Y to accept, N to retry', cv2.WINDOW_NORMAL)
        cv2.imshow('Preview - Press Y to accept, N to retry', preview)
        
        while True:
            key = cv2.waitKey(1) & 0xFF
            if key == ord('y'):
                cv2.destroyWindow('Preview - Press Y to accept, N to retry')
                return True
            elif key == ord('n'):
                cv2.destroyWindow('Preview - Press Y to accept, N to retry')
                return False
    
    def capture_reference_face(self, save_path):
        """Capture a reference face image"""
        print("Capturing reference face...")
        print("Please maintain a natural position and press 'q' when ready.")
        print("Press 'x' to cancel capture.")
        
        while True:
            ret, frame = self.video_capture.read()
            face_locations = face_recognition.face_locations(frame)
            display_frame = frame.copy()
            
            if len(face_locations) == 1:
                if self.check_face_size(face_locations[0]):
                    cv2.putText(display_frame, "Face detected - Press 'q' to capture", 
                              (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                else:
                    cv2.putText(display_frame, "Move a bit closer", (10, 30), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            elif len(face_locations) > 1:
                cv2.putText(display_frame, "Only one face allowed", (10, 30), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            else:
                cv2.putText(display_frame, "No face detected", (10, 30), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            cv2.imshow('Capture Reference Face', display_frame)
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q') and len(face_locations) == 1:
                if self.show_preview(frame, face_locations[0]):
                    cv2.imwrite(save_path, frame)
                    print(f"Successfully saved reference face to: {save_path}")
                    break
                else:
                    print("Capture cancelled - Please try again")
                    continue
            elif key == ord('x'):
                print("Capture cancelled")
                break
        
        cv2.destroyAllWindows()
    
    async def validate_face(self, file):
        
        reference_image = file_image(file.read())
        # Load and encode reference image
        reference_face_locations = face_recognition.face_locations(reference_image)
        
        if not reference_face_locations:
            print("No face found in reference image")
            return False
        
        reference_encoding = face_recognition.face_encodings(reference_image, [reference_face_locations[0]])[0]
        print("Validating face... Press 'x' to cancel.")
        
        successful_validations = 0
        
        while True:
            ret, frame = self.video_capture.read()
            face_locations = face_recognition.face_locations(frame)
            display_frame = frame.copy()
            
            if len(face_locations) == 1:
                face_encoding = face_recognition.face_encodings(frame, face_locations)[0]
                matches = face_recognition.compare_faces([reference_encoding], face_encoding, 
                                                      tolerance=self.face_tolerance)
                
                if matches[0]:
                    successful_validations += 1
                    cv2.putText(display_frame, f"Face matched ({successful_validations}/{self.required_frames})", 
                              (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
                else:
                    cv2.putText(display_frame, "Face not matching", (10, 30), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            elif len(face_locations) > 1:
                cv2.putText(display_frame, "Only one face allowed", (10, 30), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            else:
                cv2.putText(display_frame, "No face detected", (10, 30), 
                          cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            
            cv2.imshow('Validation', display_frame)
            
            if successful_validations >= self.required_frames:
                print("Authentication successful!")
                cv2.destroyAllWindows()
                return True
            
            key = cv2.waitKey(1) & 0xFF
            if key == ord('x'):
                print("Validation cancelled")
                cv2.destroyAllWindows()
                return False
    
    def cleanup(self):
        self.video_capture.release()

if __name__ == "__main__":
    auth_system = FaceAuthSystem()
    
    # Create images directory if it doesn't exist
    os.makedirs("reference_images", exist_ok=True)
    
    while True:
        print("\n1. Capture reference face")
        print("2. Validate face")
        print("3. Exit")
        choice = input("Enter your choice (1-3): ")
        
        if choice == "1":
            username = input("Enter username: ")
            image_path = os.path.join("reference_images", f"{username}.jpg")
            auth_system.capture_reference_face(image_path)
        elif choice == "2":
            username = input("Enter username to validate: ")
            image_path = os.path.join("reference_images", f"{username}.jpg")
            auth_system.validate_face(image_path)
        elif choice == "3":
            auth_system.cleanup()
            break
        else:
            print("Invalid choice!")