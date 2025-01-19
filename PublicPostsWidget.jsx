const fetchPosts = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("No authentication token available");
    }

    const response = await fetch("https://connectify-dn5y.onrender.com/posts", {
      method: "GET",
      headers: {
        Authorization: token, // Token already includes "Bearer " prefix
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch posts error:", error);
    throw error;
  }
};
