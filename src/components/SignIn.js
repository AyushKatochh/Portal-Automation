// src/components/SignIn.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import aicteLogo from '../assets/aicte_logo.png';
import leftImage from '../assets/signu-in-table.png'; 
import styles from './SignIn.module.css';
import LoadingIcon from '../assets/loader.gif'; 

const SignIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    setIsLoading(true); // Show the loader

    // Simulate a delay of 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));

    if (username === 'test' && password === 'test') {
      navigate('/approval-process'); 
    } else {
      alert('Incorrect username or password');
    }

    setIsLoading(false); // Hide the loader
  };

  return (
    <div className={styles.signInPage}>
      <img src={leftImage} alt="Left" className={styles.leftImage} />
      <div className={styles.signInContainer}> 
        {isLoading && ( 
          <div className={styles.loaderContainer}>
            <img src={LoadingIcon} alt="Loading" className={styles.loadingIcon} />
          </div>
        )}
        <img src={aicteLogo} alt="AICTE Logo" className={styles.aicteLogo} />
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Username"
            className={styles.inputField}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className={styles.inputField}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className={styles.signInButton} disabled={isLoading}>
            {isLoading ? ( 
              <img src={LoadingIcon} alt="Loading" className={styles.loadingIcon} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        <div className={styles.links}>
          <Link to="/new-institute" className={styles.link}>New Institute</Link>
          <Link to="/forgot-password" className={styles.link}>Forgot Password</Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;