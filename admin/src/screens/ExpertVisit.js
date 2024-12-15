import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
<<<<<<< HEAD
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaEye, FaFileAlt } from 'react-icons/fa';
import Modal from "../components/Modal";
import styles from './ExpertVisit.module.css';
import Navbar from "./Navbar";
=======
import Modal from "../components/Modal";
import styles from './ExpertVisit.module.css';
>>>>>>> main

const ExpertVisit = () => {
  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
<<<<<<< HEAD
  const [uploads, setUploads] = useState([]);
  const adminCommittee = localStorage.getItem('adminCommittee');
=======
>>>>>>> main

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/application/${applicationId}`
        );
        setApplication(response.data);
<<<<<<< HEAD
        setUploads(response.data.uploads || []); // Initialize uploads
=======
>>>>>>> main
      } catch (err) {
        console.error(err);
      }
    };

    fetchApplicationDetails();
  }, [applicationId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [actionType, setActionType] = useState("");
<<<<<<< HEAD
  const [id, setId] = useState(null);
  const [action, setAction] = useState(null);

  const handleAction = (action, objectId, actionType) => {
    setId(objectId);
    setModalMessage(
      `Are you sure you want to ${action.toLowerCase()} this ${actionType} request?`
    );
    setAction(action);
    setActionType(actionType);
=======
  const [id, setid] = useState(null);
  const [action, setaction] = useState(null);

  const handleAction = (action, objectId, actiontype) => {
    setid(objectId);
    setModalMessage(
      `Are you sure you want to ${action.toLowerCase()} this ${actiontype} request?`
    );
    setaction(action);
    setActionType(actiontype);
>>>>>>> main
    setIsModalOpen(true);
  };

  const handleExpertVisitResponse = async (confirm, remark, action) => {
    setIsModalOpen(false);

    if (confirm) {
      try {
        if (!remark || !action || !applicationId) {
          throw new Error(
            "All parameters (remark, action, applicationId, id) are required."
          );
        }

        const payload = {
          remark,
          action,
          applicationId,
          id,
        };

        const response = await axios.post(
          "http://localhost:5000/api/verify-expert-visit",
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        alert(response.data.message || "Operation successful!");
        return response.data;
      } catch (error) {
        alert(
          error.response?.data?.message ||
            "An error occurred while processing the request."
        );
      }
    } else {
      alert("Action cancelled.");
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    if (uploads.length > 0) {
      const sitePlanUploads = uploads.filter(upload => upload.docName === "site_plan");
      setUploads(sitePlanUploads);
    }
  }, [uploads]);

  const renderContactInputs = (contactDetails) => {
    return Object.keys(contactDetails || {}).map((key) => (
      <motion.div 
        className={styles.inputGroup} 
        key={key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
=======
  if (!application) {
    return <p>Loading...</p>;
  }

  const { applicationDetails, uploads } = application;

  const renderContactInputs = (contactDetails) => {
    return Object.keys(contactDetails).map((key) => (
      <div className={styles.inputGroup} key={key}>
>>>>>>> main
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
<<<<<<< HEAD
      </motion.div>
    ));
  };

  const renderDocResult = (docResult) => {
    if (!docResult || typeof docResult !== "string") {
      return null; // Ensure `docResult` is valid and a string
    }
  
    return (
      <div className={styles.docResultContainer}>
        <ReactMarkdown
          components={{
            p: ({ node, ...props }) => (
              <motion.p
                {...props}
              />
            ),
          }}
        >
          {docResult}
        </ReactMarkdown>
      </div>
    );
  };
  
  
  if (!application) {
    return (
      <motion.div 
        className={styles.loadingContainer}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <p>Loading Application Details...</p>
      </motion.div>
    );
  }

  const { applicationDetails } = application;

  return (
    <motion.div 
      className={styles.container}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Navbar name={"Dashboard"} activeKey="Expert Visit Committee" />

      
      <motion.div 
        className={styles.applicationInfo}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.subheading}>Application Details</h2>
        <div className={styles.detailsGrid}>
          <div>
            <strong>Type:</strong> {applicationDetails?.type}
          </div>
          <div>
            <strong>Institute Name:</strong> {applicationDetails?.instituteName}
          </div>
        </div>
      </motion.div>

      <motion.div 
        className={styles.actionButtons}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
=======
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
      <h1 className={styles.heading}>Expert Visit Committee</h1>
      <h2 className={styles.subheading}>Application Details</h2>
      <div className={styles.applicationInfo}>
        <h3>Type: {applicationDetails.type}</h3>
        <h4>Institute Name: {applicationDetails.instituteName}</h4>
      </div>

      <div className={styles.actionButtons}>
>>>>>>> main
        <button
          className={styles.approveButton}
          onClick={() => handleAction("Approve", "", "application")}
        >
<<<<<<< HEAD
          <FaCheck /> Approve
=======
          Approve
>>>>>>> main
        </button>
        <button
          className={styles.rejectButton}
          onClick={() => handleAction("Reject", "", "application")}
        >
<<<<<<< HEAD
          <FaTimes /> Reject
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h4 className={styles.sectionTitle}>Contact Details:</h4>
        <form className={styles.contactForm}>
          {renderContactInputs(applicationDetails?.landDetails)}
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className={styles.obox}
      >
        <h4 className={styles.sectionTitle}>Uploads</h4>
        {uploads.map((upload, index) => (
          <motion.div 
            key={index} 
            className={styles.uploadContainer}
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <div className={styles.uploadHeader}>
              <FaFileAlt /> 
              <span>Filename: {upload.filename}</span>
            </div>
            <div className={styles.uploadActions}>
              <a 
                href={upload.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.viewDocumentLink}
              >
                <FaEye /> View Document
              </a>
            </div>
            
            <div className={styles.uploadDetails}>
              <div className={styles.docResultSection}>
                <h5>Document Analysis:</h5>
                {renderDocResult(upload.docResult)}
              </div>
              
              <div className={styles.verificationStatus}>
                <p>
                  <strong>Verified:</strong> 
                  {upload.is_verified ? (
                    <span className={styles.verifiedStatus}><FaCheck /> Verified</span>
                  ) : (
                    <span className={styles.unverifiedStatus}><FaTimes /> Not Verified</span>
                  )}
                </p>
                <p><strong>Remark:</strong> {upload.remark || 'No remarks'}</p>
              </div>

              {!upload.is_verified && (
                <div className={styles.verificationActions}>
                  <button
                    className={styles.approveButton}
                    onClick={() => handleAction("Approve", upload._id, "document")}
                  >
                    <FaCheck /> Verify
                  </button>
                  <button
                    className={styles.rejectButton}
                    onClick={() => handleAction("Reject", upload._id, "document")}
                  >
                    <FaTimes /> Reject
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleExpertVisitResponse}
        message={modalMessage}
        action={action}
      />
    </motion.div>
=======
          Reject
        </button>
      </div>

      <h4 className={styles.sectionTitle}>Contact Details:</h4>
      <form className={styles.contactForm}>
        {renderContactInputs(applicationDetails.contactDetails)}
      </form>

      <h4 className={styles.sectionTitle}>Uploads</h4>
      <div>
        {uploads.map((upload, index) => (
          <div key={index} className={styles.uploadContainer}>
            <p>Filename: {upload.filename}</p>
            <a href={upload.url} target="_blank" rel="noopener noreferrer">
              View Document
            </a>
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
                <button
                  className={styles.approveButton}
                  onClick={() =>
                    handleAction("Approve", upload._id, "document")
                  }
                >
                  Verify
                </button>
                <button
                  className={styles.rejectButton}
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
>>>>>>> main
  );
};

export default ExpertVisit;