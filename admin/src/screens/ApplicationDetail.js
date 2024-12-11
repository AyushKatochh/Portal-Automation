import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Modal from "../components/Modal";
import { motion } from 'framer-motion'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faMapMarkerAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import styles from './ApplicationDetail.module.css'; 
import Navbar from "./Navbar";

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
        return (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
          >
            <p>Loading...</p>
          </motion.div>
        );
    }

    const { applicationDetails, uploads } = application;

    // Helper function to recursively render fields with motion
    const renderFields = (data) => {
      if (typeof data === 'object' && data !== null) {
        return Object.entries(data).map(([key, value]) => (
          <motion.div
            key={key}
            className={styles.nestedField}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <label className={styles.nestedLabel}>{key}:</label>
            {typeof value === 'object' && value !== null ? (
              <div className={styles.nestedFields}>{renderFields(value)}</div>
            ) : (
              <span className={styles.nestedValue}>{value}</span>
            )}
          </motion.div>
        ));
      } else {
        return <span className={styles.nestedValue}>{data}</span>;
      }
    };

    return (
      <div>
      <Navbar name="Scrutiny" activeKey={'Document Verification'} />
        <motion.div 
            className={styles.container}
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.5 }}
        >
            <motion.div 
                className={styles.detailsBox}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div 
                    className={styles.buttonContainer}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <button className={styles.approveButton} onClick={() => handleAction("Approve", applicationId, "application")}>Approve</button>
                    <button className={styles.rejectButton} onClick={() => handleAction("Reject", applicationId, "application")}>Reject</button>
                </motion.div>

                <h1 className={styles.title}>Application Details</h1>

                <motion.div 
                    className={styles.section}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <h2>Type: <span>{applicationDetails.type}</span></h2>
                    <h3>Institute Name: <span>{applicationDetails.instituteName}</span></h3>
                </motion.div>

                <motion.div 
                    className={styles.section}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <h4>Contact Details</h4>
                    <div className={styles.contactDetails}>
                        <p><FontAwesomeIcon icon={faUser} /> {applicationDetails.contactDetails.firstName} {applicationDetails.contactDetails.lastName}</p>
                        <p><FontAwesomeIcon icon={faPhone} /> {applicationDetails.contactDetails.mobileNumber}</p>
                        <p><FontAwesomeIcon icon={faMapMarkerAlt} /> {applicationDetails.contactDetails.address}, {applicationDetails.contactDetails.city}, {applicationDetails.contactDetails.state} - {applicationDetails.contactDetails.postalCode}</p>
                        <p><FontAwesomeIcon icon={faEnvelope} /> {applicationDetails.contactDetails.emailAddress}</p>
                    </div>
                </motion.div>

                <motion.div 
                    className={styles.section}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <h4>Uploads</h4>
                    <div className={styles.uploads}>
                        {uploads.map((upload, index) => (
                            <motion.div 
                                key={index} 
                                className={styles.uploadCard}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 * index + 0.6 }} 
                            >
                                <p>Filename: {upload.filename}</p>
                                <a href={upload.url} target="_blank" rel="noopener noreferrer">View Document</a>
                                <p>DocResult:</p>
                                <div className={styles.docResultContainer}>


    {/* Extract and style combined_result -> ocr_extraction */}
    {upload.docResult.combined_result?.ocr_extraction && (
        <div className={styles.ocrExtraction}>
            <p className={styles.ocrExtractionLabel}>OCR Extraction:</p>
            <div className={styles.ocrExtractionFields}>
                {Object.entries(upload.docResult.combined_result.ocr_extraction).map(([subKey, subValue]) => (
                    subKey === "validity" && typeof subValue === "object" ? (
                        // Handle validity field separately
                        <div key={subKey} className={styles.validityField}>
                            <span className={styles.ocrFieldKey}>{subKey}:</span>
                            <div className={styles.validityDetails}>
                                {Object.entries(subValue).map(([validityKey, validityValue]) => (
                                    <div key={validityKey} className={styles.ocrField}>
                                        <span className={styles.ocrFieldKey}>{validityKey}:</span>
                                        <span className={styles.ocrFieldValue}>{validityValue}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Render other fields normally
                        <div key={subKey} className={styles.ocrField}>
                            <span className={styles.ocrFieldKey}>{subKey}:</span>
                            <span className={styles.ocrFieldValue}>{subValue}</span>
                        </div>
                    )
                ))}
            </div>
        </div>
    )}

    {/* Extract and style validation_notes */}
    {upload.docResult.validation_result?.validation_notes && (
        <div className={styles.validationNotes}>
            <p className={styles.validationNotesLabel}>Validation Notes:</p>
            <div className={styles.validationNotesContent}>
                <p>{upload.docResult.validation_result.validation_notes}</p>
            </div>
        </div>
    )}

    {/* Extract and style field_validations with is_valid */}
    {upload.docResult.validation_result?.field_validations && (
        <div className={styles.fieldValidations}>
            <h5>Field Validations:</h5>
            {Object.entries(upload.docResult.validation_result.field_validations).map(
                ([fieldKey, fieldValue]) => (
                    <div key={fieldKey} className={styles.validationField}>
                        <p className={styles.validationFieldLabel}>{fieldKey}:</p>
                        <div
                            className={styles.validationFieldValue}
                            style={{
                                color: fieldValue.is_valid ? "green" : "red",
                            }}
                        >
                            {fieldValue.is_valid ? "Valid" : "Invalid"}
                        </div>
                        {fieldValue.notes && (
                            <p className={styles.validationFieldNotes}>{fieldValue.notes}</p>
                        )}
                    </div>
                )
            )}
        </div>
    )}

    {/* Rendering Potential Issues */}
    {upload.docResult?.validation_result?.potential_issues && (
        <div className={styles.potentialIssues}>
            <h5>Potential Issues:</h5>
            <ul>
                {upload.docResult.validation_result.potential_issues.map((issue, index) => (
                    <li key={index}>{issue}</li>
                ))}
            </ul>
        </div>
    )}
</div>




<p>
  Verified: 
  <span 
    className={styles.verifiedBox} 
    style={{
      backgroundColor: upload.is_verified ? "green" : "red",
      color: "white",
      padding: "5px 10px",
      borderRadius: "15px",
      display: "inline-block",
      marginLeft: "5px"
    }}
  >
    {upload.is_verified ? "Yes" : "No"}
  </span>
</p>

                                <p>Remark: {upload.remark}</p>
                                {!upload.is_verified ? (
                                    <>
                                        <button className={styles.approveButton} onClick={() => handleAction("Approve", upload._id, "document")}>Verify</button>
                                        <button className={styles.rejectButton} onClick={() => handleAction("Reject", upload._id, "document")}>Reject</button>
                                    </>
                                ) : (
                                    <h6>Verified</h6>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleModalResponse}
                message={modalMessage}
                action={action}
            />
        </motion.div>
        </div>
    );
};

export default ApplicationDetail;