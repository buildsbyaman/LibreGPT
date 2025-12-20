import { useContext, useEffect, useState } from "react";
import "./Sidebar.css";
import myContext from "../context";
import { v4 as uuid } from "uuid";

const Sidebar = () => {
  const {
    allThreads,
    setAllThreads,
    currThreadId,
    setCurrThreadId,
    setPrevChats,
    newChat,
    setNewChat,
    sidebarOpen,
    setSidebarOpen,
    setFlashMessage,
  } = useContext(myContext);

  const [isFetchChatsOk, setIsFetchChatsOk] = useState(true);

  const changeThread = async (threadId) => {
    try {
      setNewChat(false);
      const APIcurrThreadData = await fetch(
        `${import.meta.env.VITE_API_URL}/api/thread/${threadId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      const currThreadData = await APIcurrThreadData.json();
      const messagesArray = Array.isArray(currThreadData)
        ? currThreadData[0]?.messages || []
        : currThreadData.messages || [];
      setPrevChats(messagesArray);
      setCurrThreadId(threadId);
    } catch (error) {
      setPrevChats([]);
      setFlashMessage({
        message: "Failed to load chat thread!",
        type: "error",
      });
    }
  };

  const newThreadInitialize = () => {
    if (newChat) return;
    setCurrThreadId(uuid());
    setNewChat(true);
    setPrevChats([]);
  };

  const deleteThread = async (threadId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/thread/${threadId}`, {
        method: "DELETE",
        credentials: "include",
      });

      setAllThreads((prevThreads) =>
        Array.isArray(prevThreads)
          ? prevThreads.filter((thread) => thread.threadId !== threadId)
          : []
      );

      setFlashMessage({
        message: "Chat deleted successfully!",
        type: "success",
      });
      newThreadInitialize();
    } catch (error) {
      setFlashMessage({ message: "Failed to delete chat!", type: "error" });
    }
  };

  useEffect(() => {
    const fetchAllThreads = async () => {
      try {
        const apiCallData = await fetch(
          `${import.meta.env.VITE_API_URL}/api/thread`,
          {
            method: "GET",
            credentials: "include",
          }
        );
        const jsonApiCallData = await apiCallData.json();

        if (!jsonApiCallData.error && !jsonApiCallData.warning) {
          const filteredThreadsData = jsonApiCallData.map((thread) => ({
            threadId: thread.threadId,
            title: thread.title,
          }));
          setAllThreads(filteredThreadsData);
        } else {
          if (jsonApiCallData.warning) {
            return;
          } else {
            setFlashMessage({
              message: "Failed to load chat history!",
              type: "warning",
            });
          }
        }
      } catch (error) {
        setIsFetchChatsOk(false);
        setFlashMessage({
          message: "Could not connect to server!",
          type: "error",
        });
      }
    };

    fetchAllThreads();
  }, [currThreadId, newChat, setAllThreads]);

  return (
    <div className={`sidebar ${sidebarOpen ? "open" : "close"}`}>
      <div className="sidebar-logo-newchat-div">
        <div className="logo-sidebar-img-div">
          <img src="/Logo.png" alt="Logo" />
          <img
            src="/sidebar.png"
            alt="Toggle sidebar"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
        <button
          className={newChat ? "new-chat selected-thread" : "new-chat"}
          onClick={() => newThreadInitialize()}
        >
          <img src="/newchat.png" alt="icon" /> &nbsp; <span>New Chat</span>
        </button>
      </div>
      <div className="sidebar-chats-div">
        {isFetchChatsOk ? (
          Array.isArray(allThreads) &&
          allThreads.map((thread) => (
            <li
              key={thread.threadId}
              className={
                thread.threadId === currThreadId ? "selected-thread" : ""
              }
              onClick={() => changeThread(thread.threadId)}
            >
              <p>{thread.title}</p>
              <img
                onClick={(event) => {
                  event.stopPropagation();
                  deleteThread(thread.threadId);
                }}
                id="trash-icon"
                src="/trash.png"
                alt=""
              />
            </li>
          ))
        ) : (
          <p>Error fetching chats from server!</p>
        )}
      </div>
      <div className="sidebar-build-by-div">
        <p>
          Build by{" "}
          <a href="https://buildsbyaman.vercel.app" target="_blank">
            Aman
          </a>
          ❤️
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
