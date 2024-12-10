// Navbar.js
import React from "react";
import "./Navbar.css"; 
import leftIcon from "../assets/aicte_logo.png"; 

const Navbar = ({ name, activeKey, adminId }) => {
  return (
    <div className="navbar">
      <span>
        <img src={leftIcon} alt="Left Icon" className="navbar-icon left-icon" />
      </span>
      <h1 className="navbar-title">
        <span style={{ color: '#3e98c7' }}>{name} | </span> 
        <span style={{ color: 'green' }}>{activeKey}</span>
      </h1>

      {adminId && ( 
        <span className="navbar-adminId">
          Admin ID: {adminId} 
        </span>
      )}

      <span className="navbar-icon right-icon"> Logout </span>
    </div>
  );
};

export default Navbar;