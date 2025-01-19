const fetchPosts = async () => {
  const token = localStorage.getItem("token"); // Adjust based on your token storage
  const response = await fetch("https://connectify-dn5y.onrender.com/posts", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  // Handle response...
};
