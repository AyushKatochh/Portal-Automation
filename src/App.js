// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './Context/AppContext';
import Homepage from './components/Homepage'; // Fixed import
import ApprovalProcess from './components/ApprovalProcess';
import SignIn from './components/SignIn';
import './App.css';

function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/approval-process" element={<ApprovalProcess />} />
          {/* Add other routes for New Institute and Forgot Password */}
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;