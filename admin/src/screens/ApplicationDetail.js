import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import Modal from "../components/Modal";
<<<<<<< HEAD
import { motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./ApplicationDetail.module.css";
import Navbar from "./Navbar";
=======
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faMapMarkerAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import styles from './ApplicationDetail.module.css'; 
>>>>>>> main

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
<<<<<<< HEAD
    setModalMessage(
      `Are you sure you want to ${action.toLowerCase()} this ${actionType} request?`
    );
=======
    setModalMessage(`Are you sure you want to ${action.toLowerCase()} this ${actionType} request?`);
>>>>>>> main
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

<<<<<<< HEAD
  // Helper function to recursively render fields with motion
  const renderFields = (data) => {
    if (typeof data === "object" && data !== null) {
      return Object.entries(data).map(([key, value]) => (
        <motion.div
          key={key}
          className={styles.nestedField}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <label className={styles.nestedLabel}>{key}:</label>
          {typeof value === "object" && value !== null ? (
            <div className={styles.nestedFields}>{renderFields(value)}</div>
          ) : (
            <span className={styles.nestedValue}>{value}</span>
          )}
        </motion.div>
=======
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
>>>>>>> main
      ));
    } else {
      return <span className={styles.nestedValue}>{data}</span>;
    }
  };

<<<<<<< HEAD
  const fieldValidationLabels = {
    document_type: "Document Type",
    certificate_number: "Certificate Number",
    issuing_authority: "Issuing Authority",
    issuance_date: "Issuance Date",
    expiry_date: "Expiry Date",
    fire_equipment_details: "Fire Equipment Details",
    signatures: "Digital Signature",
    signer_name: "Signer Name",
    signing_time: "Signing Time",
    "certificate.validity.not_before": "Certificate Valid From",
    "certificate.validity.not_after": "Certificate Valid To",
    "certificate.issuer": "Certificate Issuer",
    "certificate.subject.common_name": "Certificate Holder",
    "certificate.subject.serial_number": "Certificate Serial Number",
  };

  return (
    <div>
      <Navbar name="Scrutiny" activeKey={"Document Verification"} />
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
            <button
              className={styles.approveButton}
              onClick={() =>
                handleAction("Approve", applicationId, "application")
              }
            >
              Approve
            </button>
            <button
              className={styles.rejectButton}
              onClick={() =>
                handleAction("Reject", applicationId, "application")
              }
            >
              Reject
            </button>
          </motion.div>

          <h1 className={styles.title}>Application Details</h1>

          <motion.div
            className={styles.section}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h2>
              Type: <span>{applicationDetails.type}</span>
            </h2>
            <h3>
              Institute Name: <span>{applicationDetails.instituteName}</span>
            </h3>
          </motion.div>

          <motion.div
            className={styles.section}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h4>Contact Details</h4>
            <div className={styles.contactDetails}>
              <p>
                <FontAwesomeIcon icon={faUser} />{" "}
                {applicationDetails.contactDetails.firstName}{" "}
                {applicationDetails.contactDetails.lastName}
              </p>
              <p>
                <FontAwesomeIcon icon={faPhone} />{" "}
                {applicationDetails.contactDetails.mobileNumber}
              </p>
              <p>
                <FontAwesomeIcon icon={faMapMarkerAlt} />{" "}
                {applicationDetails.contactDetails.address},{" "}
                {applicationDetails.contactDetails.city},{" "}
                {applicationDetails.contactDetails.state} -{" "}
                {applicationDetails.contactDetails.postalCode}
              </p>
              <p>
                <FontAwesomeIcon icon={faEnvelope} />{" "}
                {applicationDetails.contactDetails.emailAddress}
              </p>
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
                  <p>
                    <strong>Filename:</strong> {upload.filename}
                  </p>
                  <a
                    href={upload.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Document
                  </a>
                  <p>
                    <strong>Document Result:</strong>
                  </p>
                  <div className={styles.docResultContainer}>
                    {/* Extract and style combined_result -> ocr_extraction */}
                    {upload.docResult.combined_result?.ocr_extraction && (
                      <div className={styles.ocrExtraction}>
                        <p className={styles.ocrExtractionLabel}> Details :</p>
                        <div className={styles.ocrExtractionFields}>
                          {Object.entries(
                            upload.docResult.combined_result.ocr_extraction
                          ).map(([subKey, subValue]) =>
                            subKey === "validity" &&
                            typeof subValue === "object" ? (
                              // Handle validity field separately
                              <div
                                key={subKey}
                                className={styles.validityField}
                              >
                                <span className={styles.ocrFieldKey}>
                                  {subKey}:
                                </span>
                                <div className={styles.validityDetails}>
                                  {Object.entries(subValue).map(
                                    ([validityKey, validityValue]) => (
                                      <div
                                        key={validityKey}
                                        className={styles.ocrField}
                                      >
                                        <span className={styles.ocrFieldKey}>
                                          {validityKey}:
                                        </span>
                                        <span className={styles.ocrFieldValue}>
                                          {validityValue}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Render other fields normally
                              <div key={subKey} className={styles.ocrField}>
                                <span className={styles.ocrFieldKey}>
                                  {subKey}:
                                </span>
                                <span className={styles.ocrFieldValue}>
                                  {subValue}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Extract and style validation_notes */}
                    {upload.docResult.validation_result?.validation_notes && (
                      <div className={styles.validationNotes}>
                        <p className={styles.validationNotesLabel}>
                          Validation Notes:
                        </p>
                        <div className={styles.validationNotesContent}>
                          <p>
                            {
                              upload.docResult.validation_result
                                .validation_notes
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Extract and style field_validations with is_valid */}
                    {upload.docResult.validation_result?.field_validations && (
                      <div className={styles.fieldValidations}>
                        <h5>Field Validations:</h5>
                        {Object.entries(
                          upload.docResult.validation_result.field_validations
                        ).map(([fieldKey, fieldValue]) => (
                          <div
                            key={fieldKey}
                            className={styles.validationField}
                          >
                            <p className={styles.validationFieldLabel}>
                              {fieldValidationLabels[fieldKey] || fieldKey}:{" "}
                              {/* Use the label or the original key if not found */}
                            </p>
                            <div
                              className={styles.validationFieldValue}
                              style={{
                                color: fieldValue.is_valid ? "green" : "red",
                              }}
                            >
                              {fieldValue.is_valid ? "Valid" : "Invalid"}
                            </div>
                            {fieldValue.notes && (
                              <p className={styles.validationFieldNotes}>
                                {fieldValue.notes}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rendering Potential Issues */}
                    {upload.docResult?.validation_result?.potential_issues && (
                      <div className={styles.potentialIssues}>
                        <h5>Potential Issues:</h5>
                        <ul>
                          {upload.docResult.validation_result.potential_issues.map(
                            (issue, index) => (
                              <li key={index}>{issue}</li>
                            )
                          )}
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
                        marginLeft: "5px",
                      }}
                    >
                      {upload.is_verified ? "Yes" : "No"}
                    </span>
                  </p>

                  <p>Remark: {upload.remark}</p>
                  {!upload.is_verified ? (
                    <>
                      {!upload.docResult?.validation_result
                        ?.potential_issues && (
                        <button
                          className={styles.approveButton}
                          onClick={() =>
                            handleAction("Approve", upload._id, "document")
                          }
                        >
                          Verify
                        </button>
                      )}
                      <button
                        className={styles.rejectButton}
                        onClick={() =>
                          handleAction("Reject", upload._id, "document")
                        }
                      >
                        Reject
                      </button>
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
=======
  return (
    <div className={styles.container}>
      <div className={styles.detailsBox}>
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
>>>>>>> main
    </div>
  );
};

export default ApplicationDetail;