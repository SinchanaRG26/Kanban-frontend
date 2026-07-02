import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://kanban-backend-1-r1rt.onrender.com/api';
const COLUMNS = ['todo', 'in-progress', 'done'];

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  // Configure Axios global authentication headers
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchTasks();
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error("Error fetching tasks", err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'register') {
        await axios.post(`${API_URL}/auth/register`, { username: authUsername, password: authPassword });
        alert('Registration successful! Please login.');
        setAuthMode('login');
      } else {
        const res = await axios.post(`${API_URL}/auth/login`, { username: authUsername, password: authPassword });
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('username', res.data.username);
        setToken(res.data.token);
        setUsername(res.data.username);
      }
      setAuthUsername('');
      setAuthPassword('');
    } catch (err) {
      alert(err.response?.data?.error || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setUsername('');
    setTasks([]);
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await axios.post(`${API_URL}/tasks`, { title, description, status: 'todo' });
      setTasks([...tasks, res.data]);
      setTitle('');
      setDescription('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (taskId) => {
    const text = commentInputs[taskId];
    if (!text || !text.trim()) return;

    try {
      const res = await axios.post(`${API_URL}/tasks/${taskId}/comments`, { text });
      setTasks(tasks.map(t => t._id === taskId ? res.data : t));
      setCommentInputs({ ...commentInputs, [taskId]: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const onDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const onDragOver = (e) => e.preventDefault();

  const onDrop = async (e, targetStatus) => {
    const taskId = e.dataTransfer.getData("taskId");
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t._id === taskId ? { ...t, status: targetStatus } : t));

    try {
      await axios.put(`${API_URL}/tasks/${taskId}`, { status: targetStatus });
    } catch (err) {
      setTasks(previousTasks);
    }
  };

  // Auth Gate Interface
  if (!token) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f5f9', fontFamily: 'Arial' }}>
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '350px' }}>
          <h2 style={{ textTransform: 'capitalize', marginBottom: '20px' }}>{authMode} to Workspace</h2>
          <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input 
              type="text" placeholder="Username" required value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <input 
              type="password" placeholder="Password" required value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
            <button type="submit" style={{ padding: '12px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
              {authMode === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
          <p onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} style={{ marginTop: '15px', color: '#2563eb', cursor: 'pointer', fontSize: '14px', textAlign: 'center' }}>
            {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
          </p>
        </div>
      </div>
    );
  }

  // Kanban Dashboard Interface
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '30px', backgroundColor: '#f9f9fb', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h1 style={{ color: '#1e293b', margin: 0 }}>Project Management Board</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontWeight: 'bold', color: '#475569' }}>Welcome, {username}!</span>
          <button onClick={handleLogout} style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>
      
      <form onSubmit={handleCreateTask} style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" placeholder="Task Title" value={title} onChange={(e) => setTitle(e.target.value)}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '250px' }}
        />
        <input 
          type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '350px' }}
        />
        <button type="submit" style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
          Add Task
        </button>
      </form>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {COLUMNS.map(col => (
          <div key={col} onDragOver={onDragOver} onDrop={(e) => onDrop(e, col)} style={{ backgroundColor: '#f1f5f9', width: '330px', minHeight: '550px', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ textTransform: 'uppercase', fontSize: '13px', color: '#64748b', marginBottom: '15px' }}>
              {col.replace('-', ' ')} ({tasks.filter(t => t.status === col).length})
            </h3>
            
            {tasks.filter(t => t.status === col).map(task => (
              <div key={task._id} draggable onDragStart={(e) => onDragStart(e, task._id)} style={{ backgroundColor: '#fff', padding: '16px', marginBottom: '12px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'grab' }}>
                <h4 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>{task.title}</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#64748b' }}>{task.description}</p>
                
                {/* Comments Section */}
                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>COMMENTS ({task.comments?.length || 0})</span>
                  <div style={{ maxHeight: '80px', overflowY: 'auto', margin: '5px 0' }}>
                    {task.comments?.map((c, i) => (
                      <p key={i} style={{ margin: '3px 0', fontSize: '12px', color: '#334155' }}>
                        <strong style={{ color: '#2563eb' }}>{c.username}:</strong> {c.text}
                      </p>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                    <input 
                      type="text" placeholder="Add a reply..." value={commentInputs[task._id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [task._id]: e.target.value })}
                      style={{ flex: 1, padding: '5px', fontSize: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                    />
                    <button onClick={() => handleAddComment(task._id)} style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#475569', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Send</button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}