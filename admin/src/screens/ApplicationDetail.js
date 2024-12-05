import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const ApplicationDetail = () => {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/application/${applicationId}`
        );
        setApplication(response.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchApplicationDetails();
  }, [applicationId]);

  const handleValidateUpload = async (uploadId) => {
    // try {
    //   await axios.post(`http://localhost:5000/api/upload/validate/${uploadId}`);
    //   alert("Upload validated successfully!");
    //   // Optionally, refresh the application data
    // } catch (err) {
    //   console.error(err);
    //   alert("Failed to validate upload.");
    // }
  };

  if (!application) {
    return <p>Loading...</p>;
  }

  const { applicationDetails, uploads } = application;

  return (
    <div>
      <h1>Application Details</h1>
      <h2>Type: {applicationDetails.type}</h2>
      <h3>Institute Name: {applicationDetails.instituteName}</h3>
      <h4>Contact Details:</h4>
      <pre>{JSON.stringify(applicationDetails.contactDetails, null, 2)}</pre>

      <h4>Uploads</h4>
      <div>
        {uploads.map((upload, index) => (
          <div
            key={index}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <p>Filename: {upload.filename}</p>
            <a href={upload.url} target="_blank" rel="noopener noreferrer">
              View Document
            </a>
            <p>DocResult: {JSON.stringify(upload.docResult, null, 2)}</p>
            <p>Verified: {upload.is_verified ? "Yes" : "No"}</p>
            <p>Remark: {upload.remark}</p>
            {!upload.is_verified && (
              <button
                onClick={() => handleValidateUpload(upload._id)}
                style={{ marginTop: "10px" }}
              >
                Validate
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApplicationDetail;
