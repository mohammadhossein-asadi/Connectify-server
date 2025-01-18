const login = async (values) => {
  try {
    const response = await fetch(
      "https://connectify-server-six.vercel.app/auth/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        mode: "cors",
        credentials: "omit",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

const handleFormSubmit = async (values, onSubmitProps) => {
  try {
    const loggedIn = await login(values);
    onSubmitProps.resetForm();
    if (loggedIn) {
      dispatch(setLogin(loggedIn));
      navigate("/home");
    }
  } catch (error) {
    console.error("Form submission error:", error);
    // Handle error appropriately
  }
};
