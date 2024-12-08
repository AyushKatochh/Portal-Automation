import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import styles from './Executive.module.css'; // Import the CSS Module

const Executive = () => {
  const [application, setApplication] = useState(null);
  const [selectedStage, setSelectedStage] = useState('document_verification'); // Default to 'document_verification'
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
          status_logs: data.status_logs || [],
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

  // Render nested tables for each stage
  const renderNestedTable = (nestedObj) => {
    return (
      <table className={styles.stageTable}>
        <tbody>
          {Object.keys(nestedObj).map((key) => (
            <tr key={key}>
              <td className={styles.keyCell}>{key}</td>
              <td className={styles.valueCell}>{JSON.stringify(nestedObj[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // Conditional rendering for different stage tables
  const renderStageContent = () => {
    const stageData = application.stage[selectedStage];

    if (!stageData) {
      return <div>No data available for this stage.</div>;
    }

    return (
      <>
        <h3>{selectedStage.replace('_', ' ').toUpperCase()} Details</h3>
        {renderNestedTable(stageData)}
      </>
    );
  };

  return (
    <div className={styles.container}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <h2>Application Status</h2>
        <p>Status: <span className={styles.status} style={{ color: statusColor }}>{application.status}</span></p>
        <div className={styles.options}>
          <button onClick={() => setSelectedStage('document_verification')} className={styles.optionButton}>Document Verification</button>
          <button onClick={() => setSelectedStage('expert_visit_stage')} className={styles.optionButton}>Expert Visit</button>
          <button onClick={() => setSelectedStage('final_stage')} className={styles.optionButton}>Final Stage</button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.mainContent}>
        <h2>Application Details</h2>
        {renderStageContent()}
      </div>
    </div>
  );
};

export default Executive;
