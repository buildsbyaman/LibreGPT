import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Chatwindow.css";
import Chat from "./Chat.jsx";
import myContext from "../context.js";

const Chatwindow = () => {
  const [selectModelOpen, setSelectModelOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const modelDropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  const {
    prompt,
    setPrompt,
    currThreadId,
    setNewChat,
    setPrevChats,
    sidebarOpen,
    setSidebarOpen,
    setisGettingReply,
    currentModel,
    setCurrentModel,
    isLoggedIn,
    setIsLoggedIn,
    setFlashMessage,
  } = useContext(myContext);

  useEffect(() => {}, [isLoggedIn]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target)
      ) {
        setSelectModelOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    };

    const apiResponse = await fetch(
      `${import.meta.env.VITE_LINK}/api/user/logout`,
      options
    );

    const response = await apiResponse.json();
    if (response.success || apiResponse.ok) {
      setIsLoggedIn(false);
      setFlashMessage({ message: "Successfully logged out!", type: "info" });
      navigate("/login");
    }
  };

  const handleAiSearch = async () => {
    if (!prompt.trim()) return;
    setisGettingReply(true);
    setNewChat(false);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        message: prompt,
        threadId: currThreadId,
        model: currentModel,
      }),
    };

    const promptCopy = prompt;
    setPrompt("");

    try {
      setPrevChats((prevChats) => [
        ...prevChats,
        {
          role: "user",
          content: promptCopy,
        },
      ]);

      const apiResponse = await fetch(
        `${import.meta.env.VITE_LINK}/api/chat`,
        options
      );
      const response = await apiResponse.json();
      setisGettingReply(false);

      setPrevChats((prevChats) => [
        ...prevChats,
        {
          role: "assistant",
          content: response,
        },
      ]);
    } catch (error) {
      setPrevChats((prevChats) => [
        ...prevChats,
        {
          role: "assistant",
          content: "Unable to connect to model online!",
        },
      ]);
      console.log("Some error occurred while fetching the data! ");
      setFlashMessage({ message: "Failed to get AI response!", type: "error" });
      setisGettingReply(false);
    }
  };

  return (
    <div className={`chat-window ${!sidebarOpen ? "sidebar-closed" : ""}`}>
      <div className="header">
        <img
          src="/sidebar.png"
          alt=""
          className={sidebarOpen ? "make-hidden" : ""}
          onClick={() => {
            setSidebarOpen(!sidebarOpen);
          }}
        />

        <div
          ref={modelDropdownRef}
          className="select-model"
          onClick={() => {
            setSelectModelOpen(!selectModelOpen);
          }}
        >
          <button className={`select-model-button`}>
            <p>{currentModel == "Nova2" ? "Nova 2 Lite" : currentModel}</p>
            <img src="/dropdown.png" alt="" />
          </button>

          <div
            className={`models-list ${
              selectModelOpen ? "position-absolute" : "display-none"
            }`}
          >
            <ul>
              <li
                onClick={() => {
                  setCurrentModel("ChatGPT");
                  setFlashMessage({
                    message: "Switched to ChatGPT",
                    type: "info",
                  });
                }}
              >
                ChatGPT
              </li>
              <li
                onClick={() => {
                  setCurrentModel("Gemini");
                  setFlashMessage({
                    message: "Switched to Gemini",
                    type: "info",
                  });
                }}
              >
                Gemini
              </li>
              <li
                onClick={() => {
                  setCurrentModel("Deepseek");
                  setFlashMessage({
                    message: "Switched to Deepseek",
                    type: "info",
                  });
                }}
              >
                Deepseek
              </li>
              <li
                onClick={() => {
                  setCurrentModel("Nova2");
                  setFlashMessage({
                    message: "Switched to Nova 2 Lite",
                    type: "info",
                  });
                }}
              >
                Nova 2 Lite
              </li>
            </ul>
          </div>
        </div>

        <div
          ref={userMenuRef}
          className="user-menu"
          onClick={() => setUserMenuOpen(!userMenuOpen)}
        >
          <img className="user-img" src="/user.png" alt="" />

          <div
            className={`user-dropdown ${
              userMenuOpen ? "position-absolute" : "display-none"
            }`}
          >
            <ul>
              {isLoggedIn ? (
                <li onClick={handleLogout}>Logout</li>
              ) : (
                <>
                  <li onClick={() => navigate("/login")}>Login</li>
                  <li onClick={() => navigate("/signup")}>Sign Up</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="actual-chat">
        <Chat />
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask anything"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
        />
        <button onClick={handleAiSearch}>
          <img src="/arrowup.png" alt="" />
        </button>
      </div>
    </div>
  );
};

export default Chatwindow;
