import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import './Authenticate.css'
import Navbar from "./Navbar";

const Authenticate = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isSending, setIsSending] = useState(false); 

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  const sendToBackend = async () => {
    if (!capturedImage) return; 

    setIsSending(true);

    try {
      const response = await fetch('/api/upload', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', 
        },
        body: JSON.stringify({ image: capturedImage }), 
      });

      if (response.ok) {
        // Image sent successfully
        console.log('Image sent to backend!');
      } else {
        // Handle errors
        console.error('Error sending image:', response.status);
      }
    } catch (error) {
      console.error('Error sending image:', error);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    // Clean up the captured image when the component unmounts
    return () => {
      setCapturedImage(null);
    };
  }, []);

  return (
    <div>
      <Navbar />
      <div className="container">
        <h1>Authenticate</h1>
        <div className="webcam-container"> {/* New container for webcam and image */}
          <div className="webcam-frame">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
            />
          </div>
          {capturedImage && (
            <div className="captured-image-container"> {/* Container for captured image */}
              <h2>Captured Image:</h2>
              <img
                src={capturedImage}
                alt="Captured"
              />
            </div>
          )}
        </div>
        <div className="buttons-container"> {/* Container for buttons */}
          <button className="button" onClick={capture}>
            Authenticate
          </button>
          {capturedImage && (
            <button
              className="button"
              onClick={sendToBackend}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send to Backend'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Authenticate;