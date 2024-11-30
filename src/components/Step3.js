// src/components/Step3.js
import React from 'react';
import styles from './Step3.module.css';

const Step3 = () => {
  return (
    <div className={styles.step3Container}>
      <div className={styles.header}> {/* Added header container */}
        <h2>Contact</h2>
        <hr className={styles.horizontalLine} /> {/* Added horizontal line */}
      </div>
      <div className={styles.inputFields}>
        <div className={styles.inputGroup}>
          <label htmlFor="title" className={styles.label}>
            Title:
          </label>
          <select id="title" className={styles.input}>
            <option value="Mr.">Mr.</option>
            <option value="Ms.">Ms.</option>
            <option value="Dr.">Dr.</option>
          </select>
        </div>
        <div className={styles.inputGroup}>
          <label htmlFor="firstName" className={styles.label}>
            First Name:
          </label>
          <input type="text" id="firstName" className={styles.input} />
        </div>
        {/* Add other input fields similarly */}
        <div className={styles.inputGroup}>
            <label htmlFor="middleName" className={styles.label}>
            Middle Name:
            </label>
            <input type="text" id="middleName" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
            <label htmlFor="lastName" className={styles.label}>
            Last Name:
            </label>
            <input type="text" id="lastName" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
            <label htmlFor="address" className={styles.label}>
            Address:
            </label>
            <input type="text" id="address" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
            <label htmlFor="designation" className={styles.label}>
            Designation:
            </label>
            <input type="text" id="designation" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
            <label htmlFor="state" className={styles.label}>
            State/UT:
            </label>
            <input type="text" id="state" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
            <label htmlFor="city" className={styles.label}>
            Town/City/Village:
            </label>
            <input type="text" id="city" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
            <label htmlFor="postalCode" className={styles.label}>
            Postal Code:
            </label>
            <input type="text" id="postalCode" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
            <label htmlFor="stdCode" className={styles.label}>
            STD Code:
            </label>
            <input type="text" id="stdCode" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
            <label htmlFor="mobileNumber" className={styles.label}>
            Mobile Number:
            </label>
            <input type="text" id="mobileNumber" className={styles.input} />
        </div>
        <div className={styles.inputGroup}>
            <label htmlFor="emailAddress" className={styles.label}>
            Email Address:
            </label>
            <input type="email" id="emailAddress" className={styles.input} />
        </div>
      </div>
    </div>
  );
};

export default Step3;