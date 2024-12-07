import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './ScrutinyPage.module.css';

const ScrutinyPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const extractedData = location.state?.extractedData;

  // Handle case where no data is available
  if (!extractedData || extractedData.length === 0) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Scrutiny Page</h2>
        <p className={styles.noDataMessage}>No data available to display.</p>
        <button className={styles.backButton} onClick={() => navigate('/approval-process')}>
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Scrutiny Page</h2>
      {extractedData.map((file, index) => (
        <div className={styles.fileCard} key={index}>
          <h3 className={styles.fileName}>{file.filename}</h3>
          <ul className={styles.dataList}>
            {Object.entries(file.ocrData).map(([key, value]) => (
              <li className={styles.dataListItem} key={key}>
                <span className={styles.dataLabel}>{key}:</span>
                <span className={styles.dataValue}>{value}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button className={styles.backButton} onClick={() => navigate('/approval-process')}>
        Back to Home
      </button>
    </div>
  );
};

export default ScrutinyPage;
