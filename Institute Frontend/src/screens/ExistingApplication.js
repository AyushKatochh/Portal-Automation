// ExistingApplication.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ExistingApplication.css'; 

const ExistingApplication = () => {
  const [applications, setApplications] = useState([]);
  const navigate = useNavigate(); 
  const userData = JSON.parse(localStorage.getItem('userData'));

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/institute-applications', {
          params: {
            institute_id: userData.instituteId,
            is_complete: false,
          },
        });
        setApplications(response.data);
      } catch (error) {
        console.error('Error fetching applications:', error);
        alert('Failed to load applications.');
      }
    };

    fetchApplications();
  }, [userData.instituteId]);

  const handleViewDetails = (applicationId) => {
    navigate(`/approval-process/${applicationId}`);
  };

  return (
    <div className="applications-container">
      <h2 className="applications-heading">Your Applications</h2>
      <div className="applications-grid">
        {applications.map((app) => (
          <div key={app._id} className="application-card">
            <h3>{app.type}</h3>
            <p>Institute: {app.instituteName}</p>
            <p>Status: {app.is_complete ? 'Complete' : 'Incomplete'}</p>
            <button onClick={() => handleViewDetails(app._id)}>
              Complete Application
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExistingApplication;