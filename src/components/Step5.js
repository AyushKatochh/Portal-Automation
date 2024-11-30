// src/components/Step5.js
import React from 'react';
import styles from './Step5.module.css';

const Step5 = () => {
  return (
    <div className={styles.step5Container}>
      <div className={styles.header}>
        <h2>Land Details</h2>
        <hr className={styles.horizontalLine} />
      </div>
      <div className={styles.inputFields}>
        {/* Input fields with consistent className */}
        <div className={styles.inputGroup}>
          <label htmlFor="location" className={styles.label}>
            Location:
          </label>
          <input type="text" id="location" className={styles.input} />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="hillyArea" className={styles.label}>
            Land in Hilly Area:
          </label>
          <select id="hillyArea" className={styles.input}>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="totalArea" className={styles.label}>
            Total Area in acres:
          </label>
          <input type="number" id="totalArea" className={styles.input} />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="fsi" className={styles.label}>
            FSI:
          </label>
          <input type="number" id="fsi" className={styles.input} />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="numberOfPlaces" className={styles.label}>
            Number of Places:
          </label>
          <input type="number" id="numberOfPlaces" className={styles.input} />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="landPieceArea1" className={styles.label}>
            Land Piece Area 1 in acres:
          </label>
          <input type="number" id="landPieceArea1" className={styles.input} />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="landPieceArea2" className={styles.label}>
            Land Piece Area 2 in acres:
          </label>
          <input type="number" id="landPieceArea2" className={styles.input} />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="landPieceArea3" className={styles.label}>
            Land Piece Area 3 in acres:
          </label>
          <input type="number" id="landPieceArea3" className={styles.input} />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="landRegistrationNo" className={styles.label}>
            Land Registration No.:
          </label>
          <input type="text" id="landRegistrationNo" className={styles.input} />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="dateOfRegistration" className={styles.label}>
            Date of Registration:
          </label>
          <input type="date" id="dateOfRegistration" className={styles.input} />
        </div>
      </div>
    </div>
  );
};

export default Step5;
