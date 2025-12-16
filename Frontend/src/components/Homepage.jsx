import "./Homepage.css";
import Sidebar from "./Sidebar";
import Chatwindow from "./Chatwindow";

const Homepage = () => {
  return (
    <div className="flex">
      <Sidebar />
      <Chatwindow />
    </div>
  );
};

export default Homepage;
