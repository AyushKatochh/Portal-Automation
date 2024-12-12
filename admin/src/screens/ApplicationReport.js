import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import styles from './ApplicationDetails.module.css';
import ReactMarkdown from 'react-markdown';
import Navbar from './Navbar';

const ApplicationReport = () => {
  const { applicationId } = useParams();
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplicationReport = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/applications/${applicationId}/details`);
        setApplicationData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch application details');
        setLoading(false);
      }
    };

    fetchApplicationReport();
  }, [applicationId]);

  if (loading) {
    return <div className={styles.loader}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  const { instituteName, applicationType, assignedAdmins, deadline, uploads } = applicationData;

  return (
    <>
    <Navbar name={'Report'} activeKey={instituteName}/>
    <div className={styles.container} style={{marginTop:'80px'}}>
      <h1 className={styles.title}>Application Report</h1>
      <div className={styles.details}>
        <p><strong>Institution Name:</strong> {instituteName}</p>
        <p><strong>Application Type:</strong> {applicationType}</p>
        <p><strong>Assigned To:</strong> {assignedAdmins.join(', ')}</p>
        {/* <p><strong>Deadline:</strong> {new Date(deadline).toLocaleDateString()}</p> */}
      </div>
      <div className={styles.detials}>
      <h2 className={styles.subTitle}>Details</h2>

      <ReactMarkdown
        >
          {applicationData.report}
        </ReactMarkdown>
      </div>
      <h2 className={styles.subTitle}>Uploaded Documents</h2>
      <div className={styles.documents}>
        {uploads.map((upload, index) => (
          <div key={index} className={styles.document}>
            <p><strong>Document Name:</strong> {upload.docName}</p>
            <p><strong>Verification Complete:</strong> {upload.isVerificationComplete ? 'Yes' : 'No'}</p>
            <p><strong>Verified:</strong> {upload.isVerified ? 'Yes' : 'No'}</p>
            <p><strong>Remark:</strong> {upload.remark || 'N/A'}</p>
            <a href={upload.url} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>
              View Document
            </a>
          </div>
        ))}
      </div>
    </div>
        </>
  );
};

export default ApplicationReport;
