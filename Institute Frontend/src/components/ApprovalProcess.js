import React, { useState, useEffect } from 'react';
import styles from './ApprovalProcess.module.css';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import Step5 from './Step5';
import Step6 from './Step6';
import Step7 from './Step7';
import  navbarImage from '../assets/banner.jpg';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';

const ApprovalProcess = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [instituteName, setInstituteName] = useState('');

  const { applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch application data by ID
    const fetchApplication = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/application/${applicationId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch application.');
        }

        setApplication(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplication();
  }, [applicationId]);

  const steps = [
    'Contact',
    'Programme',
    'Land Details',
    'Bank Details',
    'Upload File'
  ];

  useEffect(() => {
    // Fetch user data from local storage
    const storedUserData = JSON.parse(localStorage.getItem('userData'));

    if (storedUserData) {
      setUserName(storedUserData.userName);
      setInstituteName(storedUserData.instituteName);
    } else {
      // Handle case where user data is not found (e.g., redirect to login)
      console.error("User data not found in local storage.");
    }
  }, []);

  const handleStepClick = (stepNumber) => {
    setCurrentStep(stepNumber);
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const goToNextStep = () => {
    if (currentStep < steps.length) setCurrentStep(currentStep + 1);
  };


  const submitApplication = async () => {
    try {
      // Validate applicationId
      if (!applicationId) {
        alert("Application ID is required.");
        return;
      }
  
      // Create the request body
      const requestBody = { applicationId };
  
      // Make the fetch call to the backend
      const response = await fetch("http://localhost:5000/api/submit-application", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
  
      // Parse the response
      const data = await response.json();
  
      if (response.ok) {
        console.log("Application submitted successfully:", data);
        alert("Application submitted successfully.");
      } else {
        console.error("Error submitting application:", data);
        alert(data.message || "Error submitting application.");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Unexpected error occurred. Please try again.");
    }
  };
  

  return (
    <div className={styles.ApprovalProcessPage}>
      
      <Navbar name={instituteName} activeKey={"Application Form"}/>
      <div className={styles.pageContainer}>
        <nav className={styles.navbar}>
              <div><button className={styles.uploadButton} onClick={submitApplication}>Final Submit</button></div>
          <div className={styles.userId}>
            User: {userName} ({instituteName})
          </div>
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
        {application && <div className={styles.content}>
          {currentStep === 1 && <Step3 application={application.applicationDetails} applicationId={applicationId} updateApplication={(updatedApplication) => setApplication(updatedApplication)}/>}
          {currentStep === 2 && <Step4 />}
          {currentStep === 3 && <Step5 application={application.applicationDetails} applicationId={applicationId} updateApplication={(updatedApplication) => setApplication(updatedApplication)}/>}
          {currentStep === 4 && <Step6 application={application.applicationDetails} applicationId={applicationId} updateApplication={(updatedApplication) => setApplication(updatedApplication)}/>}
          {currentStep === 5 && <Step7 application={application.uploads} applicationId={applicationId} updateApplication={(updatedApplication) => setApplication(updatedApplication)}/>}

        </div>}
      </div>
    </div>
  );
};

export default ApprovalProcess;