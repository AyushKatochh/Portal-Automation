import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Applications = () => {
    const [applications, setApplications] = useState([]);
    const navigate = useNavigate();
    
    const adminId = localStorage.getItem('adminId');
    const adminName = localStorage.getItem('adminName');
    const adminUsername = localStorage.getItem('adminUsername');

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/admin/${adminId}/applications`);
                setApplications(response.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchApplications();
    }, []);

    const handleViewDetails = (applicationId) => {
        navigate(`/application/${applicationId}`);
    };

    return (
        <div>
            <div>
            <h1>Welcome, {adminName}</h1>
            <p>Username: {adminUsername}</p>
            <p>Your Admin ID: {adminId}</p>
            {/* Applications array can be fetched and displayed here */}
        </div>
            <h1>Applications</h1>
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {applications.map((application) => (
                    <div key={application.applicationId} style={{
                        border: '1px solid #ccc',
                        borderRadius: '5px',
                        padding: '10px',
                        margin: '10px',
                        width: '300px',
                    }}>
                        <h3>{application.type}</h3>
                        <p>Institute: {application.instituteName}</p>
                        <p>Status: {application.status}</p>
                        <p>Deadline: {new Date(application.deadline).toLocaleDateString()}</p>
                        <button onClick={() => handleViewDetails(application.applicationId)}>
                            View Details
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Applications;




