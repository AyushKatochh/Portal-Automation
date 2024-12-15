// src/components/Step2.js
import React from 'react';
import styles from './Step2.module.css';

const Step2 = () => {
  return (
    <div className={styles.step2Container}>
      <div className={styles.leftContainer}>
      <div className={styles.header}> {/* Added header container */}
        <h2>Institute Details</h2>
        <hr className={styles.horizontalLine} /> {/* Added horizontal line */}
      </div>
        <div className={styles.profilePictureSection}>
          {/* Add profile picture upload functionality here */}
          <input type="file" accept="image/*" className={styles.fileInput} />
          <button className={styles.uploadButton}>Upload Profile Picture</button>
        </div>
      </div>
      <div className={styles.rightContainer}>
        <div className={styles.inputFields}>
          {/* Add input fields here */}
          <div className={styles.inputGroup}>
            <label htmlFor="currentApplicationNumber" className={styles.label}>
              Current Application Number:
            </label>
            <input type="text" id="currentApplicationNumber" className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="permanentInstituteId" className={styles.label}>
              Permanent Institute Id:
            </label>
            <input type="text" id="permanentInstituteId" className={styles.input} />
          </div>
          {/* Add other input fields similarly */}
          <div className={styles.inputGroup}>
            <label htmlFor="academicYear" className={styles.label}>
              Academic Year:
            </label>
            <input type="text" id="academicYear" className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="instituteCurrentStatus" className={styles.label}>
              Institute Current Status:
            </label>
            <input type="text" id="instituteCurrentStatus" className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="applicationOpenedDate" className={styles.label}>
              Application Opened Date:
            </label>
            <input type="date" id="applicationOpenedDate" className={styles.input} />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="overallDeficiency" className={styles.label}>
              Overall Deficiency (Y/N):
            </label>
            <select id="overallDeficiency" className={styles.input}>
              <option value="Y">Yes</option>
              <option value="N">No</option>
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="attendScrutinyCommitteeDate" className={styles.label}>
              Attend Scrutiny Committee Date:
            </label>
            <input type="date" id="attendScrutinyCommitteeDate" className={styles.input} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2;