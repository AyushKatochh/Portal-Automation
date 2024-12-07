import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faUser } from '@fortawesome/free-solid-svg-icons';
import styles from './SuperAdminDashboard.module.css';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [activeChart, setActiveChart] = useState('applicationsByStatus');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/super-admin-stats');
        setStats(response.data);
        const fetchedUserName = response.data.userName || 'Super Admin';
        setUserName(fetchedUserName);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, []);

  if (!stats) {
    return <div>Loading...</div>;
  }

  const applicationsByTypeData = stats.applicationsByType.map((item) => ({
    name: item._id,
    applications: item.count,
  }));

  const applicationsByStatusData = [
    { name: 'Pending', value: stats.applicationsByStatus.find(item => item._id === "Pending")?.count || 10 },
    { name: 'In Progress', value: stats.applicationsByStatus.find(item => item._id === "In Progress")?.count || 30 },
    { name: 'Approved', value: stats.applicationsByStatus.find(item => item._id === "Approved")?.count || 15 },
  ];

  const applicationsOverTimeData = stats.applicationsOverTime || [
    { month: 'Jan', applications: 12 },
    { month: 'Feb', applications: 15 },
    { month: 'Mar', applications: 8 },
    { month: 'Apr', applications: 10 },
    { month: 'May', applications: 18 },
  ];

  const COLORS = ['#FF5733', '#33FF57', '#3357FF'];

  return (
    <div className={styles.dashboardContainer}>
      {/* Top Navbar */}
      <nav className={styles.navbar}>
        <h1 className={styles.navbarTitle}>Super Admin Panel</h1>
        <div className={styles.navbarUser}>
          <FontAwesomeIcon icon={faUser} /> Welcome, {userName}
        </div>
      </nav>

      {/* Main Dashboard Layout */}
      <div className={styles.content}>
        <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
          <button
            className={styles.hamburgerButton}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <FontAwesomeIcon icon={sidebarOpen ? faTimes : faBars} />
          </button>
          <div className={styles.sidebarContent}>
            <h2 className={styles.sidebarHeader}>Charts</h2>
            <div className={styles.sidebarOptions}>
              <button
                className={`${styles.sidebarOption} ${activeChart === 'applicationsByStatus' ? styles.active : ''}`}
                onClick={() => setActiveChart('applicationsByStatus')}
              >
                Applications by Status
              </button>
              <button
                className={`${styles.sidebarOption} ${activeChart === 'applicationsByType' ? styles.active : ''}`}
                onClick={() => setActiveChart('applicationsByType')}
              >
                Applications by Type
              </button>
              <button
                className={`${styles.sidebarOption} ${activeChart === 'applicationsOverTime' ? styles.active : ''}`}
                onClick={() => setActiveChart('applicationsOverTime')}
              >
                Applications Over Time
              </button>
              <button
                className={`${styles.sidebarOption} ${activeChart === 'applicationsTrend' ? styles.active : ''}`}
                onClick={() => setActiveChart('applicationsTrend')}
              >
                Applications Trend
              </button>
            </div>
          </div>
        </aside>

        <main className={styles.mainContent}>
          {activeChart === 'applicationsByStatus' && (
            <div className={styles.chartContainer}>
              <h2 className={styles.chartTitle}>Applications by Status</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={applicationsByStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {applicationsByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={applicationsByStatusData}> 
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'applicationsByType' && (
            <div className={styles.chartContainer}>
              <h2 className={styles.chartTitle}>Applications by Type</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={applicationsByTypeData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="applications" fill="#33FF57" />
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={applicationsByTypeData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="applications" stroke="#33FF57" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'applicationsOverTime' && (
            <div className={styles.chartContainer}>
              <h2 className={styles.chartTitle}>Applications Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={applicationsOverTimeData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="applications" stroke="#FF5733" />
                </LineChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={applicationsOverTimeData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="applications" stroke="#FF5733" fill="#FF5733" /> 
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'applicationsTrend' && (
            <div className={styles.chartContainer}>
              <h2 className={styles.chartTitle}>Applications Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={applicationsOverTimeData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="applications" stroke="#3357FF" fill="#3357FF" />
                </AreaChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={applicationsOverTimeData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="applications" fill="#3357FF" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;