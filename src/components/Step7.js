import React, { useState } from 'react';
import axios from 'axios';
import styles from './Step7.module.css';

const DOCUMENT_KEYWORDS = {
  // Same as before...
};

const Step7 = () => {
  const [dropdownOptions, setDropdownOptions] = useState([
    { label: 'Affidavit', key: 'affidavit' },
    { label: 'Form3 Certificate', key: 'form3' },
    { label: 'Fire Safety', key: 'fire_safety' },
    { label: 'Site Plan', key: 'site_plan' },
  ]);
  const [uploadedDocuments, setUploadedDocuments] = useState({});
  const [selectedOption, setSelectedOption] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

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

  const handleDocumentSubmit = async (docKey) => {
    try {
      const file = uploadedDocuments[docKey].file;
      const formData = new FormData();
      formData.append('files', file);

      // Send the document to validate endpoint
      const response = await axios.post('http://localhost:5000/validate-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.isValid) {
        alert(`${uploadedDocuments[docKey].label} is a valid document.`);
      } else {
        alert(`${uploadedDocuments[docKey].label} is not valid.`);
      }
    } catch (error) {
      console.error('Error validating document:', error);
      alert('Error validating document. Please try again.');
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
                  {uploadedDocuments[key].label}: {uploadedDocuments[key].file.name}
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
