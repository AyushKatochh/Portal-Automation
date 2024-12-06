import React, { useState } from 'react';
import axios from 'axios';
import './Modal.css'; // Add your styles here

// Modal Component
const Modal = ({ isOpen, onClose, onConfirm, message, action }) => {
  const [remark, setRemark] = useState('');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2>{message}</h2>
        <textarea
          placeholder="Enter your remark"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        ></textarea>
        <div className="modal-actions">
          <button
            className="confirm-button"
            onClick={() => onConfirm(true, remark, action)}
          >
            Confirm
          </button>
          <button className="cancel-button" onClick={() => onConfirm(false)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


export default Modal;
