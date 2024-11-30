import React, { useState } from 'react';
import styles from './ApprovalProcess.module.css';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import Step5 from './Step5';
import Step6 from './Step6';
import Step7 from './Step7';
import navbarImage from '../assets/banner.jpg';

const ApprovalProcess = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    'Institute',
    'Contact',
    'Programme',
    'Land Details',
    'Bank Details',
    'Uplaod File'
  ];

  const handleStepClick = (stepNumber) => {
    setCurrentStep(stepNumber);
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const goToNextStep = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };

  return (
    <div className={styles.ApprovalProcessPage}>
      <img 
          src={navbarImage} 
          alt="Navbar" 
          className={styles.navbarImage} 
        />
      <div className={styles.pageContainer}>
      <nav className={styles.navbar}>
        <div className={styles.userId}>User ID: 12345</div>
        <div className={styles.userIdLine}></div>

        <div className={styles.stepsListContainer}>
          <div className={styles.arrow} onClick={goToPreviousStep}>
            &#8592; {/* Left Arrow */}
          </div>
          <ul className={styles.stepsList}>
            {steps.map((step, index) => (
              <li key={index} className={styles.stepItem}>
                <div
                  className={styles.stepLink}
                  onClick={() => handleStepClick(index + 1)}
                >
                  <div
                    className={`${styles.stepCircle} ${
                      currentStep === index + 1 ? styles.activeStep : ''
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span className={styles.stepLabel}>{step}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.arrow} onClick={goToNextStep}>
            &#8594; {/* Right Arrow */}
          </div>
        </div>
        <div
          className={
            currentStep === 1 || currentStep === steps.length
              ? styles.noConnectingLine
              : styles.connectingLine
          }
        ></div>
      </nav>
      <div className={styles.content}>
        {currentStep === 1 && <Step2 />}
        {currentStep === 2 && <Step3 />}
        {currentStep === 3 && <Step4 />}
        {currentStep === 4 && <Step5 />}
        {currentStep === 5 && <Step6 />}
        {currentStep === 6 && <Step7 />}

      </div>
    </div>
    </div>
  );
};

export default ApprovalProcess;
