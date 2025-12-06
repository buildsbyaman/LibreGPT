import { useState } from "react";
import "./App.css";
import Chatwindow from "./components/Chatwindow";
import Sidebar from "./components/Sidebar";
import myContext from "./context.js";
import { v4 as uuid } from "uuid";

function App() {
  const [reply, setReply] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [currThreadId, setCurrThreadId] = useState(uuid());
  const [newChat, setNewChat] = useState(true);
  const [prevChats, setPrevChats] = useState([]);
  const [allThreads, setAllThreads] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isGettingReply, setisGettingReply] = useState(false);

  const providerValues = {
    reply,
    setReply,
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
  };

  return (
    <myContext.Provider value={providerValues}>
      <div className="flex">
        <Sidebar />
        <Chatwindow />
      </div>
    </myContext.Provider>
  );
}

export default App;
