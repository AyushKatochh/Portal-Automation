import React, { createContext, useState, useEffect } from 'react';
import moment from 'moment';

const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [currentTime, setCurrentTime] = useState(moment().format('dddd, MMMM Do YYYY, h:mm:ss a'));

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(moment().format('dddd, MMMM Do YYYY, h:mm:ss a'));
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const contextValue = {
    currentTime,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export { AppContext, AppProvider };