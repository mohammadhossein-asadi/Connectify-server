const login = async (credentials) => {
  try {
    const response = await fetch(
      "https://connectify-dn5y.onrender.com/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();
    console.log("Login successful:", data); // Log the response
    return data; // Return the user data
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

const handleFormSubmit = async (values, onSubmitProps) => {
  try {
    const loggedIn = await login({
      email: values.email,
      password: values.password,
    });
    onSubmitProps.resetForm();
    if (loggedIn) {
      // Store the token in localStorage
      localStorage.setItem("token", loggedIn.token);
      dispatch(setLogin(loggedIn));
      navigate("/home");
    }
  } catch (error) {
    console.error("Form submission error:", error);
    // Handle error appropriately
  }
};
