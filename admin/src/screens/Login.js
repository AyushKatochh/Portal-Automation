import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import Banner from "../assets/aicte_logo.png";
import Icon from "../assets/icon.webp";
import loaderImage from "../assets/loader.gif"; // Replace with your loading image path

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false); // State to track loading
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Show loader
        setIsLoading(true);

        // Simulate a 2-second delay before making the API request
        setTimeout(async () => {
            try {
                const response = await axios.post('http://localhost:5000/api/admin/login', { email, password });
                const { id, username, name, committee } = response.data;

                localStorage.setItem('adminId', id);
                localStorage.setItem('adminName', name);
                localStorage.setItem('adminCommittee', committee);
                localStorage.setItem('adminUsername', username);
                navigate('/applications');
            } catch (err) {
                alert(err.response?.data?.message || 'Login failed');
            } finally {
                setIsLoading(false); // Hide loader after the API call
            }
        }, 2000); // Simulated delay
    };

    return (
        <div className={styles.container}>
            <div className={styles.navbar}>
                <img src={Banner} alt="Banner" />
            </div>

            <div className={styles.loginBox}>
                <img src={Icon} alt="Login Icon" />

                <h1>Admin Login</h1>

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputGroup}>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <FontAwesomeIcon icon={faEnvelope} className="fa-icon" />
                    </div>
                    <div className={styles.inputGroup}>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <FontAwesomeIcon icon={faLock} className="fa-icon" />
                    </div>
                    <button type="submit" className={styles.loginButton} disabled={isLoading}>
                        {isLoading ? 'Logging In...' : 'Login'}
                    </button>
                </form>
            </div>

            {/* Full-Screen Loader */}
            {isLoading && (
                <div className={styles.loaderOverlay}>
                    <div className={styles.loader}>
                        <img src={loaderImage} alt="Loading..." className={styles.loaderImage} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
