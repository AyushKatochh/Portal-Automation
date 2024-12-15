import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const TrackApplication = () => {
  const [application, setApplication] = useState(null);
  const { applicationId } = useParams();

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/track-application/${applicationId}`);
        setApplication(response.data);
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

  return (
    <div className="application-details">
      <h2>{application.type}</h2>
      <p>Institute: {application.instituteName}</p>
      <h3>Logs:</h3>
      <pre>{JSON.stringify(application.logs_id, null, 2)}</pre>
    </div>
  );
};

export default TrackApplication;
