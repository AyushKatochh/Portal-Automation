import React, { useState } from 'react';
import axios from 'axios';
import styles from './Step7.module.css';

const DOCUMENT_KEYWORDS = {
  "fire_safety_certificate": [
      "certificate_number", "issuing_authority", "issuance_date", 
      "expiry_date", "fire_equipment_details"
  ],
  "land_conversion_certificate": [
      "certificate_number", "issuing_authority", "issue_date", 
      "validity_period", "applicant_name", "contact_information", 
      "location", "area_of_land"
  ],
  "affidavit": [
      "stamp_paper_type", "notary_registration_number", 
      "oath_commissioner_name", "verification_place", 
      "verification_date", "executant_name", "executant_designation"
  ],
  "bank_certificate": [
      "account_holder_name", "account_number", "bank_name", 
      "bank_address", "fdr_details", "balance_verification", 
      "certificate_date", "certificate_place"
  ],
  "architect_certificate": [
      "approval_authority", "approval_number", "approval_date", 
      "room_details", "occupancy_certificate", "structural_stability_certificate"
  ],
  "mou_document": [
      "indian_institute_name", "foreign_institute_name", 
      "document_reference_number", "date_of_issue", 
      "event_date", "event_time", "venue", "purpose", 
      "key_participants"
  ],
  "occupancy_certificate": [
      "memo_number", "date_of_issue", "holding_number", 
      "street", "ward_number", "building_type"
  ]
}

const Step7 = () => {
  const [dropdownOptions, setDropdownOptions] = useState([
    { label: 'Affidavit', key: 'affidavit' },
    { label: 'Form3 Certificate', key: 'form3' },
    { label: 'Fire Safety', key: 'fire_safety' },
    { label: 'Site Plan', key: 'site_plan' },
  ]);
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);  // To store the document preview

  const handleDropdownChange = (event) => {
    const selectedKey = event.target.value;
    const selected = dropdownOptions.find((option) => option.key === selectedKey);
    setSelectedOption(selected);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && selectedOption) {
      const formData = new FormData();
      formData.append('files', file); // Ensure 'files' matches the server-side field name
  
      // Perform the upload
      axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }).then(response => {
        console.log('Upload successful:', response.data);
      }).catch(error => {
        console.error('Error uploading documents:', error);
      });
  
      // Update state as before
      setUploadedDocuments((prev) => ({
        ...prev,
        [selectedOption.key]: { file, label: selectedOption.label },
      }));
  
      setDropdownOptions((prev) =>
        prev.filter((option) => option.key !== selectedOption.key)
      );
      setSelectedOption(null); // Reset selection after upload
    }
  };

  const handleSubmit = async () => {
    try {
      // 1. Iterate through the uploaded documents
      for (const key in uploadedDocuments) {
        const file = uploadedDocuments[key].file;
        const docType = uploadedDocuments[key].key; // Get the document type key
  
        // 2. Create FormData for each file
        const formData = new FormData();
        formData.append('files', file);
  
        // 3. Get keywords based on document type
        const keywords = DOCUMENT_KEYWORDS[docType] || []; 
        formData.append('keywords', JSON.stringify(keywords)); 
  
        // 4. Send each file to /ocr_and_extract
        const extractResponse = await axios.post('http://localhost:8000/ocr_and_extract', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log(`Extraction Response for ${key}:`, extractResponse.data); 
  
        // 5. (Optional) Handle the extracted data from each response
        //    Here you can process `extractResponse.data` for each document,
        //    e.g., store it in a state variable, display it to the user, etc. 
      }
  
      // 6. After all files are processed, send the submit request (if needed)
      //    This request might be used to signal the backend that all 
      //    extractions are complete or to send some aggregated data.
      const response = await axios.post('http://localhost:5000/submit', { 
        documentTypes: Object.keys(uploadedDocuments) 
      });
      console.log('Submit response:', response.data); 
  
      alert('Documents submitted and processed successfully!');
  
    } catch (error) {
      console.error('Error submitting or extracting:', error);
      alert('Error processing documents. Please try again.');
    }
  };

  const handleDocumentClick = (docKey) => {
    // Set the document preview (assuming the file is an image/PDF)
    setPreviewDoc(uploadedDocuments[docKey].file);
  };

  const handleReupload = (docKey) => {
    // Allow re-uploading the file for that particular document
    setSelectedOption({
      label: uploadedDocuments[docKey].label,
      key: docKey,
    });
    setUploadedDocuments((prev) => {
      const newDocs = { ...prev };
      delete newDocs[docKey]; // Remove the current document to allow re-upload
      return newDocs;
    });
  };

  return (
    <div className={styles.uploadForm}>
      <h2>Upload Required Documents</h2>

      {/* Dropdown to select document type */}
      {dropdownOptions.length > 0 && (
        <div>
          <select value={selectedOption?.key || ''} onChange={handleDropdownChange}>
            <option value="" disabled>
              Select Document Type
            </option>
            {dropdownOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          {selectedOption && (
            <div>
              <label>
                Upload {selectedOption.label}:
                <input type="file" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Uploaded document list */}
      <div>
        <h3>Uploaded Documents</h3>
        {Object.keys(uploadedDocuments).length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <ul>
            {Object.keys(uploadedDocuments).map((key) => (
              <li key={key}>
                <span
                  className={styles.docName}
                  onClick={() => handleDocumentClick(key)}
                >
                  {uploadedDocuments[key].label}: {uploadedDocuments[key].file.name}
                </span>
                <button
                  className={styles.editButton}
                  onClick={() => handleReupload(key)}
                >
                  Re-upload
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Preview window */}
      {previewDoc && (
        <div className={styles.previewWindow}>
          <h3>Document Preview:</h3>
          <iframe
            className={styles.previewIframe}
            src={URL.createObjectURL(previewDoc)}
            title="Document Preview"
          ></iframe>
        </div>
      )}

      {/* Submit button */}
      {dropdownOptions.length === 0 && (
        <button className={styles.submitButton} onClick={handleSubmit}>
          Submit All Documents
        </button>
      )}
    </div>
  );
};

export default Step7;
