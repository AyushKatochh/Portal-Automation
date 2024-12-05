import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignUp.module.css';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const submitData = async () => {
    setIsLoading(true);
    setError('');

    try {
      console.log('Form Data:', formData);
      const response = await fetch('http://localhost:5000/save-institute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      console.log('Server Response:', result);

      if (response.ok) {
        alert('Institute registered successfully!');
        navigate('/sign-in');
      } else {
        setError(result.message || 'Error registering institute. Please try again.');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (formData.name && formData.email && formData.password && formData.userName) {
      setError('');
    }
  }, [formData]);

  return (
    <div className={styles.signUpContainer}>
      <h2>Register New Institute</h2>
      {error && <div className={styles.error}>{error}</div>}
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          submitData();
        }}
      >
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleInputChange}
          className={styles.inputField}
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
          className={styles.inputField}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
          className={styles.inputField}
        />
        <input
          type="text"
          name="userName"
          placeholder="Username"
          value={formData.userName}
          onChange={handleInputChange}
          className={styles.inputField}
        />
        <button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Sign Up'}
        </button>
      </form>
      <p>
        Already have an account? <span onClick={() => navigate('/sign-in')}>Sign In</span>
      </p>
    </div>
  );
};

export default SignUp;
