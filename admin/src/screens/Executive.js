import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import styles from './Executive.module.css'; // Import the CSS Module

const Executive = () => {
  const [application, setApplication] = useState(null);
  const { applicationId } = useParams();

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/track-application/${applicationId}`);
        const data = response.data;

        // Log the response for verification
        console.log('API Response:', data);

        // Extract application_id, status, and stage
        const filteredData = {
          application_id: data.logs_id?.application_id || 'Unknown Application ID',
          status: data.logs_id?.status || 'Unknown Status',
          stage: data.logs_id?.stage || {}, // Include stage if needed
        };

        setApplication(filteredData);
      } catch (error) {
        console.error('Error tracking application:', error);
        alert('Failed to track application.');
      }
    };

    fetchApplication();
  }, [applicationId]);

  if (!application) {
    return <div>Loading...</div>;
  }

  // Determine the status color
  let statusColor;
  switch (application.status) {
    case 'In Progress':
      statusColor = 'orange'; // For "In Progress"
      break;
    case 'Verified':
      statusColor = 'green'; // For "Verified"
      break;
    case 'Pending':
      statusColor = 'red'; // For "Pending"
      break;
    default:
      statusColor = 'gray'; // Default color for unknown status
      break;
  }

  return (
    <div className={styles.applicationDetails}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <h1 className={styles.navLeft}>Executive Member</h1>
        <p className={styles.navRight}>Application ID: {application.application_id}</p>
      </nav>

      {/* Application Details Container */}
      <div className={styles.detailsWrapper}>
        <h2>Application Details</h2>
        <div className={styles.statusWrapper}>
          <p>Status: <span className={styles.status} style={{ color: statusColor }}>{application.status}</span></p>
        </div>

        {/* Display stage data in a table */}
        <h3>Stage Details</h3>
        <table className={styles.stageTable}>
          <tbody>
            {Object.keys(application.stage).map((key) => (
              <tr key={key}>
                <td className={styles.keyCell}>{key}</td>
                <td className={styles.valueCell}>{JSON.stringify(application.stage[key])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Executive;
