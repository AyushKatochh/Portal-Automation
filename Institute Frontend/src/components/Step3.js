import React, { useState } from "react";
import styles from "./Step3.module.css";

const Step3 = () => {
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

  const handleChange = (e) => {
    setContactDetails({ ...contactDetails, [e.target.id]: e.target.value });
  };

  const handleSave = async () => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    console.log("LocalStorage Data:", userData);
  
    if (!userData || !userData.userName || !userData.instituteName) {
      alert("User data not found in localStorage.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/save-contact-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Institute-Name": userData.instituteName, // Send instituteName in the headers
        },
        body: JSON.stringify({
          userName: userData.userName, // Pass the userName from localStorage
          contactDetails, // Pass the contactDetails to save
        }),
      });
  
      const result = await response.json();
      console.log("Response:", result);
  
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
              value={contactDetails[key]}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>
      <button onClick={handleSave} className={styles.saveButton}>
        Save Details
      </button>
    </div>
  );
};

export default Step3;
