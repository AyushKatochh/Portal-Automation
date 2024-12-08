// ExistingApplication.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ExistingApplication.css'; 
import Navbar from '../components/Navbar';

const ExistingApplication = () => {
  const [applications, setApplications] = useState([]);
  const navigate = useNavigate(); 
  const userData = JSON.parse(localStorage.getItem('userData'));
  const [instituteName, setInstituteName] = useState('');


  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem('userData'));
    if (storedUserData) {
      setInstituteName(storedUserData.instituteName);
    } else {
      console.error('User data not found in local storage.');
    }
  }, []);

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
      <Navbar name={instituteName} activeKey="Existing Application" />
      <div className="application-grid">
        {applications.map((app) => (
          <div key={app._id} className="application-card">
            <h3 className="application-title">{app.type}</h3>
            <p className="application-info">
              <strong>Institute:</strong> {app.instituteName}
            </p>
            <p className="application-info">
              <strong>Status:</strong> {app.is_complete ? 'Complete' : 'Incomplete'}
            </p>
            <button
              className="track-button"
              onClick={() => handleViewDetails(app._id)}
            >
              Complete Your Application
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExistingApplication;