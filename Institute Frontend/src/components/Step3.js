import React, { useState, useEffect } from "react";
import styles from "./Step3.module.css";

const Step3 = ({ application, applicationId, updateApplication }) => {
  // State for contact details
  const [contactDetails, setContactDetails] = useState({
    title: "",
    firstName: "",
    middleName: "",
    lastName: "",
    address: "",
    designation: "",
    state: "",
    city: "",
    postalCode: "",
    stdCode: "",
    mobileNumber: "",
    emailAddress: "",
  });

  // Synchronize state with application.contactDetails on mount or application change
  useEffect(() => {
    console.log(application)
    if (application?.contactDetails) {
      setContactDetails((prevDetails) => ({
        ...prevDetails,
        ...application.contactDetails,
      }));
    }
  }, [application]);

  // Handle input change
  const handleChange = (e) => {
    const { id, value } = e.target;
    setContactDetails((prevDetails) => ({
      ...prevDetails,
      [id]: value,
    }));
  };

  // Handle save button click
  const handleSave = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/save-contact-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          applicationId: applicationId,
        },
        body: JSON.stringify({ contactDetails }),
      });

      const result = await response.json();
      updateApplication(result?.application);

      if (response.ok) {
        alert("Details saved successfully!");
      } else {
        alert(result.message || "Failed to save details.");
      }
    } catch (error) {
      console.error("Error saving details:", error);
      alert("An error occurred while saving details.");
    }
  };

  return (
    <div className={styles.step3Container}>
      <div className={styles.header}>
        <h2>Contact</h2>
        <hr className={styles.horizontalLine} />
      </div>
      <div className={styles.inputFields}>
        {Object.keys(contactDetails).map((key) => (
          <div className={styles.inputGroup} key={key}>
            <label htmlFor={key} className={styles.label}>
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}:
            </label>
            <input
              type={key === "emailAddress" ? "email" : "text"}
              id={key}
              className={styles.input}
              value={contactDetails[key] || ""}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>
      <button onClick={handleSave} className={styles.uploadButton}>
        Save Details
      </button>
    </div>
  );
};

export default Step3;
