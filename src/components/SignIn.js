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
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError(''); 
  
    try {
      const response = await fetch('http://localhost:5000/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userName: username, password }), 
      });
  
      if (response.ok) {
        const data = await response.json();
  
        // Store ONLY necessary user data in local storage
        localStorage.setItem('userData', JSON.stringify({ 
          userName: data.institute.userName, 
          instituteName: data.institute.name 
        }));
  
        navigate('/HomeLink'); 
      } else {
        // Handle authentication error (extract the error message)
        const errorData = await response.json(); 
        setError(errorData.message || 'Incorrect username or password'); 
      }
    } catch (error) {
      // Handle network errors or other exceptions
      console.error("Error during authentication:", error); // Log for debugging
      setError('An error occurred. Please try again later.'); 
    } finally {
      setIsLoading(false); 
    }
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
          {error && <div className={styles.error}>{error}</div>} {/* Display error message */}
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