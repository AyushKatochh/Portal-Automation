import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ScrutinyCommittee.module.css';

const DOCUMENT_KEYWORDS = {
  fire_safety_certificate: [
    "certificate_number",
    "issuing_authority",
    "issuance_date",
    "expiry_date",
    "fire_equipment_details",
  ],
  land_conversion_certificate: [
    "certificate_number",
    "issuing_authority",
    "issue_date",
    "validity_period",
    "applicant_name",
    "contact_information",
    "location",
    "area_of_land",
  ],
  affidavit: [
    "stamp_paper_type",
    "notary_registration_number",
    "oath_commissioner_name",
    "verification_place",
    "verification_date",
    "executant_name",
    "executant_designation",
  ],
  bank_certificate: [
    "account_holder_name",
    "account_number",
    "bank_name",
    "bank_address",
    "fdr_details",
    "balance_verification",
    "certificate_date",
    "certificate_place",
  ],
  architect_certificate: [
    "approval_authority",
    "approval_number",
    "approval_date",
    "room_details",
    "occupancy_certificate",
    "structural_stability_certificate",
  ],
  mou_document: [
    "indian_institute_name",
    "foreign_institute_name",
    "document_reference_number",
    "date_of_issue",
    "event_date",
    "event_time",
    "venue",
    "purpose",
    "key_participants",
  ],
};

const ScrutinyCommittee = () => {
  const [selectedDocument, setSelectedDocument] = useState("");
  const [formData, setFormData] = useState({});
  const navigate = useNavigate();

  const handleDocumentChange = (event) => {
    setSelectedDocument(event.target.value);
    setFormData({});
  };

  const handleInputChange = (key, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log("Submitted Data:", { documentType: selectedDocument, formData });
    alert("Form submitted successfully!");
  };

  return (
    <div className={styles.scrutinyContainer}>
      <h2>Scrutiny Committee Panel</h2>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        Back to Home
      </button>

      <div className={styles.formContainer}>
        <label htmlFor="documentType">Select Document Type:</label>
        <select
          id="documentType"
          value={selectedDocument}
          onChange={handleDocumentChange}
          className={styles.dropdown}
        >
          <option value="">Select Document</option>
          {Object.keys(DOCUMENT_KEYWORDS).map((docKey) => (
            <option key={docKey} value={docKey}>
              {docKey.replace(/_/g, " ").toUpperCase()}
            </option>
          ))}
        </select>

        {selectedDocument && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h3>{selectedDocument.replace(/_/g, " ").toUpperCase()}</h3>
            {DOCUMENT_KEYWORDS[selectedDocument].map((field) => (
              <div key={field} className={styles.formGroup}>
                <label htmlFor={field}>{field.replace(/_/g, " ")}</label>
                <input
                  type="text"
                  id={field}
                  value={formData[field] || ""}
                  onChange={(e) => handleInputChange(field, e.target.value)}
                  className={styles.input}
                />
              </div>
            ))}
            <button type="submit" className={styles.submitButton}>
              Submit
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ScrutinyCommittee;