// src/components/Footer.js
import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  const content = 
  `Admin: The status of the Approval Process for GROUP-2 Institutions has been updated. 
    The last date for submission is 09th Dec, 2024. Please review and approve the pending applications. 
    All reports are available for download.`

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
