import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './screens/Login';
import Applications from './screens/Applications';
import ApplicationDetail from './screens/ApplicationDetail';
import ExpertVisit from './screens/ExpertVisit';
import Executive from './screens/Executive';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/scrutiny/:applicationId" element={<ApplicationDetail />} />
                <Route path="/evc/:applicationId" element={<ExpertVisit />} />
                <Route path="/executive/:applicationId" element={<Executive />} />

            </Routes>
        </Router>
    );
}

export default App;
