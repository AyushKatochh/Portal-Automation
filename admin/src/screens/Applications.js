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
  const adminUsername = localStorage.getItem('adminUsername');

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
    if (adminCommittee === 'Scrutiny') {
      navigate(`/scrutiny/${applicationId}`);
    } else if (adminCommittee === 'Expert Visit') {
      navigate(`/evc/${applicationId}`);
    } else if (adminCommittee === 'Executive') {
      navigate(`/executive/${applicationId}`);
    }
  };

  return (
    <div>
    <Navbar 
        name={adminCommittee} 
        activeKey={adminName} 
        adminId={adminId}  // Pass adminId as a prop
      /> 
    <div className={styles.page}>

      <main className={styles.mainContent}>

        <div className={styles.grid}>
          {applications.map((application) => (
            <div key={application.applicationId} className={styles.card}>
              <FontAwesomeIcon icon={faBuilding} className={styles.icon} />
              <h3 className={styles.cardTitle}>{application.type}</h3>
              <p className={styles.cardText}>Institute: {application.instituteName}</p>
              <p className={styles.cardText}>Status: {application.status}</p>
              <p className={styles.cardText}>
                Deadline: {new Date(application.deadline).toLocaleDateString()}
              </p>
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