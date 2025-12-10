import { useContext, useState, useRef, useEffect } from "react";
import "./Chatwindow.css";
import Chat from "./Chat.jsx";
import myContext from "../context.js";

const Chatwindow = () => {
  const [selectModelOpen, setSelectModelOpen] = useState(false);
  const modelDropdownRef = useRef(null);

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
  } = useContext(myContext);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target)
      ) {
        setSelectModelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAiSearch = async () => {
    if (!prompt.trim()) return;
    setisGettingReply(true);
    setNewChat(false);
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
          content: "Unable to connect to model online!⛔️",
        },
      ]);
      console.log("Some error occurred while fetching the data! ⛔️");
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
                }}
              >
                ChatGPT
              </li>
              <li
                onClick={() => {
                  setCurrentModel("Gemini");
                }}
              >
                Gemini
              </li>
              <li
                onClick={() => {
                  setCurrentModel("Deepseek");
                }}
              >
                Deepseek
              </li>
              <li
                onClick={() => {
                  setCurrentModel("Nova2");
                }}
              >
                Nova 2 Lite
              </li>
            </ul>
          </div>
        </div>

        <img className="user-img" src="/user.png" alt="" />
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
