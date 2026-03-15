import { useEffect, useState, useRef } from "react";
import API from "../../services/api";
import { FaBell } from "react-icons/fa";
import "../../styles/student/Notification.css";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef();

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClick = async (notification) => {
    try {
      await API.put(`/notifications/${notification.id}/read`);
      await fetchNotifications();
      alert("🚀 Space is available! Send request fast!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="notification-wrapper" ref={wrapperRef}>
      <div className="bell-icon" onClick={() => setOpen(!open)}>
        <FaBell />
        {notifications.length > 0 && (
          <span className="badge">{notifications.length}</span>
        )}
      </div>

      {open && (
        <div className="notification-dropdown">
          {notifications.length === 0 ? (
            <p>No Notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className="notification-item"
                onClick={() => handleClick(n)}
              >
                Space available in "{n.project_title}"
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;