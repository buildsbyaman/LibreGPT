import { useContext, useEffect, useRef } from "react";
import "./Chat.css";
import myContext from "../context";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { SyncLoader } from "react-spinners";

const Chat = () => {
  const { newChat, prevChats, loading, isGettingReply } = useContext(myContext);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [prevChats, isGettingReply]);

  return (
    <div className="chats">
      {newChat && <p id="new-chat-message"> How can I help you today ? </p>}
      {prevChats?.map((chat, idx) => (
        <div
          className={chat.role === "user" ? "user-chat-div" : "gpt-chat-div"}
          key={`${chat.role}-${idx}`}
        >
          {chat.role === "user" ? (
            <div className="user-message">{chat.content}</div>
          ) : (
            <div className="gpt-message">
              <Markdown rehypePlugins={[rehypeHighlight]}>
                {chat.content}
              </Markdown>
            </div>
          )}
        </div>
      ))}
      {isGettingReply && (
        <div className="gpt-chat-div">
          <SyncLoader
            className="loader"
            color={"#efeaea"}
            loading={loading}
            id="sync-loader"
          />
        </div>
      )}
      <div ref={chatEndRef} />
    </div>
  );
};

export default Chat;
