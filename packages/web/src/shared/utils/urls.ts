export const dev_url = "http://localhost:5000/";
export const prod_url = "https://veoveo.onrender.com/";

// Automatically select URL based on environment
export const API_BASE_URL =
  import.meta.env.MODE === "development" ? dev_url : prod_url;
