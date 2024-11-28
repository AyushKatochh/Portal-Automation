// src/components/Step4.js
import React from 'react';
import styles from './Step4.module.css';

const Step4 = () => {
  const programDetails = [
    { programName: 'ENGINEERING AND TECHNOLOGY', programStatus: 'Existing Programme' },
    { programName: 'MANAGEMENT', programStatus: 'Existing Programme' },
    { programName: 'ARCHITECTURE', programStatus: 'New Programme' },
    { programName: 'PHARMACY', programStatus: 'Existing Programme' },
    // Add more entries as needed
  ];

  return (
    <div className={styles.step4Container}>
      <table className={styles.programTable}>
        <thead>
          <tr>
            <th>Programme Name</th>
            <th>New/Existing Programme</th>
          </tr>
        </thead>
        <tbody>
          {programDetails.map((program, index) => (
            <tr key={index}>
              <td>{program.programName}</td>
              <td>{program.programStatus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Step4;