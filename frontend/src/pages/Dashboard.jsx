import axios from "axios";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);

  const USER_ID = "PASTE_USER_ID_HERE"; // temporary

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const res = await axios.get(
      `http://localhost:5000/project/${USER_ID}`
    );
    setProjects(res.data);
  };

  const runTracker = async (projectId) => {
    const res = await axios.post(
      `http://localhost:5000/tracker/run/${projectId}`
    );

    console.log(res.data);
    alert("Tracking done!");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Dashboard</h2>

      {projects.map((p) => (
        <div key={p._id} style={{ marginBottom: 20 }}>
          <h3>{p.domain}</h3>

          <button onClick={() => runTracker(p._id)}>
            Run Tracker
          </button>
        </div>
      ))}
    </div>
  );
}