import axios from 'axios';
import { toast } from 'react-toastify';

// Add setUser parameter to update App.jsx state
export const setupAuthInterceptors = (navigate, setUser) => {
  // Add a response interceptor
  axios.interceptors.response.use(
    response => response,  // Pass successful responses through
    error => {
      // Check if error is due to unauthorized access (401)
      if (error.response && error.response.status === 401) {
        // Check if error message indicates expired token
        const isExpired = 
          error.response.data?.message?.includes('expired') || 
          error.message?.includes('expired');
          
        if (isExpired) {
          // Clear authentication data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          // Update user state in App component
          if (setUser) {
            setUser(null);
          }
          
          // Show notification to user
          toast.error('Your session has expired. Please log in again.');
          
          // Redirect to login page
          if (navigate) {
            navigate('/login');
          } else {
            // Fallback if navigate function is not available
            window.location.href = '/login';
          }
        }
      }
      
      // Propagate the error for further handling
      return Promise.reject(error);
    }
  );
};

// Function to check if token exists and is potentially valid
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  // Optional: Add basic JWT structure validation here
  // Note: This doesn't verify the signature, just checks format
  
  return true;
};