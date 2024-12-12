import React, { useState, useCallback } from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import axios from 'axios';
import { useGlobalSearchParams } from 'expo-router';

const Chat = () => {

  const params = useGlobalSearchParams();
  const { id } = params

  const [messages, setMessages] = useState([]);
  const [processApprovalQuery, setProcessApprovalQuery] = useState(false); // Tracks if the user selected "Query regarding approval process"
  const [isLoading, setisLoading] = useState(false)
  // Initialize the chatbot with the first two options
  React.useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: 'How can I assist you today?',
        quickReplies: {
          type: 'radio', // or 'checkbox' if multiple answers are allowed
          values: [
            {
              title: 'Query regarding current application',
              value: 'query_current_application',
            },
            {
              title: 'Query regarding approval process',
              value: 'query_approval_process',
            },
          ],
        },
        user: {
          _id: 2,
          name: 'Chatbot',
        },
        createdAt: new Date(),
      },
    ]);
  }, []);

  // Handle user sending a message
  const onSend = useCallback((newMessages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );

    const lastMessage = newMessages[0];

    // If processApprovalQuery is true, send the user input to the backend
    if (processApprovalQuery=='overall') {
      handleQueryApprovalProcess(lastMessage.text);
    }else if(processApprovalQuery=='status'){
      handleStatusProcess(lastMessage.text)
    }
  }, [processApprovalQuery]);

  // Handle "Query regarding approval process"
  const handleQueryApprovalProcess = async (userQuestion) => {
    setisLoading(true)
    try {
      const response = await axios.post('http://172.16.10.249:8000/document_chat', {
        question: userQuestion,
        chat_history: [],
      });

      const { ai_response } = response.data;

      // Append the AI response to the chat
      const botMessage = {
        _id: Math.random().toString(), // Generate unique ID
        text: ai_response,
        user: {
          _id: 2,
          name: 'Chatbot',
        },
        createdAt: new Date(),
      };
      setisLoading(false)
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [botMessage])
      );
    } catch (error) {
      setisLoading(false)
      console.error('Error communicating with backend:', error);
      const errorMessage = {
        _id: Math.random().toString(), // Generate unique ID
        text: 'Something went wrong. Please try again later.',
        user: {
          _id: 2,
          name: 'Chatbot',
        },
        createdAt: new Date(),
      };

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [errorMessage])
      );
    }
  };


    // Handle "Query regarding approval process"
    const handleStatusProcess = async (userQuestion) => {
      setisLoading(true)
      try {
        const responsex = await axios.post('http://172.16.10.249:8000/status_chat', {  
          application_id: id,
          query: userQuestion,
        });
  
        const { response } = responsex.data;
  
        // Append the AI response to the chat
        const botMessage = {
          _id: Math.random().toString(), // Generate unique ID
          text: response,
          user: {
            _id: 2,
            name: 'Chatbot',
          },
          createdAt: new Date(),
        };
        setisLoading(false)
        setMessages((previousMessages) =>
          GiftedChat.append(previousMessages, [botMessage])
        );
      } catch (error) {
        setisLoading(false)
        console.error('Error communicating with backend:', error);
        const errorMessage = {
          _id: Math.random().toString(), // Generate unique ID
          text: 'Something went wrong. Please try again later.',
          user: {
            _id: 2,
            name: 'Chatbot',
          },
          createdAt: new Date(),
        };
  
        setMessages((previousMessages) =>
          GiftedChat.append(previousMessages, [errorMessage])
        );
      }
    };

    
  // Handle quick reply selections
  const onQuickReply = useCallback((replies = []) => {
    const reply = replies[0];
    const selectedOption = reply.value;

    const userReply = {
      _id: Math.random().toString(),
      text: reply.title,
      user: {
        _id: 1,
        name: 'User',
      },
      createdAt: new Date(),
    };

    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, [userReply])
    );

    if (selectedOption === 'query_approval_process') {
      setProcessApprovalQuery("overall"); // Enable query fetching for approval process
      const botMessage = {
        _id: Math.random().toString(),
        text: 'You can now ask your questions about the approval process.',
        user: {
          _id: 2,
          name: 'Chatbot',
        },
        createdAt: new Date(),
      };

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [botMessage])
      );
    } else {
      setProcessApprovalQuery("status"); // Disable query fetching
      const botMessage = {
        _id: Math.random().toString(),
        text: 'Feel free to ask your query about the current application.',
        user: {
          _id: 2,
          name: 'Chatbot',
        },
        createdAt: new Date(),
      };

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [botMessage])
      );
    }
  }, []);

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onSend(messages)}
      user={{
        _id: 1, // User ID
      }}
      onQuickReply={onQuickReply}
      isTyping={isLoading}
    />
  );
};

export default Chat;
