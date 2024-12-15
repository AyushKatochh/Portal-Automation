import React, { useState } from 'react';
import axios from 'axios';
import styles from './Step7.module.css';

const DOCUMENT_KEYWORDS = {
  // Same as before...
};

const Step7 = ({applicationId}) => {
  const [dropdownOptions, setDropdownOptions] = useState([
    { label: 'Affidavit', key: 'affidavit' },
    { label: 'Land Conversion Certificate', key: 'land_conversion_certificate' },
    { label: 'Bank Certificate [3]', key: 'bank_certificate' },
    { label: 'Architect Certificate [2]', key: 'architect_certificate' },
    { label: 'MOU Document', key: 'mou_document' },
    { label: 'Fire Safety Certificate', key: 'fire_safety_certificate' },
    { label: 'Site Plan', key: 'site_plan' },
  ]);
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [file, setfile] = useState(null)

  const handleDropdownChange = (event) => {
    const selectedKey = event.target.value;
    const selected = dropdownOptions.find((option) => option.key === selectedKey);
    setSelectedOption(selected);
  };

  const handleFileUpload = (event) => {
    const fileUploaded = event.target.files[0];
    setfile(fileUploaded)

   
      setUploadedDocuments((prev) => ({
        ...prev,
        [selectedOption.key]: { file, label: selectedOption.label },
      }));
  
      setDropdownOptions((prev) =>
        prev.filter((option) => option.key !== selectedOption.key)
      );
      
    };
    ;
    
    const handleDocumentSubmit = async (docKey) => {
      try {
        
        const formData = new FormData();
        formData.append('file', file); // Key should be 'file' to match backend
        formData.append('applicationId', applicationId); // Add applicationId
        formData.append('docName', selectedOption.key); // Add key
        
        console.log(file); // Check if the file object is valid
        console.log(formData); // Verify the formData object contains the file
        
        const response = await axios.post('http://localhost:5000/validate-document', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        if (response.status=200) {
          setSelectedOption(null); // Reset selection after upload
          alert(`${uploadedDocuments[docKey].label} document saved.`);
        } else {
          alert(`${uploadedDocuments[docKey].label} is not digitally signed.`);
        }
      } catch (error) {
        console.error('Error validating document:', error);
        alert(`${uploadedDocuments[docKey].label} is not digitally signed.`);
    }
  };

  const handleDocumentClick = (docKey) => {
    setPreviewDoc(uploadedDocuments[docKey].file);
  };

  const handleReupload = (docKey) => {
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
            <option value="" disabled>Select Document Type</option>
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
                  {uploadedDocuments[key].label}: {uploadedDocuments[key]?.file?.name}
                </span>
                <button
                  className={styles.editButton}
                  onClick={() => handleReupload(key)}
                >
                  Re-upload
                </button>
                <button
                  className={styles.submitButton}
                  onClick={() => handleDocumentSubmit(key)}
                >
                  Submit for Validation
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

    </div>
  );
};

export default Step7;