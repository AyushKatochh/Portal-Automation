import React, { useState } from 'react';
import styles from './Step5.module.css';

const Step5 = () => {
  const [landDetails, setLandDetails] = useState({
    location: '',
    hillyArea: 'Yes',
    totalArea: '',
    fsi: '',
    numberOfPlaces: '',
    landPieceArea1: '',
    landPieceArea2: '',
    landPieceArea3: '',
    landRegistrationNo: '',
    dateOfRegistration: '',
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setLandDetails({ ...landDetails, [id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userName = 'aman'; // Replace with dynamic user name
    const response = await fetch('/save-land-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userName, landDetails }),
    });

    const data = await response.json();
    if (response.ok) {
      alert('Land details saved successfully');
    } else {
      alert(`Error: ${data.message}`);
    }
  };

  return (
    <div className={styles.step5Container}>
      <div className={styles.header}>
        <h2>Land Details</h2>
        <hr className={styles.horizontalLine} />
      </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputFields}>
          <div className={styles.inputGroup}>
            <label htmlFor="location" className={styles.label}>
              Location:
            </label>
            <input
              type="text"
              id="location"
              className={styles.input}
              value={landDetails.location}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="hillyArea" className={styles.label}>
              Land in Hilly Area:
            </label>
            <select
              id="hillyArea"
              className={styles.input}
              value={landDetails.hillyArea}
              onChange={handleChange}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="totalArea" className={styles.label}>
              Total Area in acres:
            </label>
            <input
              type="number"
              id="totalArea"
              className={styles.input}
              value={landDetails.totalArea}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="fsi" className={styles.label}>
              FSI:
            </label>
            <input
              type="number"
              id="fsi"
              className={styles.input}
              value={landDetails.fsi}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="numberOfPlaces" className={styles.label}>
              Number of Places:
            </label>
            <input
              type="number"
              id="numberOfPlaces"
              className={styles.input}
              value={landDetails.numberOfPlaces}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="landPieceArea1" className={styles.label}>
              Land Piece Area 1 in acres:
            </label>
            <input
              type="number"
              id="landPieceArea1"
              className={styles.input}
              value={landDetails.landPieceArea1}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="landPieceArea2" className={styles.label}>
              Land Piece Area 2 in acres:
            </label>
            <input
              type="number"
              id="landPieceArea2"
              className={styles.input}
              value={landDetails.landPieceArea2}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="landPieceArea3" className={styles.label}>
              Land Piece Area 3 in acres:
            </label>
            <input
              type="number"
              id="landPieceArea3"
              className={styles.input}
              value={landDetails.landPieceArea3}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="landRegistrationNo" className={styles.label}>
              Land Registration No.:
            </label>
            <input
              type="text"
              id="landRegistrationNo"
              className={styles.input}
              value={landDetails.landRegistrationNo}
              onChange={handleChange}
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="dateOfRegistration" className={styles.label}>
              Date of Registration:
            </label>
            <input
              type="date"
              id="dateOfRegistration"
              className={styles.input}
              value={landDetails.dateOfRegistration}
              onChange={handleChange}
            />
          </div>
        </div>
        <button type="submit" className={styles.submitButton}>Save</button>
      </form>
    </div>
  );
};

export default Step5;
