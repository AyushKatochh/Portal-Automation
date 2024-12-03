import React, { useState } from 'react';
import axios from 'axios'; // You'll need axios to send HTTP requests
import styles from './Step7.module.css';
import Loader from "../assets/loader.gif";

const Step7 = () => {
  const [documents, setDocuments] = useState([
    'Affidavit',
    'MOU',
    'Fire Safety',
    'Architect Certificate',
    'Land Conversion',
  ]);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [selectedDoc, setSelectedDoc] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [successMessage, setSuccessMessage] = useState(''); // Success message state

  const handleDropdownChange = (event) => {
    setSelectedDoc(event.target.value);
  };

  const handleFileChange = (event) => {
    if (selectedDoc && event.target.files[0]) {
      setUploadedDocs((prevDocs) => ({
        ...prevDocs,
        [selectedDoc]: event.target.files[0],
      }));
      setSelectedDoc(''); // Reset dropdown after upload
    }
  };

  const handlePreview = (docName) => {
    setPreviewDoc(uploadedDocs[docName]);
  };

  const handleReupload = (docName) => {
    setPreviewDoc(null); // Close preview window if open
    setUploadedDocs((prevDocs) => {
      const updatedDocs = { ...prevDocs };
      delete updatedDocs[docName];
      return updatedDocs;
    });
  };

  // Check if all documents are uploaded
  const allDocsUploaded = documents.every((doc) => uploadedDocs[doc]);

  const handleSubmit = async () => {
    if (!allDocsUploaded) return; // Prevent submission if documents are missing

    setIsLoading(true); // Show the loader
    setSuccessMessage(''); // Clear any previous success message

    // Prepare form data to send to backend
    const formData = new FormData();
    Object.entries(uploadedDocs).forEach(([docName, file]) => {
      formData.append(docName, file);
    });

    try {
      // Make the POST request to upload files
      const response = await axios.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        console.log('Files uploaded successfully:', response.data);

        // Set success message
        setSuccessMessage(
          'Your files have been successfully submitted for verification. Please check the status for updates.'
        );

        // Clear uploaded documents
        setUploadedDocs({});
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setSuccessMessage('There was an error submitting your files. Please try again.');
    } finally {
      setIsLoading(false); // Hide the loader once upload is complete
    }
  };

  return (
    <div className={styles.uploadForm}>
      <h2>Upload Documents</h2>
      <hr />

      {/* Dropdown and file input */}
      <div className={styles.dropdownContainer}>
        <select
          value={selectedDoc}
          onChange={handleDropdownChange}
          className={styles.dropdown}
        >
          <option value="">Select Document</option>
          {documents
            .filter((doc) => !uploadedDocs[doc])
            .map((doc) => (
              <option key={doc} value={doc}>
                {doc}
              </option>
            ))}
        </select>
        {selectedDoc && (
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
        )}
      </div>

      {/* Uploaded documents */}
      <div className={styles.uploadedDocsContainer}>
        {Object.entries(uploadedDocs).map(([docName, file]) => (
          <div key={docName} className={styles.uploadedDocRow}>
            <span
              className={styles.docName}
              onClick={() => handlePreview(docName)}
            >
              {docName}: {file.name}
            </span>
            <button
              className={styles.editButton}
              onClick={() => handleReupload(docName)}
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {/* Preview window */}
      {previewDoc && (
        <div className={styles.previewWindow}>
          <h3>Preview: {previewDoc.name}</h3>
          <iframe
            src={URL.createObjectURL(previewDoc)}
            className={styles.previewIframe}
            title="Document Preview"
          ></iframe>
        </div>
      )}

      {/* Submit button, only visible when all documents are uploaded */}
      {allDocsUploaded && (
        <button className={styles.submitButton} onClick={handleSubmit}>
          Submit
        </button>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className={styles.loaderContainer}>
          <img src={Loader} alt="Loading..." className={styles.loader} />
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className={styles.successMessage}>
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default Step7;
