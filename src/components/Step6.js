import React, { useState } from "react";
import styles from "./Step6.module.css";

const Step6 = () => {
  const [bankDetails, setBankDetails] = useState({
    bankName: "",
    bankIfscCode: "",
    bankAccountNumber: "",
    accountHolderName: "",
    branchName: "",
    branchCode: "",
    bankAddress: "",
    bankState: "",
    bankPin: "",
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setBankDetails({ ...bankDetails, [id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userName = "aman"; // Replace with dynamic user name
    const response = await fetch("http://localhost:5000/save-bank-details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userName, bankDetails }),
    });

    const data = await response.json();
    if (response.ok) {
      alert("Bank details saved successfully");
    } else {
      alert(`Error: ${data.message}`);
    }
  };

  return (
    <div className={styles.step6Container}>
      <div className={styles.header}>
        <h2>Institute Details</h2>
        <hr className={styles.horizontalLine} />
      </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputFields}>
          <div className={styles.inputGroup}>
            <label htmlFor="bankName" className={styles.label}>
              Bank Name:
            </label>
            <input
              type="text"
              id="bankName"
              className={styles.input}
              value={bankDetails.bankName}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="bankIfscCode" className={styles.label}>
              Bank IFSC Code:
            </label>
            <input
              type="text"
              id="bankIfscCode"
              className={styles.input}
              value={bankDetails.bankIfscCode}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="bankAccountNumber" className={styles.label}>
              Bank Account Number:
            </label>
            <input
              type="text"
              id="bankAccountNumber"
              className={styles.input}
              value={bankDetails.bankAccountNumber}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="accountHolderName" className={styles.label}>
              Account Holder Name:
            </label>
            <input
              type="text"
              id="accountHolderName"
              className={styles.input}
              value={bankDetails.accountHolderName}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="branchName" className={styles.label}>
              Branch Name:
            </label>
            <input
              type="text"
              id="branchName"
              className={styles.input}
              value={bankDetails.branchName}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="branchCode" className={styles.label}>
              Branch Code:
            </label>
            <input
              type="text"
              id="branchCode"
              className={styles.input}
              value={bankDetails.branchCode}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="bankAddress" className={styles.label}>
              Address of Bank:
            </label>
            <input
              type="text"
              id="bankAddress"
              className={styles.input}
              value={bankDetails.bankAddress}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="bankState" className={styles.label}>
              State:
            </label>
            <input
              type="text"
              id="bankState"
              className={styles.input}
              value={bankDetails.bankState}
              onChange={handleChange}
            />
          </div>
          <div className={styles.inputGroup}>
            <label htmlFor="bankPin" className={styles.label}>
              PIN:
            </label>
            <input
              type="text"
              id="bankPin"
              className={styles.input}
              value={bankDetails.bankPin}
              onChange={handleChange}
            />
          </div>
        </div>
        <button type="submit" className={styles.submitButton}>Save</button>
      </form>
    </div>
  );
};

export default Step6;
