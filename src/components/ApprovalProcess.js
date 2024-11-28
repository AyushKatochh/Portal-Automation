// src/components/ApprovalProcess.js
import React, { useState } from 'react';
import styles from './ApprovalProcess.module.css';
import Step1 from './Step1'; // Import Step1 component
import Step2 from './Step2';
import Step3 from "./Step3";
import Step4 from './Step4';
const ApprovalProcess = () => {
  const [currentStep, setCurrentStep] = useState(1); // State for current step

  const steps = [
    'Questionnaire',
    'Institute',
    'Contact',
    'Programme',
    'Infrastructure Details',
    'Fee Structure',
    'Documents Upload',
    'Payment',
    'Review',
    'Submission',
  ];

  const handleStepClick = (stepNumber) => {
    setCurrentStep(stepNumber);
  };

  return (
    <div className={styles.approvalProcessPage}>
      <nav className={styles.navbar}>
        <div className={styles.connectingLine}></div>
        <ul className={styles.stepsList}>
          {steps.map((step, index) => (
            <li key={index} className={styles.stepItem}>
              <div
                className={styles.stepLink}
                onClick={() => handleStepClick(index + 1)} // Call handleStepClick
              >
                <div className={styles.stepCircle}>{index + 1}</div>
                <span className={styles.stepLabel}>{step}</span>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.content}> {/* Add content container */}
        {currentStep === 1 && <Step1 />} {/* Conditionally render Step1 */}
        {currentStep === 2 && <Step2 />}
        {currentStep === 3 && <Step3 />}
        {currentStep === 4 && <Step4 />}

      </div>
    </div>
  );
};

export default ApprovalProcess;