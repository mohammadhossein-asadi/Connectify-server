const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = 5000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // Add auth token if it exists
  const token = localStorage.getItem("token");
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  const finalOptions = {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
    },
    credentials: "include",
    signal: controller.signal,
    mode: "cors",
  };

  try {
    const response = await fetch(url, finalOptions);
    clearTimeout(id);

    // Handle CORS errors
    if (!response.ok) {
      const error = new Error(response.statusText);
      error.response = response;
      throw error;
    }

    return response;
  } catch (error) {
    clearTimeout(id);
    console.error("Fetch error:", error);
    throw error;
  }
};

// Add retry logic
const retryFetch = async (url, options, retries = 3) => {
  try {
    return await fetchWithTimeout(url, options);
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return retryFetch(url, options, retries - 1);
    }
    throw error;
  }
};

export const login = async (credentials) => {
  const response = await retryFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  return response.json();
};
