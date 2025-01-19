const fetchPosts = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch("https://connectify-dn5y.onrender.com/posts", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching posts: ${response.statusText}`);
    }

    const data = await response.json();
    return data; // Return the fetched posts
  } catch (error) {
    console.error("Fetch posts error:", error);
    // Handle error appropriately
  }
};
