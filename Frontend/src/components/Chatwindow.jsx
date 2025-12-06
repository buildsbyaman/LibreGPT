import { useContext } from "react";
import "./Chatwindow.css";
import Chat from "./Chat.jsx";
import myContext from "../context.js";

const Chatwindow = () => {
  const {
    setReply,
    prompt,
    setPrompt,
    currThreadId,
    setNewChat,
    setPrevChats,
    sidebarOpen,
    setSidebarOpen,
    setisGettingReply,
  } = useContext(myContext);

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
      setReply(response);
      setisGettingReply(false);

      setPrevChats((prevChats) => [
        ...prevChats,
        {
          role: "assistant",
          content: response,
        },
      ]);
    } catch (error) {
      console.log("Some error occurred while fetching the data! ⛔️", error);
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
