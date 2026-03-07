import React, { useState, useEffect } from 'react';
import logo from './logo.svg';
import './App.css';

function App() {
  const [backendMessage, setBackendMessage] = useState("Loading...");

  useEffect(() => {
    // Calling the route we created in index.js
    fetch('/api/message')
      .then(res => res.json())
      .then(data => setBackendMessage(data.text))
      .catch(err => setBackendMessage("Could not connect to backend"));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>Flexroom Project</h1>
        <p>
          {backendMessage}
        </p>
      </header>
    </div>
  );
}

export default App;