import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Modal from "../components/Modal";

const ExpertVisit = () => {
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [actionType, setActionType] = useState("");
  const [id, setid] = useState(null);
  const [action, setaction] = useState(null);

  const handleAction = (action, objectId, actiontype) => {
    console.log(objectId);
    setid(objectId);
    setModalMessage(
      `Are you sure you want to ${action.toLowerCase()} this ${actiontype} request?`
    );
    setaction(action);
    setActionType(actiontype);
    setIsModalOpen(true);
  };


  const handleExpertVisitResponse = async (confirm, remark, action) => {
    setIsModalOpen(false);

      if (confirm) {
        try {
          console.log(remark, action, applicationId);
          // Validate input parameters
          if (!remark || !action || !applicationId) {
            throw new Error(
              "All parameters (remark, action, applicationId, id) are required."
            );
          }

          // Prepare the request payload
          const payload = {
            remark,
            action,
            applicationId,
            id,
          };

          console.log(payload);

          // Make the API call
          const response = await axios.post(
            "http://localhost:5000/api/verify-expert-visit",
            payload,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          // Handle success response
          alert(response.data.message || "Operation successful!");
          console.log("Response:", response.data);

          return response.data;
        } catch (error) {
          // Handle errors
          console.error("Error verifying document:", error);
          alert(
            error.response?.data?.message ||
              "An error occurred while processing the request."
          );
        }
      } else {
        alert("Action cancelled.");
      }
  };



  if (!application) {
    return <p>Loading...</p>;
  }

  const { applicationDetails, uploads } = application;

  return (
    <div>
        <h1>Expert Visit committee</h1>
      <h2>Application Details</h2>
      <h2>Type: {applicationDetails.type}</h2>
      <h3>Institute Name: {applicationDetails.instituteName}</h3>
      <button
        className="approve-button"
        onClick={() => handleAction("Approve", "", "application")}
      >
        Approve
      </button>
      <button
        className="reject-button"
        onClick={() => handleAction("Reject", "", "application")}
      >
        Reject
      </button>
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
            {!upload.is_verified ? (
              <>
                <button
                  className="approve-button"
                  onClick={() =>
                    handleAction("Approve", upload._id, "document")
                  }
                >
                  Verify
                </button>
                <button
                  className="reject-button"
                  onClick={() => handleAction("Reject", upload._id, "document")}
                >
                  Reject
                </button>
              </>
            ) : (
              <h6>Verified</h6>
            )}

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onConfirm={handleExpertVisitResponse}
              message={modalMessage}
              action={action}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpertVisit;
