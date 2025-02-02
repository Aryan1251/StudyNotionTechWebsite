import axios from "axios";

export const axiosInstance = axios.create({});

export const apiConnector = (method, url, bodyData, headers, params) => {
  return axiosInstance({
    method: `${method}`,
    url: `${url}`,
    data: bodyData ? bodyData : null,
    headers: headers ? headers : null,
    params: params ? params : null,
  });
};

// Axios is a popular JavaScript library used to make HTTP requests from the browser or Node.js.
// It provides a simple and intuitive API to interact with RESTful APIs and perform actions 
// like GET, POST, PUT, DELETE, etc.