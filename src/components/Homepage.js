// src/components/Homepage.js
import React, { useContext, useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../Context/AppContext';
import aicteLogo from '../assets/aicte_logo.png';
import styles from './Homepage.module.css';
import LoadingIcon from '../assets/loader.gif'; 

const Homepage = () => {
  const { currentTime } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(false); // Add loading state
  const navigate = useNavigate();

  const handleLoginClick = async () => {
    setIsLoading(true); // Show loader
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
    navigate('/sign-up'); // Navigate to sign-in page
  };

  return (
    <div className={styles.homepage}>
      <nav className={styles.navbar}>
        <div className={styles.currentTime}>{currentTime} (IST)</div>
        <button className={styles.loginButton} onClick={handleLoginClick} disabled={isLoading}> 
          {isLoading ? (
            <img src={LoadingIcon} alt="Loading" className={styles.loadingIcon} />
          ) : (
            'Web Portal Login'
          )}
        </button>
      </nav>
      <div className={styles.hero}>
        <img src={aicteLogo} alt="AICTE Logo" className={styles.aicteLogo} />
      </div>
      {isLoading && ( // Show full-screen loader when isLoading is true
        <div className={styles.loaderContainer}>
          <img src={LoadingIcon} alt="Loading" className={styles.loadingIcon} />
        </div>
      )}
    </div>
  );
};

export default Homepage;