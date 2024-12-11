import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faIdBadge, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import styles from './Applications.module.css';
import Navbar from "./Navbar";

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const navigate = useNavigate();

  const adminId = localStorage.getItem('adminId');
  const adminCommittee = localStorage.getItem('adminCommittee');
  const adminName = localStorage.getItem('adminName');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/admin/${adminId}/applications`);
        setApplications(response.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchApplications();
  }, [adminId]);

  const handleViewDetails = (applicationId) => {
    const routes = {
      Scrutiny: `/scrutiny/${applicationId}`,
      'Expert Visit': `/evc/${applicationId}`,
      Executive: `/executive/${applicationId}`
    };
    navigate(routes[adminCommittee]);
  };

  return (
    <div>
      <Navbar name={adminCommittee} activeKey={adminName}/> 
      <div className={styles.page}>
        <main className={styles.mainContent}>
          <h1 className={styles.heading}>Applications</h1>
          <div className={styles.grid}>
            {applications.map((application) => (
              <div key={application.applicationId} className={styles.card}>
                <div className={styles.cardHeader}>
                  <FontAwesomeIcon icon={faBuilding} className={styles.icon} />
                  <h3 className={styles.cardTitle}>{application.type}</h3>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardText}><strong>Institute:</strong> {application.instituteName}</p>
                  <p className={styles.cardText}><strong>Status:</strong> {application.status}</p>
                  <p className={styles.cardText}><strong>Deadline:</strong> {new Date(application.deadline).toLocaleDateString()}</p>
                </div>
                <button
                  className={styles.button}
                  onClick={() => handleViewDetails(application.applicationId)}
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Applications;
