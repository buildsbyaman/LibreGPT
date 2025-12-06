import { useContext, useEffect } from "react";
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
  } = useContext(myContext);

  const changeThread = async (threadId) => {
    try {
      setNewChat(false);
      const APIcurrThreadData = await fetch(
        `${import.meta.env.VITE_LINK}/api/thread/${threadId}`,
        {
          method: "GET",
        }
      );
      const currThreadData = await APIcurrThreadData.json();
      const messagesArray = Array.isArray(currThreadData)
        ? currThreadData[0]?.messages || []
        : currThreadData.messages || [];
      setPrevChats(messagesArray);
      setCurrThreadId(threadId);
    } catch (error) {
      console.log("Error changing thread - ", error);
      setPrevChats([]);
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
      await fetch(`${import.meta.env.VITE_LINK}/api/thread/${threadId}`, {
        method: "DELETE",
      });

      setAllThreads((prevThreads) =>
        Array.isArray(prevThreads)
          ? prevThreads.filter((thread) => thread.threadId !== threadId)
          : []
      );

      newThreadInitialize();
    } catch (error) {
      console.log("Error deleting thread - ", error);
    }
  };

  useEffect(() => {
    const fetchAllThreads = async () => {
      try {
        const apiCallData = await fetch(
          `${import.meta.env.VITE_LINK}/api/thread`,
          {
            method: "GET",
          }
        );
        const jsonApiCallData = await apiCallData.json();

        if (Array.isArray(jsonApiCallData) && !jsonApiCallData.error) {
          const filteredThreadsData = jsonApiCallData.map((thread) => ({
            threadId: thread.threadId,
            title: thread.title,
          }));
          setAllThreads(filteredThreadsData);
        } else {
          console.log("Incompatible data format!⛔️");
        }
      } catch (error) {
        console.log("Error in fetch all threads - ", error);
        setAllThreads([
          {
            title: "Error fetching chats⛔️",
            threadId: "0",
          },
        ]);
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
        {Array.isArray(allThreads) &&
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
          ))}
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
