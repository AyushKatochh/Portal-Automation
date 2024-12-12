import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
    AreaChart, Area, ResponsiveContainer,
    PieChart, Pie, Cell
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faClipboardList, faStethoscope, faBriefcase, faMagnifyingGlass
} from "@fortawesome/free-solid-svg-icons";
import styles from "./SuperAdminDashboard.module.css";
import Navbar from './Navbar';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [userName, setUserName] = useState("");
    const [error, setError] = useState(null);
    const [selectedSection, setSelectedSection] = useState("");
    const [applicationId, setApplicationId] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const navigate = useNavigate();

    const handleSearch = () => {
        if (applicationId) {
            navigate(`/superAdmin/${applicationId}`);
        } else {
            alert('Please enter an Application ID.');
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('http://localhost:5000/dashboard'); // Your API endpoint
                if (!response.ok) {
                    console.error(`HTTP error! status: ${response.status}`);
                    setError("Error fetching data from server. Some data might be unavailable.");
                    setStats({});
                    return;
                }
                const data = await response.json();
                setStats(data);
                setUserName(data.userName || "User");
            } catch (err) {
                console.error("Error during fetch:", err);
                setError("A network error occurred. Please check your connection.");
                setStats({});
            }
        };

        fetchStats();
    }, []);

    if (!stats) {
        return <div>Loading...</div>;
    }

    const getStatsData = () => {
        if (selectedMember && selectedSection) {
            try {
                return stats[selectedSection.toLowerCase() + 'Stats']?.members?.find(m => m.name === selectedMember.name) || {};
            } catch (error) {
                console.error("Error accessing member data:", error);
                return {};
            }
        } else if (selectedSection) {
            try {
                return stats[selectedSection.toLowerCase() + 'Stats'] || {};
            } catch (error) {
                console.error("Error accessing section stats:", error);
                return {};
            }
        } else {
            return stats;
        }
    };

    const statsData = getStatsData();

    const dummyChartData = {
      applicationsByStatus: [
          { name: "Pending", value: 12 },
          { name: "In Progress", value: 19 },
          { name: "Verified", value: 6 },
          { name: "Rejected", value: 3 }, // Added Rejected
      ],
      applicationsOverTime: [
          { month: "Jan", applications: 6 },
          { month: "Feb", applications: 12 },
          { month: "Mar", applications: 14 },
          { month: "Apr", applications: 10 }, // Added April
      ],
      applicationsCompleted: [
          { name: 'Completed', value: 70 },
          { name: 'Incomplete', value: 30 },
      ],
      applicationsByType: [
          { name: 'Type A', value: 40 },
          { name: 'Type B', value: 60 },
      ]
  };

    const handleSectionSelect = (section) => {
        setSelectedSection(section);
        setSelectedMember(null);
    };

    const handleMemberClick = (member) => {
        setSelectedMember(member);
    };

    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

    return (
      <div className={styles.dashboardContainer}>
          <Navbar />
          <div className={styles.contentWrapper}>
              <div className={styles.sidebar}>
              <ul className={styles.sidebarMenu}>
              <li className={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="Application ID"
                            value={applicationId}
                            onChange={(e) => setApplicationId(e.target.value)}
                            className={styles.searchInput}
                        />
                        <button onClick={handleSearch} className={styles.searchButton}>
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                            Search
                        </button>
                    </li>
                        <li
                            className={`${styles.sidebarItem} ${selectedSection === "Scrutiny" ? styles.active : ''}`}
                            onClick={() => handleSectionSelect("Scrutiny")}
                        >
                            <FontAwesomeIcon icon={faClipboardList} /> Scrutiny
                        </li>
                        <li
                            className={`${styles.sidebarItem} ${selectedSection === "Expert Visit" ? styles.active : ''}`}
                            onClick={() => handleSectionSelect("Expert Visit")}
                        >
                            <FontAwesomeIcon icon={faStethoscope} /> Expert Visit
                        </li>
                        <li
                            className={`${styles.sidebarItem} ${selectedSection === "Executive" ? styles.active : ''}`}
                            onClick={() => handleSectionSelect("Executive")}
                        >
                            <FontAwesomeIcon icon={faBriefcase} /> Executive
                        </li>
                    </ul>
              </div>
              <div className={styles.mainContent}>
                  <div className={styles.statsContainer}>
                      {error && <div className={styles.errorMessage}>{error}</div>}
                      {!selectedSection && (
                          <>
                              <div className={styles.statCard}>
                                  <h3>Total Applications</h3>
                                  <p>{stats?.applicationsByStatus?.reduce((sum, item) => sum + item.count, 0) || 0}</p>
                              </div>
                              <div className={styles.statCard}>
                                  <h3>Total Allocated Applications</h3>
                                  <p>{(stats?.scrutinyStats?.applicationsAllocated || 0) + (stats?.expertVisitStats?.applicationsAllocated || 0) + (stats?.executiveStats?.applicationsAllocated || 0)}</p>
                              </div>
                              <div className={styles.statCard}>
                                  <h3>Total Pending Applications</h3>
                                  <p>{(stats?.scrutinyStats?.pending || 0) + (stats?.expertVisitStats?.pending || 0) + (stats?.executiveStats?.pending || 0)}</p>
                              </div>
                              <div className={styles.statCard}>
                                  <h3>Total In Progress Applications</h3>
                                  <p>{(stats?.scrutinyStats?.inProgress || 0) + (stats?.expertVisitStats?.inProgress || 0) + (stats?.executiveStats?.inProgress || 0)}</p>
                              </div>
                              <div className={styles.statCard}>
                                  <h3>Total Verified Applications</h3>
                                  <p>{(stats?.scrutinyStats?.verified || 0) + (stats?.expertVisitStats?.verified || 0) + (stats?.executiveStats?.verified || 0)}</p>
                              </div>
                          </>
                      )}
                      {selectedSection && statsData?.members && (
                          statsData.members.map((member, index) => (
                              <div className={styles.statCard} key={index} onClick={() => handleMemberClick(member)} style={{ cursor: "pointer" }}>
                                  <h3>{member.name}</h3>
                                  <p>Allocated: {member.applicationsAllocated || 0}</p>
                                  <p>Pending: {member.pending || 0}</p>
                                  <p>In Progress: {member.inProgress || 0}</p>
                                  <p>Verified: {member.verified || 0}</p>
                              </div>
                          ))
                      )}
                      {selectedSection && statsData && !statsData?.members && Object.keys(statsData).filter(key => !['members', 'applicationsByStatus', 'applicationsOverTime', 'applicationsCompleted'].includes(key)).length > 0 && (
                          Object.keys(statsData).filter(key => !['members', 'applicationsByStatus', 'applicationsOverTime', 'applicationsCompleted'].includes(key)).map(key => (
                              <div className={styles.statCard} key={key}>
                                  <h3>{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                                  <p>{statsData[key] || 0}</p>
                              </div>
                          ))
                      )}
                  </div>

                  <div className={styles.chartsContainer}>
                      {dummyChartData.applicationsByStatus.length > 0 && (
                          <div className={styles.chartCard}>
                              <h3 className={styles.chartTitle}>Applications by Status</h3>
                              <ResponsiveContainer width="100%" height={150}>
                                  <BarChart data={dummyChartData.applicationsByStatus}>
                                      <XAxis dataKey="name" />
                                      <YAxis />
                                      <Tooltip />
                                      <Legend />
                                      <Bar dataKey="value" fill="#8884d8" />
                                  </BarChart>
                              </ResponsiveContainer>
                          </div>
                      )}
                      {dummyChartData.applicationsOverTime.length > 0 && (
                          <div className={styles.chartCard}>
                              <h3 className={styles.chartTitle}>Applications Over Time</h3>
                              <ResponsiveContainer width="100%" height={150}>
                                  <AreaChart data={dummyChartData.applicationsOverTime}>
                                      <XAxis dataKey="month" />
                                      <YAxis />
                                      <Tooltip />
                                      <Area type="monotone" dataKey="applications" stroke="#3357FF" fill="#3357FF" />
                                  </AreaChart>
                              </ResponsiveContainer>
                          </div>
                      )}
                      {dummyChartData.applicationsCompleted.length > 0 && (
                          <div className={styles.chartCard}>
                              <h3 className={styles.chartTitle}>Applications Completed</h3>
                              <ResponsiveContainer width="100%" height={150}>
                                  <PieChart>
                                      <Pie data={dummyChartData.applicationsCompleted} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} fill="#8884d8" label>
                                          {dummyChartData.applicationsCompleted.map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                          ))}
                                      </Pie>
                                      <Tooltip />
                                  </PieChart>
                              </ResponsiveContainer>
                          </div>
                      )}
                      {dummyChartData.applicationsByStatus.length > 0 && (
                          <div className={styles.chartCard}>
                              <h3 className={styles.chartTitle}>Applications by Status</h3>
                              <ResponsiveContainer width="100%" height={150}>
                                  <BarChart data={dummyChartData.applicationsByStatus}>
                                      <XAxis dataKey="name" />
                                      <YAxis />
                                      <Tooltip />
                                      <Legend />
                                      <Bar dataKey="value" fill="#8884d8" />
                                  </BarChart>
                              </ResponsiveContainer>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </div>
  );
}

export default SuperAdminDashboard;
       