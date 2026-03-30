import { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Chatwindow.css";
import Chat from "./Chat.jsx";
import myContext from "../context.js";

const Chatwindow = () => {
  const [selectModelOpen, setSelectModelOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [availableModels, setAvailableModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(true);
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
    username,
    setUsername,
    setFlashMessage,
    theme,
    toggleTheme,
  } = useContext(myContext);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelsLoading(true);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/models`
        );
        const data = await response.json();

        if (data.success && data.models.length > 0) {
          const topModels = data.models.slice(0, 5);
          setAvailableModels(topModels);

          if (!currentModel || currentModel === "Deepseek") {
            setCurrentModel(topModels[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);

        setAvailableModels([
          { id: "openai/gpt-oss-120b:free", name: "ChatGPT" },
          { id: "google/gemini-2.0-flash-exp:free", name: "Gemini" },
          { id: "deepseek/deepseek-chat-v3-0324:free", name: "Deepseek" },
          { id: "amazon/nova-2-lite-v1:free", name: "Nova 2 Lite" },
          {
            id: "meta-llama/llama-3.3-70b-instruct:free",
            name: "Llama 3.3 70B",
          },
        ]);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, []);

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
      `${import.meta.env.VITE_API_URL}/api/user/logout`,
      options
    );

    const response = await apiResponse.json();
    if (response.success || apiResponse.ok) {
      setIsLoggedIn(false);
      setUsername("");
      setFlashMessage({ message: "Successfully logged out!", type: "info" });
      navigate("/login");
    }
  };

  const getCurrentModelName = () => {
    const model = availableModels.find((m) => m.id === currentModel);
    if (model) return model.name;
    if (currentModel && currentModel.includes("/")) {
      return currentModel
        .split("/")
        .pop()
        .replace(":free", "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }
    return currentModel || "Select Model";
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
        `${import.meta.env.VITE_API_URL}/api/chat`,
        options
      );
      const response = await apiResponse.json();
      setisGettingReply(false);

      const content =
        typeof response === "string"
          ? response
          : response.error || response.message || "Something went wrong!";

      setPrevChats((prevChats) => [
        ...prevChats,
        {
          role: "assistant",
          content: content,
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
            <p>
              {modelsLoading ? (
                <span className="models-loading-text">Loading…</span>
              ) : (
                getCurrentModelName()
              )}
            </p>
            <img src="/dropdown.png" alt="" />
          </button>

          <div
            className={`models-list ${
              selectModelOpen ? "position-absolute" : "display-none"
            }`}
          >
            {modelsLoading ? (
              <div className="models-loading">
                <div className="model-skeleton"></div>
                <div className="model-skeleton"></div>
                <div className="model-skeleton"></div>
              </div>
            ) : (
              <ul>
                {availableModels.map((model) => (
                  <li
                    key={model.id}
                    className={currentModel === model.id ? "model-active" : ""}
                    onClick={() => {
                      setCurrentModel(model.id);
                      setFlashMessage({
                        message: `Switched to ${model.name}`,
                        type: "info",
                      });
                    }}
                  >
                    <span className="model-name">{model.name}</span>
                    {currentModel === model.id && (
                      <span className="model-check">✓</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="header-right">
          {/* Theme toggle switch */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="theme-toggle-thumb">
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </span>
          </button>

          <div
            ref={userMenuRef}
            className="user-menu"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            {isLoggedIn && username && (
              <span className="username">{username}</span>
            )}
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
