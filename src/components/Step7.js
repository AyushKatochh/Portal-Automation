import React, { useState } from 'react';
import styles from './Step7.module.css';

const Step7 = () => {
  const [documents, setDocuments] = useState([
    'Affidavit',
    'Form3 Certificate',
    'Fire Safety',
    'Site Plan',
  ]);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [selectedDoc, setSelectedDoc] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

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
    </div>
  );
};

export default Step7;
