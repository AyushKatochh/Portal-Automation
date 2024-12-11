import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Modal from "../components/Modal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faMapMarkerAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import styles from './ApplicationDetail.module.css'; 

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [actionType, setActionType] = useState("");
  const [id, setId] = useState(null);
  const [action, setAction] = useState(null);

  const handleAction = (action, objectId, actionType) => {
    setId(objectId);
    setModalMessage(`Are you sure you want to ${action.toLowerCase()} this ${actionType} request?`);
    setAction(action);
    setActionType(actionType);
    setIsModalOpen(true);
  };

  const handleModalResponse = async (confirm, remark, action) => {
    setIsModalOpen(false);

    if (actionType === "document") {
      if (confirm) {
        try {
          const payload = { remark, action, applicationId, id };
          const response = await axios.post(
            "http://localhost:5000/api/verify-document",
            payload
          );
          alert(response.data.message || "Operation successful!");
        } catch (error) {
          console.error("Error verifying document:", error);
          alert("An error occurred while processing the request.");
        }
      } else {
        alert("Action cancelled.");
      }
    }

    if (actionType === "application") {
      if (confirm) {
        try {
          const payload = { remark, action, applicationId };
          const response = await axios.post(
            "http://localhost:5000/api/verify-scrutiny",
            payload
          );
          alert(response.data.message || "Operation successful!");
        } catch (error) {
          console.error("Error verifying application:", error);
          alert("An error occurred while processing the request.");
        }
      } else {
        alert("Action cancelled.");
      }
    }
  };

  if (!application) {
    return <p>Loading...</p>;
  }

  const { applicationDetails, uploads } = application;

  const renderContactInputs = (contactDetails) => {
    return Object.keys(contactDetails).map((key) => (
      <div className={styles.inputGroup} key={key}>
        <label htmlFor={key} className={styles.label}>
          {key.charAt(0).toUpperCase() + key.slice(1)}
        </label>
        <input
          type="text"
          id={key}
          name={key}
          defaultValue={contactDetails[key]}
          className={styles.inputField}
        />
      </div>
    ));
  };

  // Helper function to recursively render fields
  const renderFields = (data) => {
    if (typeof data === 'object' && data !== null) {
      return Object.entries(data).map(([key, value]) => (
        <div key={key} className={styles.nestedField}>
          <label className={styles.nestedLabel}>{key}:</label>
          {typeof value === 'object' && value !== null ? (
            <div className={styles.nestedFields}>{renderFields(value)}</div> 
          ) : (
            <span className={styles.nestedValue}>{value}</span>
          )}
        </div>
      ));
    } else {
      return <span className={styles.nestedValue}>{data}</span>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.detailsBox}>
                  <>
                    <button className={styles.approveButton} onClick={() => handleAction("Approve", applicationId, "application")}>Approve</button>
                    <button className={styles.rejectButton} onClick={() => handleAction("Reject", applicationId, "application")}>Reject</button>
                  </>
        <h1 className={styles.title}>Application Details</h1>
        <div className={styles.section}>
          <h2>Type: <span>{applicationDetails.type}</span></h2>
          <h3>Institute Name: <span>{applicationDetails.instituteName}</span></h3>
        </div>

        <div className={styles.section}>
          <h4>Contact Details</h4>
          <div className={styles.contactDetails}>
            <p><FontAwesomeIcon icon={faUser} /> {applicationDetails.contactDetails.firstName} {applicationDetails.contactDetails.lastName}</p>
            <p><FontAwesomeIcon icon={faPhone} /> {applicationDetails.contactDetails.mobileNumber}</p>
            <p><FontAwesomeIcon icon={faMapMarkerAlt} /> {applicationDetails.contactDetails.address}, {applicationDetails.contactDetails.city}, {applicationDetails.contactDetails.state} - {applicationDetails.contactDetails.postalCode}</p>
            <p><FontAwesomeIcon icon={faEnvelope} /> {applicationDetails.contactDetails.emailAddress}</p>
          </div>
        </div>

        <div className={styles.section}>
          <h4>Uploads</h4>
          <div className={styles.uploads}>
            {uploads.map((upload, index) => (
              <div key={index} className={styles.uploadCard}>
                <p>Filename: {upload.filename}</p>
                <a href={upload.url} target="_blank" rel="noopener noreferrer">View Document</a>
                <p>DocResult:</p>
                <div className={styles.docResultContainer}>
                  {Object.entries(upload.docResult).map(([key, value]) => (
                    <div key={key} className={styles.nestedObject}>
                      <p className={styles.docResultLabel}>{key}:</p>
                      <div className={styles.nestedFields}>
                        {renderFields(value)} 
                      </div>
                    </div>
                  ))}
                </div>
                <p>Verified: {upload.is_verified ? "Yes" : "No"}</p>
                <p>Remark: {upload.remark}</p>
                {!upload.is_verified ? (
                  <>
                    <button className={styles.approveButton} onClick={() => handleAction("Approve", upload._id, "document")}>Verify</button>
                    <button className={styles.rejectButton} onClick={() => handleAction("Reject", upload._id, "document")}>Reject</button>
                  </>
                ) : (
                  <h6>Verified</h6>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleModalResponse}
        message={modalMessage}
        action={action}
      />
    </div>
  );
};

export default ApplicationDetail;