import Signup from "./components/Signup.jsx";
import Login from "./components/Login.jsx";
import Homepage from "./components/Homepage.jsx";
import Flash from "./components/Flash.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import myContext from "./context.js";
import { v4 as uuid } from "uuid";

function App() {
  const [prompt, setPrompt] = useState("");
  const [currThreadId, setCurrThreadId] = useState(uuid());
  const [newChat, setNewChat] = useState(true);
  const [prevChats, setPrevChats] = useState([]);
  const [allThreads, setAllThreads] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 900);
  const [isGettingReply, setisGettingReply] = useState(false);
  const [currentModel, setCurrentModel] = useState("Deepseek");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [flashMessage, setFlashMessage] = useState({ message: "", type: "" });

  useEffect(() => {
    const fetchLoginStatus = async () => {
      try {
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        };

        const apiResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/api/user/status`,
          options
        );

        const response = await apiResponse.json();
        if (response.loginStatus === "true" && response.user) {
          setIsLoggedIn(true);
          setUsername(response.user.username || "");
        } else {
          setIsLoggedIn(false);
          setUsername("");
        }
      } catch (error) {
        setIsLoggedIn(false);
      }
    };
    fetchLoginStatus();
  }, []);

  const providerValues = {
    prompt,
    setPrompt,
    currThreadId,
    setCurrThreadId,
    newChat,
    setNewChat,
    prevChats,
    setPrevChats,
    allThreads,
    setAllThreads,
    sidebarOpen,
    setSidebarOpen,
    isGettingReply,
    setisGettingReply,
    currentModel,
    setCurrentModel,
    isLoggedIn,
    setIsLoggedIn,
    username,
    setUsername,
    flashMessage,
    setFlashMessage,
  };

  return (
    <myContext.Provider value={providerValues}>
      <Flash />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />}></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/signup" element={<Signup />}></Route>
        </Routes>
      </BrowserRouter>
    </myContext.Provider>
  );
}

export default App;
