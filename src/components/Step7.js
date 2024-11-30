// src/components/Step7.js
import React, { useState } from 'react';
import axios from 'axios';
import styles from './Step7.module.css';

const Step7 = () => {
  const [files, setFiles] = useState(null);

  const handleFileChange = (event) => {
    setFiles(event.target.files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!files || files.length === 0) {
      alert('Please upload at least one file.');
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(response.data.message);
    } catch (error) {
      console.error('Error uploading files:', error);
    }
  };

  return (
    <div className={styles.uploadForm}>
      <h2>Upload File</h2>
      <form onSubmit={handleSubmit}>
        <label>Files to be uploaded:</label>
        <ul>
          <li>Affidavit</li>
          <li>Form3 Certificate</li>
          <li>Fire Safety</li>
          <li>Site Plan</li>
        </ul>
        <input type="file" multiple onChange={handleFileChange} />
        <button type="submit" className={styles.submitButton}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default Step7;
