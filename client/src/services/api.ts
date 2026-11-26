import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token from localStorage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for structured error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData = error.response?.data?.error;
    let message =
      errorData?.message ||
      error.message ||
      'An unexpected error occurred. Please try again.';

    // If validation error details exist, format specific field-level messages
    if (errorData?.details && Array.isArray(errorData.details) && errorData.details.length > 0) {
      const detailedMessages = errorData.details
        .map((d: any) => {
          const fieldName = d.field ? d.field.charAt(0).toUpperCase() + d.field.slice(1) : '';
          return fieldName ? `${fieldName}: ${d.message}` : d.message;
        })
        .join('. ');

      if (detailedMessages) {
        message = detailedMessages;
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
