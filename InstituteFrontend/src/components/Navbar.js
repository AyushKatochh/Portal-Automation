import React,{useState,useEffect} from "react";
import "./Navbar.css"; // Import the CSS file for styling
import leftIcon from "../assets/aicte_logo.png"; // Replace with your left icon image path


const Navbar = ({ name, activeKey }) => {

  const tagStyle = {
    display: 'inline-block',
    backgroundColor: '#f44336', // Red background for the tag
    color: '#fff',
    fontSize: '0.75em',
    fontWeight: 'bold',
    padding: '3px 8px',
    borderRadius: '5px',
    marginLeft: '10px',
    textTransform: 'uppercase',
  };

  return (
    <div className="navbar">
      <span>{<img src={leftIcon} alt="Left Icon" className="navbar-icon left-icon" />}</span>
      <h1 className="navbar-title">{<span style={{color:'#3e98c7'}}>{name} { " | " }</span>} <span style={{color:'green'}}>{activeKey}</span></h1>
      <span className="navbar-icon right-icon"> Logout </span>
    </div>
  );
};

export default Navbar;
