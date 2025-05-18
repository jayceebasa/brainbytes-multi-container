import { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import Head from "next/head";

export default function Profile() {
  const [user, setUser] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: null,
    joinDate: "2024-11-15",
  });

  const [stats, setStats] = useState({
    totalQuestions: 0,
    subjectBreakdown: {
      Math: 0,
      Science: 0,
      History: 0,
      Language: 0,
      Technology: 0,
      General: 0,
    },
    streak: 5,
    lastActive: "Today",
  });

  const [settings, setSettings] = useState({
    preferredSubjects: ["Math", "Technology"],
    notificationsEnabled: true,
    theme: "light",
  });

  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [updatedUser, setUpdatedUser] = useState({});

  // Fetch user data and stats
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);

        // Fetch user profile data (using correct port)
        const userResponse = await axios.get("http://localhost:3000/api/users/me");
        setUser(userResponse.data);

        // Fetch learning stats from correct port
        const statsResponse = await axios.get("http://localhost:3000/api/users/stats");

        // Process and set the stats from real chat data
        const chatStats = statsResponse.data;

        const subjectBreakdown = {
          Math: 0,
          Science: 0,
          History: 0,
          Language: 0,
          Technology: 0,
          General: 0,
        };

        // Populate subject breakdown from actual data
        chatStats.subjectData.forEach((item) => {
          if (subjectBreakdown.hasOwnProperty(item.subject)) {
            subjectBreakdown[item.subject] = item.count;
          } else {
            subjectBreakdown.General += item.count;
          }
        });

        // Calculate total questions across all subjects
        const totalQuestions = chatStats.totalQuestions;

        setStats({
          totalQuestions,
          subjectBreakdown,
          streak: chatStats.streak || 0,
          lastActive: chatStats.lastActive ? new Date(chatStats.lastActive).toLocaleDateString() : "Never",
        });

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setLoading(false);
        setNotification("Failed to load profile data");
        setTimeout(() => setNotification(""), 3000);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // Initialize updated user state from current user data
    if (!loading && !editMode) {
      setUpdatedUser({ ...user });
    }
  }, [loading, user, editMode]);

  const handleEditToggle = () => {
    if (editMode) {
      // Exiting edit mode without saving
      setUpdatedUser({ ...user });
    }
    setEditMode(!editMode);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedUser((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUpdatedUser((prev) => ({
          ...prev,
          avatar: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingChange = (setting, value) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));

    // Show notification
    setNotification(`${setting} setting updated`);
    setTimeout(() => setNotification(""), 3000);
  };

  const handlePreferredSubjectToggle = (subject) => {
    setSettings((prev) => {
      const updated = { ...prev };

      if (updated.preferredSubjects.includes(subject)) {
        updated.preferredSubjects = updated.preferredSubjects.filter((s) => s !== subject);
      } else {
        updated.preferredSubjects = [...updated.preferredSubjects, subject];
      }

      return updated;
    });
  };

  // Add the handler functions here
  const handleClearPreferredSubjects = () => {
    setSettings((prev) => ({
      ...prev,
      preferredSubjects: [],
    }));
    setNotification("Preferred subjects cleared");
    setTimeout(() => setNotification(""), 3000);
  };

  const handleResetNotifications = () => {
    setSettings((prev) => ({
      ...prev,
      notificationsEnabled: true,
    }));
    setNotification("Notification settings reset to default");
    setTimeout(() => setNotification(""), 3000);
  };

  const handleResetTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: "light",
    }));
    setNotification("Theme reset to default");
    setTimeout(() => setNotification(""), 3000);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);

      // In a real app, this would be an actual API call
      // await axios.put("http://localhost:3000/api/user", updatedUser);

      // Simulate API call
      setTimeout(() => {
        setUser(updatedUser);
        setEditMode(false);
        setLoading(false);
        setNotification("Profile updated successfully");
        setTimeout(() => setNotification(""), 3000);
      }, 800);
    } catch (error) {
      console.error("Error updating profile:", error);
      setLoading(false);
      setNotification("Error updating profile");
      setTimeout(() => setNotification(""), 3000);
    }
  };

  return (
    <>
      <Head>
        <title>Profile - BrainBytes AI Tutor</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="container">
        <header>
          <h1>BrainBytes AI Tutor</h1>
          <nav>
            <Link href="/">Home</Link>
            <Link href="/dashboard">Dashboard</Link>
          </nav>
        </header>

        {notification && <div className="notification">{notification}</div>}

        <div className="content-grid">
          <div className="profile-section">
            <h2>User Profile</h2>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
                <p>Loading profile data...</p>
              </div>
            ) : (
              <div className="profile-card">
                <div className="avatar-container">
                  {editMode ? (
                    <div className="edit-avatar">
                      <div className="avatar" style={{ backgroundImage: updatedUser.avatar ? `url(${updatedUser.avatar})` : "none" }}>
                        {!updatedUser.avatar && updatedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <label className="avatar-upload-btn">
                        Change
                        <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                      </label>
                    </div>
                  ) : (
                    <div className="avatar" style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : "none" }}>
                      {!user.avatar && user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="profile-info">
                  {editMode ? (
                    <div className="edit-form">
                      <div className="form-group">
                        <label>Name</label>
                        <input type="text" name="name" value={updatedUser.name || ""} onChange={handleInputChange} />
                      </div>
                      <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={updatedUser.email || ""} onChange={handleInputChange} />
                      </div>
                      <div className="button-group">
                        <button className="secondary-button" onClick={handleEditToggle}>
                          Cancel
                        </button>
                        <button className="primary-button" onClick={handleSaveProfile}>
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>{user.name}</h3>
                      <p className="email">{user.email}</p>
                      <p className="join-date">Member since {new Date(user.joinDate).toLocaleDateString()}</p>
                      <button className="edit-button" onClick={handleEditToggle}>
                        Edit Profile
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="stats-section">
            <h2>Learning Stats</h2>
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                {stats.totalQuestions === 0 ? (
                  <div className="empty-stats">
                    <p>No learning activity recorded yet.</p>
                    <Link href="/">
                      <a className="start-learning-btn">Start Learning Now</a>
                    </Link>
                  </div>
                ) : (
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-value">{stats.totalQuestions}</div>
                      <div className="stat-label">Total Questions</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{stats.streak}</div>
                      <div className="stat-label">Day Streak</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-value">{stats.lastActive}</div>
                      <div className="stat-label">Last Active</div>
                    </div>

                    <div className="subject-stats-card">
                      <h4>Subject Distribution</h4>
                      <div className="subject-bars">
                        {Object.entries(stats.subjectBreakdown).map(([subject, count]) => (
                          <div className="subject-stat" key={subject}>
                            <div className="subject-label">
                              <span>{subject}</span>
                              <span>{count}</span>
                            </div>
                            <div className="subject-progress-bg">
                              <div
                                className="subject-progress-bar"
                                style={{
                                  width: `${(count / stats.totalQuestions) * 100}%`,
                                  backgroundColor:
                                    subject === "Math"
                                      ? "#1a56db"
                                      : subject === "Science"
                                      ? "#0e9f6e"
                                      : subject === "History"
                                      ? "#e3a008"
                                      : subject === "Language"
                                      ? "#9061f9"
                                      : subject === "Technology"
                                      ? "#1c64f2"
                                      : "#6b7280",
                                }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="settings-section">
            <h2>Preferences</h2>
            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : (
              <div className="settings-cards">
                <div className="settings-card">
                  <div className="settings-header">
                    <h4>Preferred Subjects</h4>
                    <button className="clear-button" onClick={handleClearPreferredSubjects}>
                      Clear All
                    </button>
                  </div>
                  <p className="settings-description">Select subjects you're most interested in learning</p>
                  <div className="subject-chips">
                    {Object.keys(stats.subjectBreakdown).map((subject) => (
                      <button
                        key={subject}
                        className={`subject-chip ${settings.preferredSubjects.includes(subject) ? "active" : ""}`}
                        onClick={() => handlePreferredSubjectToggle(subject)}>
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="settings-card">
                  <div className="settings-header">
                    <h4>Notification Settings</h4>
                    <button className="clear-button" onClick={handleResetNotifications}>
                      Reset
                    </button>
                  </div>
                  <div className="toggle-setting">
                    <span>Learning reminders</span>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={settings.notificationsEnabled}
                        onChange={(e) => handleSettingChange("notificationsEnabled", e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-card">
                  <div className="settings-header">
                    <h4>Theme</h4>
                    <button className="clear-button" onClick={handleResetTheme}>
                      Reset
                    </button>
                  </div>
                  <div className="theme-options">
                    <button className={`theme-button ${settings.theme === "light" ? "active" : ""}`} onClick={() => handleSettingChange("theme", "light")}>
                      Light
                    </button>
                    <button className={`theme-button ${settings.theme === "dark" ? "active" : ""}`} onClick={() => handleSettingChange("theme", "dark")}>
                      Dark
                    </button>
                    <button className={`theme-button ${settings.theme === "system" ? "active" : ""}`} onClick={() => handleSettingChange("theme", "system")}>
                      System
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }

        .profile-section,
        .stats-section,
        .settings-section {
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          padding: 24px;
        }

        h2 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #eaedf3;
        }

        .profile-card {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .avatar-container {
          position: relative;
        }

        .avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background-color: #1a56db;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          font-weight: 500;
          background-size: cover;
          background-position: center;
        }

        .edit-avatar {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .avatar-upload-btn {
          font-size: 0.875rem;
          color: #1a56db;
          cursor: pointer;
          background: none;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .avatar-upload-btn:hover {
          background-color: rgba(59, 130, 246, 0.05);
        }

        .profile-info {
          flex: 1;
        }

        .profile-info h3 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 4px;
          color: #111827;
        }

        .email {
          color: #4b5563;
          margin-bottom: 8px;
        }

        .join-date {
          color: #6b7280;
          font-size: 0.875rem;
          margin-bottom: 16px;
        }

        .edit-button {
          padding: 8px 16px;
          background-color: #f3f4f6;
          color: #1f2937;
          border: none;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .edit-button:hover {
          background-color: #e5e7eb;
        }

        .edit-form {
          width: 100%;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 6px;
        }

        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
          outline: none;
        }

        .button-group {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }

        .primary-button,
        .secondary-button {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .primary-button {
          background-color: #1a56db;
          color: white;
          border: none;
        }

        .primary-button:hover {
          background-color: #1e429f;
        }

        .secondary-button {
          background-color: #f3f4f6;
          color: #1f2937;
          border: 1px solid #e5e7eb;
        }

        .secondary-button:hover {
          background-color: #e5e7eb;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 600;
          color: #1a56db;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .subject-stats-card {
          grid-column: span 3;
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 16px;
        }

        .subject-stats-card h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .subject-bars {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .subject-stat {
          width: 100%;
        }

        .subject-label {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          margin-bottom: 6px;
          color: #4b5563;
        }

        .subject-progress-bg {
          width: 100%;
          height: 8px;
          background-color: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }

        .subject-progress-bar {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease-in-out;
        }

        .settings-cards {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .settings-card {
          background-color: #f9fafb;
          border-radius: 8px;
          padding: 20px;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .settings-header h4 {
          margin-bottom: 0;
        }

        .clear-button {
          font-size: 0.75rem;
          color: #6b7280;
          background: none;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-button:hover {
          color: #dc2626;
          background-color: rgba(220, 38, 38, 0.05);
        }

        .settings-card h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1f2937;
        }

        .settings-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 16px;
        }

        .subject-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .subject-chip {
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 0.875rem;
          background-color: #e5e7eb;
          color: #4b5563;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .subject-chip.active {
          background-color: #1a56db;
          color: white;
        }

        .toggle-setting {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .toggle {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }

        .toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #e5e7eb;
          transition: 0.4s;
          border-radius: 34px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: 0.4s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background-color: #1a56db;
        }

        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }

        .theme-options {
          display: flex;
          gap: 8px;
        }

        .theme-button {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          background-color: #e5e7eb;
          color: #4b5563;
          border: none;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .theme-button.active {
          background-color: #1a56db;
          color: white;
        }

        @media (min-width: 768px) {
          .content-grid {
            grid-template-columns: 1fr 1fr;
          }

          .profile-section {
            grid-column: span 2;
          }
        }

        @media (min-width: 1024px) {
          .content-grid {
            grid-template-columns: 1fr 1fr;
            gap: 24px;
          }

          .profile-section {
            grid-column: span 2;
          }
        }

        @media (max-width: 640px) {
          .profile-card {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 16px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .subject-stats-card {
            grid-column: span 1;
          }

          .theme-options {
            flex-direction: column;
          }

          .button-group {
            flex-direction: column-reverse;
          }
        }
      `}</style>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
          color: #333;
          background-color: #f5f7fa;
          line-height: 1.6;
        }

        .container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #eaedf3;
        }

        header h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #1a56db;
          margin: 0;
        }

        header nav {
          display: flex;
          gap: 16px;
        }

        header nav a {
          color: #4b5563;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
          padding: 6px 10px;
          border-radius: 6px;
        }

        header nav a:hover {
          color: #1a56db;
          background-color: rgba(26, 86, 219, 0.05);
        }

        .notification {
          background-color: #eef6ff;
          color: #1e40af;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          font-weight: 500;
          animation: fadeIn 0.3s ease-in-out;
          border-left: 4px solid #3b82f6;
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          gap: 16px;
          color: #6b7280;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 16px;
          }

          header {
            margin-bottom: 16px;
          }

          header h1 {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          header nav {
            width: 100%;
            justify-content: flex-start;
          }

          .empty-stats {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 0;
            background-color: #f9fafb;
            border-radius: 8px;
            text-align: center;
          }

          .start-learning-btn {
            display: inline-block;
            margin-top: 16px;
            padding: 8px 16px;
            background-color: #1a56db;
            color: white;
            border-radius: 6px;
            text-decoration: none;
            font-size: 0.875rem;
            font-weight: 500;
            transition: background-color 0.2s;
          }

          .start-learning-btn:hover {
            background-color: #1e429f;
          }
        }
      `}</style>
    </>
  );
}
