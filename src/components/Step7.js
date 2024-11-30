// src/components/Step7.js
import React from 'react';
import styles from './Step7.module.css';

const Step7 = () => {
  const handleSubmit = () => {
    alert("Files submitted successfully!");
  };

  return (
    <div className={styles.step7Container}>
      <div className={styles.header}>
        <h2>Upload File</h2>
        <hr className={styles.horizontalLine} />
      </div>
      <div className={styles.fileUploadSection}>
        {[
          "Affidavit",
          "Form3 Certificate",
          "Fire Safety",
          "Site Plan",
        ].map((fileType, index) => (
          <div key={index} className={styles.uploadGroup}>
            <label htmlFor={fileType.toLowerCase().replace(/\s+/g, '-')} className={styles.label}>
              {fileType}:
            </label>
            <input
              type="file"
              id={fileType.toLowerCase().replace(/\s+/g, '-')}
              className={styles.inputFile}
            />
          </div>
        ))}
      </div>
      <div className={styles.submitSection}>
        <button className={styles.submitButton} onClick={handleSubmit}>
          Submit
        </button>
      </div>
    </div>
  );
};

export default Step7;
