import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './HomeLink.module.css';
import { FaFileAlt, FaEdit, FaCheckCircle, FaCalendarAlt } from 'react-icons/fa';
import loaderGif from '../assets/loader.gif'; // Replace this with a modern loader
import Navbar from './Navbar';
import leftIcon from "../assets/aicte_logo.png"; // Replace with your left icon image path

const HomeLink = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const userData = JSON.parse(localStorage.getItem('userData'));

  const handleNewApplicationClick = async () => {
    setIsLoading(true);

    try {
      if (!userData || !userData.instituteId) {
        throw new Error('Institute ID not found in local storage.');
      }

      const response = await fetch('http://localhost:5000/api/create-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instituteId: userData.instituteId,
          type: 'New Application',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create application.');
      }

      navigate(`/approval-process/${data.applicationId}`);
    } catch (error) {
      console.error('Error creating application:', error.message);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExistingApplication = () => navigate('/existing-application');
  const handleMyApplication = () => navigate('/my-application');

  return (
    <div className={styles.homeLinkContainer}>
      <img src={leftIcon} alt="" width={500} height={100} />
      <h1 className={styles.header}>Welcome to the Portal</h1>
      <div className={styles.horizontalLine}></div>

      {isLoading ? (
        <div className={styles.loaderContainer}>
          <img src={loaderGif} alt="Loading..." className={styles.loader} />
          <p className={styles.loaderText}>Loading, please wait...</p>
        </div>
      ) : (
        <div className={styles.cardContainer}>
          <div className={styles.card} onClick={handleNewApplicationClick}>
            <FaFileAlt className={styles.icon} />
            <h2 className={styles.cardTitle}>New Application</h2>
            <p className={styles.cardDescription}>
              Start a fresh application for approval.
            </p>
          </div>
          <div className={styles.card} onClick={handleExistingApplication}>
            <FaEdit className={styles.icon} />
            <h2 className={styles.cardTitle}>Existing Application</h2>
            <p className={styles.cardDescription}>
              View and edit your ongoing application.
            </p>
          </div>
          <div className={styles.card} onClick={handleMyApplication}>
            <FaCheckCircle className={styles.icon} />
            <h2 className={styles.cardTitle}>My Application</h2>
            <p className={styles.cardDescription}>
              Check the status of submitted applications.
            </p>
          </div>
          {/* <div className={styles.card}>
            <FaCalendarAlt className={styles.icon} />
            <h2 className={styles.cardTitle}>Extension of Application</h2>
            <p className={styles.cardDescription}>
              Apply for an extension of your existing application.
            </p>
          </div> */}
        </div>
      )}
    </div>
  );
};

export default HomeLink;
