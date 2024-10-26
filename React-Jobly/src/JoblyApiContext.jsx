import React, { createContext, useContext, useState, useEffect } from 'react';
import JoblyApi from './JoblyApi';

// Create a singleton instance of JoblyApi
const apiInstance = new JoblyApi();

const JoblyApiContext = createContext(apiInstance);

export const JoblyApiProvider = ({ children }) => {
  return (
    <JoblyApiContext.Provider value={apiInstance}>
      {children}
    </JoblyApiContext.Provider>
  );
};

export const useJoblyApiState = (property) => {
  const joblyApi = useContext(JoblyApiContext);
  const [value, setValue] = useState(joblyApi.state[property]);

  useEffect(() => {
    const observer = (newValue) => setValue(newValue);
    joblyApi.subscribe(property, observer);

    return () => joblyApi.unsubscribe(property, observer);
  }, [joblyApi, property]);

  return value ?? null;
};

export const useJoblyApi = () => useContext(JoblyApiContext);

export default { JoblyApiContext };