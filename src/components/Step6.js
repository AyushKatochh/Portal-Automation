// src/components/Step6.js
import React from "react";
import styles from "./Step6.module.css";

const Step6 = () => {
  return (
    <div className={styles.step6Container}>
     <div className={styles.header}> {/* Added header container */}
        <h2>Institute Details</h2>
        <hr className={styles.horizontalLine} /> {/* Added horizontal line */}
      </div>
      <div className={styles.inputFields}>
        <div className={styles.inputGroup}>
          <label htmlFor="bankName" className={styles.label}>
            Bank Name:
          </label>
          <input type="text" id="bankName" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="bankIfscCode" className={styles.label}>
            Bank IFSC Code:
          </label>
          <input type="text" id="bankIfscCode" className={styles.input} />
        </div>
        {/* Add other input fields similarly */}
        <div className={styles.inputGroup}>
          <label htmlFor="bankAccountNumber" className={styles.label}>
            Bank Account Number:
          </label>
          <input type="text" id="bankAccountNumber" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="accountHolderName" className={styles.label}>
            Account Holder Name:
          </label>
          <input type="text" id="accountHolderName" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="branchName" className={styles.label}>
            Branch Name:
          </label>
          <input type="text" id="branchName" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="branchCode" className={styles.label}>
            Branch Code:
          </label>
          <input type="text" id="branchCode" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="bankAddress" className={styles.label}>
            Address of Bank:
          </label>
          <input type="text" id="bankAddress" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="bankState" className={styles.label}>
            State:
          </label>
          <input type="text" id="bankState" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="bankPin" className={styles.label}>
            PIN:
          </label>
          <input type="text" id="bankPin" className={styles.input} />
        </div>
      </div>
    </div>
  );
};

export default Step6;