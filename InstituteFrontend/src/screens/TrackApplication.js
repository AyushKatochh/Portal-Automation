import React, { useState, useEffect } from "react";
import { MessageBox, Input, Button, MessageList } from "react-chat-elements";
import "react-chat-elements/dist/main.css"; // Import default styles
import axios from "axios";
import ReactMarkdown from "react-markdown"; // Install this library for Markdown support
import { useParams } from "react-router-dom";
import "./trackApplication.css";
import Navbar from "../components/Navbar";

export default function ApplicationStatus() {
  const { applicationId } = useParams();

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [processApprovalQuery, setProcessApprovalQuery] = useState(null); // Track approval process mode
  const [showOptions, setShowOptions] = useState(true); // Track whether to show options

  const [application, setApplication] = useState(null);
  const [statusLogs, setStatusLogs] = useState([]);
  const [instituteName, setInstituteName] = useState('');
  const [istyping, setisTyping] = useState(false)


  useEffect(() => {
    // Fetch user data from local storage
    const storedUserData = JSON.parse(localStorage.getItem('userData'));
    if (storedUserData) {
      setInstituteName(storedUserData.instituteName);
    } else {
      // Handle case where user data is not found (e.g., redirect to login)
      console.error("User data not found in local storage.");
    }
  }, []);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await axios.get(
          `http://192.168.27.32:5000/api/track-application/${applicationId}`
        );
        const data = response.data.logs_id;

        if (data) {
          setApplication(data);
          setStatusLogs(data.status_logs || []);
        }
      } catch (error) {
        console.error("Error fetching application:", error);
      }
    };

    fetchApplication();
  }, [applicationId]);

  // Initialize chatbot with options
  React.useEffect(() => {
    setMessages([
      {
        position: "left",
        type: "text",
        text: "How can I assist you today?",
        date: new Date(),
      },
    ]);
  }, []);

  // Handle sending messages
  const sendMessage = async () => {

    setisTyping(true)
    if (!currentMessage.trim()) return;

    // Append user message to chat
    const userMessage = {
      position: "right",
      type: "text",
      text: currentMessage,
      date: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);

    if (processApprovalQuery === "overall") {
      // Send user query to the backend if in approval process mode
      try {
        const response = await axios.post(
          "http://localhost:8000/document_chat",
          {
            question: currentMessage,
            chat_history: [], // Add chat history if needed
          }
        );

        const botResponse = {
          position: "left",
          type: "text",
          text: response.data.ai_response,
          date: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } catch (error) {
        console.error("Error communicating with backend:", error);
        const errorMessage = {
          position: "left",
          type: "text",
          text: "Something went wrong. Please try again later.",
          date: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    } else if (processApprovalQuery === "status") {
      try {
        const response = await axios.post("http://localhost:8000/status_chat", {
          application_id: applicationId,
          query: currentMessage,
        });

        const botResponse = {
          position: "left",
          type: "text",
          text: response.data.response,
          date: new Date(),
        };
        setisTyping(false)
        setMessages((prevMessages) => [...prevMessages, botResponse]);
      } catch (error) {
        console.error("Error communicating with backend:", error);
        const errorMessage = {
          position: "left",
          type: "text",
          text: "Something went wrong. Please try again later.",
          date: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      }
    }
    setCurrentMessage(""); // Clear input field
  };

  // Handle quick reply selection
  const handleOptionSelect = (option) => {
    const userReply = {
      position: "right",
      type: "text",
      text: option.title,
      date: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userReply]);
    setShowOptions(false); // Hide options after selection

    if (option.value === "query_approval_process") {
      setProcessApprovalQuery("overall"); // Enable backend interaction
      const botMessage = {
        position: "left",
        type: "text",
        text: "You can now ask your questions about the approval process.",
        date: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } else {
      setProcessApprovalQuery("status"); // Disable backend interaction
      const botMessage = {
        position: "left",
        type: "text",
        text: "Feel free to ask your query about the current application.",
        date: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return "";

    try {
      const date = new Date(isoDate);
      if (isNaN(date)) throw new Error("Invalid Date");

      const options = { day: "2-digit", month: "short", year: "numeric" };
      return new Intl.DateTimeFormat("en-US", options).format(date);
    } catch (error) {
      console.error("Date formatting error:", error.message);
      return "Invalid Date";
    }
  };

  const renderStage = (stageName, stageData) => (
    <div className="card" key={stageName}>
      <div className="card-content">
        <i
          className={`icon ${
            stageData.is_completed
              ? "icon-check-circle"
              : "icon-hourglass-empty"
          }`}
          style={{
            color: stageData.is_completed ? "green" : "orange",
            fontSize: "24px",
          }}
        />
        <div className="text-content">
          <h3 className="card-title">{stageName}</h3>
          <p className="card-text">
            {stageData.is_completed
              ? "Evaluation is completed for this stage"
              : stageData.is_allocated
              ? "Application is allocated to the Evaluator"
              : ""}
          </p>
          <p className="card-text">
            {stageData.deadline &&
              `Deadline: ${formatDate(stageData.deadline)}`}
          </p>
          <p className="card-text">
            {stageData.is_completed && `Remark: ${stageData.remark}`}
          </p>
          <p className="card-text">
            Status:{" "}
            {stageData.is_completed
              ? stageData.success
                ? "Approved"
                : "Rejected"
              : "Pending"}
          </p>
          <p className="card-text">
            {stageData.verification_timestamp &&
              `Verification Date: ${formatDate(
                stageData.verification_timestamp
              )}`}
          </p>
        </div>
      </div>
      <div
        className="progress-bar"
        style={{
          width: "100%",
          backgroundColor: "#f0f0f0",
          height: "6px",
          borderRadius: "4px",
          overflow: "hidden",
          marginTop: "8px",
        }}
      >
        <div
          style={{
            width: stageData.is_completed ? "100%" : "50%",
            height: "100%",
            backgroundColor: stageData.is_completed ? "green" : "orange",
          }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="xyz">
      <Navbar name={instituteName} activeKey={"Track Application"}/>
    <div className="outer-container">
      <div className="container">
        <h2 className="header">{application?.status}</h2>
        {application ? (
          <div>

            <h3 className="title">Stages</h3>
            {Object.entries(application.stage || {}).map(
              ([stageName, stageData]) => renderStage(stageName, stageData)
            )}
          </div>
        ) : (
          <p className="loading">Loading application data...</p>
        )}
      </div>
      <div className="chat-container">
      <h3 style={{lineHeight:0.8}} className="title">SARTHI {istyping && <span style={{color:'green'}}>is Analyzing</span>}</h3>

        <MessageList
          className="message-list"
          lockable={true}
          toBottomHeight={"100%"}
          dataSource={messages.map((msg) => ({
            ...msg,
            text: <ReactMarkdown>{msg.text}</ReactMarkdown>, // Render Markdown
          }))}
        />
        {/* Render Options if visible */}
        {showOptions && (
          <div className="options-container">
            <button
              className="custom-button"
              onClick={() =>
                handleOptionSelect({
                  title: "Query regarding current application",
                  value: "query_current_application",
                })
              }
            >
              Query regarding current application
            </button>
            <button
              className="custom-button"
              onClick={() =>
                handleOptionSelect({
                  title: "Query regarding approval process",
                  value: "query_approval_process",
                })
              }
              >
              Query regarding approval process
            </button>
          </div>
        )}
        {!showOptions && <div className="chat-input">
          <Input
            placeholder="Type a message..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
          <Button text="Send" onClick={sendMessage} />
        </div>}
      </div>
    </div>
            {statusLogs.length > 0 ? (
              <ul className="log-list">
                {statusLogs.map((log) => (
                  <li className="log-card" key={log._id}>
                    <p className="log-text">{log.message}</p>
                    <p className="log-timestamp">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-logs">No logs available</p>
            )}
            </div>
  );
}


