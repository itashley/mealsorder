import axios from 'axios';
import { getToken } from './Common'; // Ensure the correct path is used

// Function to get the token dynamically
const getAuthToken = () => {
  const token = getToken();
  return token ? `Bearer ${token}` : '';
};

// Create an Axios instance
const instance = axios.create({
  baseURL: 'https://meals.primahotelindonesia.info/',
  headers: {
   
    'content-type': 'text/json',
  },
});

// Add a request interceptor to attach the token dynamically
instance.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
