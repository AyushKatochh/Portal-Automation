// src/components/HomeLink.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomeLink.module.css';
import { FaFileAlt, FaEdit, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';
import loaderGif from '../assets/loader.gif'; // Ensure you have a loader GIF in the assets folder

const HomeLink = () => {
  const navigate = useNavigate(); // React Router hook for navigation
  const [isLoading, setIsLoading] = useState(false); // State for lazy loading

  const handleNewApplicationClick = () => {
    setIsLoading(true); // Show loader
    setTimeout(() => {
      setIsLoading(false); // Hide loader
      navigate('/approval-process'); // Navigate after 2 seconds
    }, 2000);
  };

  return (
    <div className={styles.homeLinkContainer}>
      <h1 className={styles.header}>Welcome to the Portal</h1>
      <div className={styles.horizontalLine}></div>

      {isLoading ? ( // Conditionally render the loader
        <div className={styles.loaderContainer}>
          <img src={loaderGif} alt="Loading..." className={styles.loader} />
          <p>Loading, please wait...</p>
        </div>
      ) : (
        <div className={styles.cardContainer}>
          {/* Card: New Application */}
          <div className={styles.card} onClick={handleNewApplicationClick}>
            <FaFileAlt className={styles.icon} />
            <h2 className={styles.cardTitle}>New Application</h2>
            <p className={styles.cardDescription}>
              Start a fresh application for approval.
            </p>
          </div>

          {/* Card: Existing Application */}
          <div
            className={styles.card}
            onClick={() => alert('Navigating to Existing Application')}
          >
            <FaEdit className={styles.icon} />
            <h2 className={styles.cardTitle}>Existing Application</h2>
            <p className={styles.cardDescription}>
              View and edit your ongoing application.
            </p>
          </div>

          {/* Card: My Application */}
          <div
            className={styles.card}
            onClick={() => alert('Navigating to My Application')}
          >
            <FaCheckCircle className={styles.icon} />
            <h2 className={styles.cardTitle}>My Application</h2>
            <p className={styles.cardDescription}>
              Check the status of submitted applications.
            </p>
          </div>

          {/* Card: Extension of Application */}
          <div
            className={styles.card}
            onClick={() => alert('Navigating to Extension of Application')}
          >
            <FaCalendarAlt className={styles.icon} />
            <h2 className={styles.cardTitle}>Extension of Application</h2>
            <p className={styles.cardDescription}>
              Apply for an extension of your existing application.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeLink;
