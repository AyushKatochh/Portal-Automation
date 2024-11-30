// src/components/Footer.js
import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  const content = `
    Login for Applying for Approval 2025-26 for GROUP-2 Institutions is ENABLED at this moment. 
    Last date for Submission of Application and Payment of TER Charges for GROUP-2 Institutions is 09th Dec, 2024. 
    Kindly Submit your Approval Process Application as soon as possible to avoid last minute rush. 
    All the reports will be available for download during the Application Submission phase (25th November 2024 to 09th Dec 2024). 
    Login of the Institutions who have applied for Approval Process 2025-26 under GROUP-1 Institutions are TEMPORARILY DISABLED. 
    Institutions can upload their documents @ https://documents.aicte-india.org.`;

  return (
    <div className={styles.footer}>
      <div className={styles.marquee}>
        <div className={styles.marqueeContent}>{content}</div>
        <div className={styles.marqueeContent}>{content}</div> {/* Duplicate content for seamless scroll */}
      </div>
    </div>
  );
};

export default Footer;
