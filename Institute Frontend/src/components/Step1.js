// src/components/Step1.js
import React from 'react';
import styles from './Step1.module.css';

const Step1 = () => {
  const questions = [
    // ... your existing questions ...
    {
      id: 7,
      text: 'What is the approximate number of students in your institution?',
      options: ['0-500', '500-1000', '1000-2000', '2000+'],
    },
    {
      id: 8,
      text: 'What is the primary focus of your institution?',
      options: ['Engineering', 'Management', 'Arts and Science', 'Other'],
    },
  ];

  return (
    <div className={styles.step1Container}>
      <div className={styles.questionsContainer}>
        {questions.map((question) => (
          <div key={question.id} className={styles.question}>
            <label htmlFor={`question-${question.id}`} className={styles.questionLabel}>
              {question.text}
            </label>
            <select id={`question-${question.id}`} className={styles.dropdown}>
              {question.options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Step1;