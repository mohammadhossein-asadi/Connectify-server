const API_BASE_URL = "https://connectify-server-six.vercel.app";

const fetchWithTimeout = async (url, options = {}) => {
  const { timeout = 5000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const finalOptions = {
    ...fetchOptions,
    headers: {
      ...defaultHeaders,
      ...fetchOptions.headers,
    },
    mode: "cors",
    credentials: "omit",
    signal: controller.signal,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, finalOptions);
    clearTimeout(id);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || response.statusText);
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

export const login = async (credentials) => {
  try {
    const response = await fetchWithTimeout("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
    return response.json();
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};
