import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Step7.module.css';

const Step7 = ({ application, applicationId, updateApplication }) => {

  console.log(application)
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
  const [file, setFile] = useState(null);
  const [isLoading, setisLoading] = useState(false)


  useEffect(() => {
    if (application?.length) {
      const uploadedKeys = application.map((doc) => doc.docName);
      const alreadyUploadedDocs = {};
      application.forEach((doc) => {
        alreadyUploadedDocs[doc.docName] = {
          label: dropdownOptions.find((option) => option.key === doc.docName)?.label,
          fileName: doc.filename,
          url: doc.url,
        };
      });

      setUploadedDocuments(alreadyUploadedDocs);
      setDropdownOptions((prev) => prev.filter((option) => !uploadedKeys.includes(option.key)));
    }
  }, [application]);

  const handleDropdownChange = (event) => {
    const selectedKey = event.target.value;
    const selected = dropdownOptions.find((option) => option.key === selectedKey);
    setSelectedOption(selected);
  };

  const handleFileUpload = (event) => {
    const fileUploaded = event.target.files[0];
    setPreviewDoc(fileUploaded); // Corrected here
    console.log(fileUploaded); // Log the file to confirm
    setFile(fileUploaded);
  };
  

  const handleDocumentSubmit = async () => {
    if (!file || !selectedOption) return;

    setisLoading(true)
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('applicationId', applicationId);
      formData.append('docName', selectedOption.key);

      const response = await axios.post('http://localhost:5000/validate-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        setisLoading(false)
        alert(`${selectedOption.label} document saved successfully.`);
        setUploadedDocuments((prev) => ({
          ...prev,
          [selectedOption.key]: { label: selectedOption.label, fileName: file.name },
        }));
        setDropdownOptions((prev) => prev.filter((option) => option.key !== selectedOption.key));
        setSelectedOption(null);
        setFile(null);
      }
      setisLoading(false)
    } catch (error) {
      setisLoading(false)
      alert("Document is not digitally signed")
      console.error('Error submitting document:', error);
    }
  };

  return (
    <div className={styles.uploadForm}>
      <h2>Upload Required Documents</h2>


      <div className={styles.uploadedContainer}>
        <h3>Uploaded Documents</h3>
        {Object.keys(uploadedDocuments).length === 0 ? (
          <p>No documents uploaded yet.</p>
        ) : (
          <ul>
            {Object.keys(uploadedDocuments).map((key) => (
              <li key={key} className={styles.uploadedItem}>
                <span>{uploadedDocuments[key].label}</span>
                <button
                  className={styles.viewButton}
                  onClick={() => window.open(uploadedDocuments[key].url, '_blank')}
                >
                  View
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.dropdownContainer}>
        {dropdownOptions.length > 0 ? (
          <>
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
              <div className={styles.fileUpload}>
                <label>
                  Upload {selectedOption.label}:
                  <input type="file" onChange={handleFileUpload} />
                </label>
                <button className={styles.submitButton} onClick={handleDocumentSubmit}>
                  {isLoading? "Validating":"Submit"}
                </button>
              </div>
            )}
          </>
        ) : (
          <p>All documents uploaded.</p>
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




