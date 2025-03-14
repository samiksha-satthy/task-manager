"use client";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useState, createContext } from "react";
import toast from "react-hot-toast";
import axios from "axios";

const UserContext = React.createContext();

export const UserContextProvider = ({ children }) => {
  const serverUrl = "http://localhost:8000";

  const router = useRouter();

  const [user, setUser] = useState({});
  const [allUsers, setAllUsers] = useState([]);

  const [userState, setUserState] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  //get user details
  const getUser = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${serverUrl}/api/v1/profile`, {
        withCredentials: true, //send cookies
      });

      setUser((prevState) => {
        return {
          ...prevState,
          ...res.data,
        };
      });

      setLoading(false);
    } catch (error) {
      console.log("error getting user details", error);
      setLoading(false);
      toast.error(error.response.data.message);
    }
  };

  //register user
  const registerUser = async (e) => {
    e.preventDefault();
    if (
      !userState.password ||
      !userState.email.includes("@") ||
      userState.password.length < 6
    ) {
      toast.error("Please enter a valid email OR password (min 6 characters)");
      return;
    }

    try {
      const res = await axios.post(`${serverUrl}/api/v1/register`, userState);
      console.log("user registered successfully");
      toast.success("user registered successfully");

      //clear the form
      setUserState({ name: "", email: "", password: "" });

      //redirect user to login page
      router.push("/login");
    } catch (error) {
      console.log("error registering user", error);
      toast.error(error.response.data.message);
    }
  };

  //login user
  const loginUser = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        `${serverUrl}/api/v1/login`,
        {
          email: userState.email,
          password: userState.password,
        },
        {
          withCredentials: true, //this sends cookies and if cookies are cleared, user is logged out
        }
      );

      toast.success("user logged in successfully");

      //clear form
      setUserState({
        email: "",
        password: "",
      });

      await getUser();

      //push user to dashboard page
      router.push("/");
    } catch (error) {
      console.log("error logging in user", error);
      const errorMessage =
        error?.response?.data?.message || // This assumes message is an object
        (typeof error?.response?.data === "string"
          ? error.response.data
          : null) || // If it's just a string
        error?.message ||
        "Something went wrong, please try again";

      toast.error(errorMessage);
    }
  };

  //get user status
  const userLoginStatus = async () => {
    let loggedIn = false;
    try {
      const res = await axios.get(`${serverUrl}/api/v1/login-status`, {
        withCredentials: true, //sends cookies to server
      });

      //force string to boolean
      loggedIn = !!res.data;
      setLoading(false);

      if (!loggedIn) {
        router.push("/login");
      }
    } catch (error) {
      console.log("error getting user login status", error);
      toast.error(error.response.data.message);
    }

    return loggedIn;
  };

  //logout user
  const logoutUser = async () => {
    try {
      const res = await axios.get(`${serverUrl}/api/v1/logout`, {
        withCredentials: true, //send cookies
      });

      toast.success("user logged out successfully");

      //redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.log("error logging out user", error);
      toast.error(error.response.data.message);
    }
  };

  //update user details
  const updateUser = async (e, data) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.patch(`${serverUrl}/api/v1/update`, data, {
        withCredentials: true,
      });

      //update user state
      setUser((prevState) => {
        return {
          ...prevState,
          ...res.data,
        };
      });

      toast.success("user updated successfully");

      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast.error(error.response.data.message);
    }
  };

  const updatePassword = async (currentPassword, newPassword) => {
    setLoading(true);

    try {
      const res = await axios.patch(
        `${serverUrl}/api/v1/update/password`,
        {currentPassword, newPassword},
        {
          withCredentials: true,
        }
      );

      //update user state
      setUser((prevState) => {
        return {
          ...prevState,
          ...res.data,
        };
      });

      toast.success("password updated successfully");

      console.log("neew password", user.password);

      setLoading(false);
    } catch (error) {
      toast.error(error.response.data.message);
      setLoading(false);
    }
  };

  //dynamic form handler
  const handlerUserInput = (name) => (e) => {
    const value = e.target.value;

    setUserState((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  //initial render
  useEffect(() => {
    const loginStatusGetUser = async () => {
      const isLoggedIn = await userLoginStatus();
      console.log("isLoggedIn", isLoggedIn);

      if (isLoggedIn) {
        getUser();
      }
    };

    loginStatusGetUser();
  }, []);

  return (
    <UserContext.Provider
      value={{
        registerUser,
        userState,
        handlerUserInput,
        loginUser,
        logoutUser,
        userLoginStatus,
        user,
        updateUser,
        updatePassword,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  return useContext(UserContext);
};
