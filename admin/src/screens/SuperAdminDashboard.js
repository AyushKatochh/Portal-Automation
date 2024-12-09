import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faClipboardList,
  faStethoscope,
  faBriefcase,
} from "@fortawesome/free-solid-svg-icons";
import styles from "./SuperAdminDashboard.module.css";
import Modal from "react-modal";

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [userName, setUserName] = useState("");
  const [showAdminInfo, setShowAdminInfo] = useState(false);
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    const dummyData = {
      userName: "Super Admin",
      scrutinyStats: {
        committeeMembers: 3,
        members: [
          {
            name: "John Doe",
            applicationsAllocated: 6,
            pending: 2,
            inProgress: 3,
            verified: 1,
            applicationsOverTime: [
              { month: "Jan", applications: 1 },
              { month: "Feb", applications: 3 },
              { month: "Mar", applications: 2 },
            ],
            applicationsCompleted: [
              { name: "Completed", value: 4 },
              { name: "Not Completed", value: 2 },
            ],
          },
          {
            name: "Jane Smith",
            applicationsAllocated: 5,
            pending: 1,
            inProgress: 3,
            verified: 1,
            applicationsOverTime: [
              { month: "Jan", applications: 2 },
              { month: "Feb", applications: 2 },
              { month: "Mar", applications: 1 },
            ],
            applicationsCompleted: [
              { name: "Completed", value: 3 },
              { name: "Not Completed", value: 2 },
            ],
          },
          {
            name: "Peter Jones",
            applicationsAllocated: 4,
            pending: 2,
            inProgress: 1,
            verified: 1,
            applicationsOverTime: [
              { month: "Jan", applications: 0 },
              { month: "Feb", applications: 1 },
              { month: "Mar", applications: 3 },
            ],
            applicationsCompleted: [
              { name: "Completed", value: 2 },
              { name: "Not Completed", value: 2 },
            ],
          },
        ],
        applicationsAllocated: 15,
        pending: 5,
        inProgress: 8,
        verified: 2,
        applicationsOverTime: [
          { month: "Jan", applications: 2 },
          { month: "Feb", applications: 5 },
          { month: "Mar", applications: 3 },
        ],
        applicationsCompleted: [
          { name: "Completed", value: 4 },
          { name: "Not Completed", value: 2 },
        ],
      },
      expertVisitStats: {
        committeeMembers: 2,
        members: [
          {
            name: "Alice Brown",
            applicationsAllocated: 6,
            pending: 2,
            inProgress: 3,
            verified: 1,
            applicationsOverTime: [
              { month: "Jan", applications: 1 },
              { month: "Feb", applications: 2 },
              { month: "Mar", applications: 3 },
            ],
            applicationsCompleted: [
              { name: "Completed", value: 4 },
              { name: "Not Completed", value: 2 },
            ],
          },
          {
            name: "Bob Johnson",
            applicationsAllocated: 4,
            pending: 1,
            inProgress: 2,
            verified: 1,
            applicationsOverTime: [
              { month: "Jan", applications: 0 },
              { month: "Feb", applications: 2 },
              { month: "Mar", applications: 2 },
            ],
            applicationsCompleted: [
              { name: "Completed", value: 3 },
              { name: "Not Completed", value: 1 },
            ],
          },
        ],
        applicationsAllocated: 10,
        pending: 3,
        inProgress: 5,
        verified: 2,
        applicationsOverTime: [
          { month: "Jan", applications: 1 },
          { month: "Feb", applications: 4 },
          { month: "Mar", applications: 5 },
        ],
        applicationsCompleted: [
          { name: "Completed", value: 5 },
          { name: "Not Completed", value: 1 },
        ],
      },
      executiveStats: {
        committeeMembers: 2,
        members: [
          {
            name: "Eva Green",
            applicationsAllocated: 7,
            pending: 3,
            inProgress: 3,
            verified: 1,
            applicationsOverTime: [
              { month: "Jan", applications: 2 },
              { month: "Feb", applications: 1 },
              { month: "Mar", applications: 4 },
            ],
            applicationsCompleted: [
              { name: "Completed", value: 5 },
              { name: "Not Completed", value: 2 },
            ],
          },
          {
            name: "Charlie Brown",
            applicationsAllocated: 5,
            pending: 1,
            inProgress: 3,
            verified: 1,
            applicationsOverTime: [
              { month: "Jan", applications: 1 },
              { month: "Feb", applications: 2 },
              { month: "Mar", applications: 2 },
            ],
            applicationsCompleted: [
              { name: "Completed", value: 2 },
              { name: "Not Completed", value: 3 },
            ],
          },
        ],
        applicationsAllocated: 12,
        pending: 4,
        inProgress: 6,
        verified: 2,
        applicationsOverTime: [
          { month: "Jan", applications: 3 },
          { month: "Feb", applications: 3 },
          { month: "Mar", applications: 6 },
        ],
        applicationsCompleted: [
          { name: "Completed", value: 3 },
          { name: "Not Completed", value: 3 },
        ],
      },
      applicationsByStatus: [
        { _id: "Pending", count: 12 },
        { _id: "In Progress", count: 19 },
        { _id: "Verified", count: 6 },
      ],
      applicationsOverTime: [
        { month: "Jan", applications: 6 },
        { month: "Feb", applications: 12 },
        { month: "Mar", applications: 14 },
      ],
    };

    setStats(dummyData);
    setUserName(dummyData.userName);
  }, []);

  if (!stats) {
    return <div>Loading...</div>;
  }

  const getStatsData = () => {
    if (selectedMember) {
      switch (selectedSection) {
        case "Scrutiny":
          return {
            committeeMembers: stats.scrutinyStats.committeeMembers,
            members: stats.scrutinyStats.members,
            applicationsAllocated: stats.scrutinyStats.applicationsAllocated,
            pending: stats.scrutinyStats.pending,
            inProgress: stats.scrutinyStats.inProgress,
            verified: stats.scrutinyStats.verified,
            applicationsByStatus: [
              { name: "Pending", value: stats.scrutinyStats.pending },
              {
                name: "In Progress",
                value: stats.scrutinyStats.inProgress,
              },
              { name: "Verified", value: stats.scrutinyStats.verified },
            ],
            applicationsOverTime: stats.scrutinyStats.applicationsOverTime,
            applicationsCompleted: stats.scrutinyStats.applicationsCompleted,
          };
        case "Expert Visit":
          return {
            committeeMembers: stats.expertVisitStats.committeeMembers,
            members: stats.expertVisitStats.members,
            applicationsAllocated:
              stats.expertVisitStats.applicationsAllocated,
            pending: stats.expertVisitStats.pending,
            inProgress: stats.expertVisitStats.inProgress,
            verified: stats.expertVisitStats.verified,
            applicationsByStatus: [
              { name: "Pending", value: stats.expertVisitStats.pending },
              {
                name: "In Progress",
                value: stats.expertVisitStats.inProgress,
              },
              { name: "Verified", value: stats.expertVisitStats.verified },
            ],
            applicationsOverTime: stats.expertVisitStats.applicationsOverTime,
            applicationsCompleted: stats.expertVisitStats.applicationsCompleted,
          };
        case "Executive":
          return {
            committeeMembers: stats.executiveStats.committeeMembers,
            members: stats.executiveStats.members,
            applicationsAllocated: stats.executiveStats.applicationsAllocated,
            pending: stats.executiveStats.pending,
            inProgress: stats.executiveStats.inProgress,
            verified: stats.executiveStats.verified,
            applicationsByStatus: [
              { name: "Pending", value: stats.executiveStats.pending },
              {
                name: "In Progress",
                value: stats.executiveStats.inProgress,
              },
              { name: "Verified", value: stats.executiveStats.verified },
            ],
            applicationsOverTime: stats.executiveStats.applicationsOverTime,
            applicationsCompleted: stats.executiveStats.applicationsCompleted,
          };
        default:
          return {
            committeeMembers: 0,
            members: [],
            applicationsAllocated: 0,
            pending: 0,
            inProgress: 0,
            verified: 0,
            applicationsByStatus: [
              {
                name: "Pending",
                value:
                  stats.applicationsByStatus.find(
                    (item) => item._id === "Pending"
                  ).count,
              },
              {
                name: "In Progress",
                value:
                  stats.applicationsByStatus.find(
                    (item) => item._id === "In Progress"
                  ).count,
              },
              {
                name: "Verified",
                value:
                  stats.applicationsByStatus.find(
                    (item) => item._id === "Verified"
                  ).count,
              },
            ],
            applicationsOverTime: stats.applicationsOverTime,
            applicationsCompleted: [],
          };
      }
    } else {
      switch (selectedSection) {
        case "Scrutiny":
          return {
            committeeMembers: stats.scrutinyStats.committeeMembers,
            members: stats.scrutinyStats.members,
            applicationsAllocated: stats.scrutinyStats.applicationsAllocated,
            pending: stats.scrutinyStats.pending,
            inProgress: stats.scrutinyStats.inProgress,
            verified: stats.scrutinyStats.verified,
            applicationsByStatus: [
              { name: "Pending", value: stats.scrutinyStats.pending },
              {
                name: "In Progress",
                value: stats.scrutinyStats.inProgress,
              },
              { name: "Verified", value: stats.scrutinyStats.verified },
            ],
            applicationsOverTime: stats.scrutinyStats.applicationsOverTime,
            applicationsCompleted: stats.scrutinyStats.applicationsCompleted,
          };
        case "Expert Visit":
          return {
            committeeMembers: stats.expertVisitStats.committeeMembers,
            members: stats.expertVisitStats.members,
            applicationsAllocated:
              stats.expertVisitStats.applicationsAllocated,
            pending: stats.expertVisitStats.pending,
            inProgress: stats.expertVisitStats.inProgress,
            verified: stats.expertVisitStats.verified,
            applicationsByStatus: [
              { name: "Pending", value: stats.expertVisitStats.pending },
              {
                name: "In Progress",
                value: stats.expertVisitStats.inProgress,
              },
              { name: "Verified", value: stats.expertVisitStats.verified },
            ],
            applicationsOverTime: stats.expertVisitStats.applicationsOverTime,
            applicationsCompleted: stats.expertVisitStats.applicationsCompleted,
          };
        case "Executive":
          return {
            committeeMembers: stats.executiveStats.committeeMembers,
            members: stats.executiveStats.members,
            applicationsAllocated: stats.executiveStats.applicationsAllocated,
            pending: stats.executiveStats.pending,
            inProgress: stats.executiveStats.inProgress,
            verified: stats.executiveStats.verified,
            applicationsByStatus: [
              { name: "Pending", value: stats.executiveStats.pending },
              {
                name: "In Progress",
                value: stats.executiveStats.inProgress,
              },
              { name: "Verified", value: stats.executiveStats.verified },
            ],
            applicationsOverTime: stats.executiveStats.applicationsOverTime,
            applicationsCompleted: stats.executiveStats.applicationsCompleted,
          };
        default:
          return {
            committeeMembers: 0,
            members: [],
            applicationsAllocated: 0,
            pending: 0,
            inProgress: 0,
            verified: 0,
            applicationsByStatus: [
              {
                name: "Pending",
                value:
                  stats.applicationsByStatus.find(
                    (item) => item._id === "Pending"
                  ).count,
              },
              {
                name: "In Progress",
                value:
                  stats.applicationsByStatus.find(
                    (item) => item._id === "In Progress"
                  ).count,
              },
              {
                name: "Verified",
                value:
                  stats.applicationsByStatus.find(
                    (item) => item._id === "Verified"
                  ).count,
              },
            ],
            applicationsOverTime: stats.applicationsOverTime,
            applicationsCompleted: [],
          };
      }
    }
  };

  const statsData = getStatsData();

  const handleAdminInfoClick = () => {
    setShowAdminInfo(!showAdminInfo);
    setSelectedSection("");
    setSelectedMember(null);
  };

  const handleSectionSelect = (section) => {
    setSelectedSection(section);
    setSelectedMember(null);
  };

  const handleMemberClick = (member) => {
    setSelectedMember(member);
  };

  const handleViewApplications = (member) => {
    setModalData(member);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalData(null);
  };

  const COLORS = ["#0088FE", "#00C49F"];

  return (
    <div className={styles.dashboardContainer}>
      <nav className={styles.navbar}>
        <h1 className={styles.navbarTitle}>Super Admin Panel</h1>
        <div className={styles.navbarOptions}>
          <button
            className={styles.navbarButton}
            onClick={handleAdminInfoClick}
          >
            Admin Information
          </button>
          <input
            type="text"
            className={styles.navbarSearch}
            placeholder="Enter Admin ID"
          />
        </div>
        <div className={styles.navbarUser}>
          <FontAwesomeIcon icon={faUser} /> Welcome, {userName}
        </div>
      </nav>

      <div className={styles.contentWrapper}>
        <div className={styles.sidebar}>
          {showAdminInfo && (
            <ul className={styles.sidebarMenu}>
              <li
                className={styles.sidebarItem}
                onClick={() => handleSectionSelect("Scrutiny")}
              >
                <FontAwesomeIcon icon={faClipboardList} /> Scrutiny
              </li>
              <li
                className={styles.sidebarItem}
                onClick={() => handleSectionSelect("Expert Visit")}
              >
                <FontAwesomeIcon icon={faStethoscope} /> Expert Visit
              </li>
              <li
                className={styles.sidebarItem}
                onClick={() => handleSectionSelect("Executive")}
              >
                <FontAwesomeIcon icon={faBriefcase} /> Executive
              </li>
            </ul>
          )}
        </div>

        <div className={styles.mainContent}>
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <h3>Committee Members</h3>
              <p>{statsData.committeeMembers}</p>
            </div>

            {statsData.members.map((member, index) => (
              <div
                className={styles.statCard}
                key={index}
                onClick={() => handleMemberClick(member)}
                style={{ cursor: "pointer" }}
              >
                <h3>{member.name}</h3>
                <div className={styles.dropdown}>
                  <button className={styles.dropdownButton}>
                    View Details
                  </button>
                  <div className={styles.dropdownContent}>
                    <p>Number of allocated applications: {member.applicationsAllocated}</p>
                    <button onClick={() => handleViewApplications(member)}>
                      View Applications
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className={styles.statCard}>
              <h3>Applications Allocated</h3>
              <p>{statsData.applicationsAllocated}</p>
            </div>

            <div className={styles.statCard}>
              <h3>Pending Applications</h3>
              <p>{statsData.pending}</p>
            </div>
            <div className={styles.statCard}>
              <h3>In Progress Applications</h3>
              <p>{statsData.inProgress}</p>
            </div>
            <div className={styles.statCard}>
              <h3>Verified Applications</h3>
              <p>{statsData.verified}</p>
            </div>
          </div>

          <div className={styles.chartsContainer}>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Applications by Status</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={statsData.applicationsByStatus}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Applications Over Time</h3>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={statsData.applicationsOverTime}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stroke="#3357FF"
                    fill="#3357FF"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Applications Trend</h3>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={statsData.applicationsOverTime}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="applications" fill="#33FF57" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>
                Applications Trend (Area)
              </h3>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={statsData.applicationsOverTime}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stroke="#FF5733"
                    fill="#FF5733"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Applications Line Chart</h3>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={statsData.applicationsOverTime}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#8884d8"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle}>Applications Completed</h3>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={statsData.applicationsCompleted}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={50}
                    fill="#8884d8"
                    label
                  >
                    {statsData.applicationsCompleted.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <Modal
      isOpen={isModalOpen}
      onRequestClose={closeModal}
      contentLabel="Member Applications"
      className={styles.modal}
      overlayClassName={styles.overlay}
    >
      <h2>{modalData?.name} - Applications</h2>

      {/* Report button */}
      <button className={styles.reportButton} onClick={() => { 
        // Add your report logic here, e.g., open a new form, send an email, etc.
        console.log("Report button clicked for", modalData?.name); 
      }}>
        Report
      </button>

    </Modal>
    </div>
  );
};

export default SuperAdminDashboard;