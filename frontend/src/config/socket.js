import io from "socket.io-client";
import axios from "axios";

// Create a socket connection
const socket = io("http://your-backend-url");

// Create a custom component for API calls
const api = {
  // Function to make a GET request
  get: async (url, params) => {
    try {
      const response = await axios.get(url, { params });
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Function to make a POST request
  post: async (url, data) => {
    try {
      const response = await axios.post(url, data);
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Function to make a PUT request
  put: async (url, data) => {
    try {
      const response = await axios.put(url, data);
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  },

  // Function to make a DELETE request
  delete: async (url) => {
    try {
      const response = await axios.delete(url);
      return response.data;
    } catch (error) {
      throw new Error(error.message);
    }
  },
};

export { socket, api };
