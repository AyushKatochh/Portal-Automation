import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './Context/AppContext';
import Login from './screens/Login';
import Applications from './screens/Applications';
import ApplicationDetail from './screens/ApplicationDetail';
import ExpertVisit from './screens/ExpertVisit';
import Executive from './screens/Executive';
import SuperAdminDashboard from './screens/SuperAdminDashboard';
import Footer from "./screens/Footer";
import ApplicationReport from './screens/ApplicationReport';

function App() {
    return (
        <AppProvider>
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/scrutiny/:applicationId" element={<ApplicationDetail />} />
                <Route path="/evc/:applicationId" element={<ExpertVisit />} />
                <Route path="/executive/:applicationId" element={<Executive />} />
                <Route path="/superAdmin" element={<SuperAdminDashboard />} />
                <Route path="/superAdmin/:applicationId" element={<ApplicationReport />} />
            </Routes>
        </Router>
        <Footer/>
        </AppProvider>
    );
}

export default App;
