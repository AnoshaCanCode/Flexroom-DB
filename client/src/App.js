import React, { useEffect, useState } from 'react';

function App() {
  const [data, setData] = useState("");

  useEffect(() => {
    fetch('/api/test')
      .then(res => res.json())
      .then(json => setData(json.message));
  }, []);

  return (
    <div className="App">
      <h1>Flexroom Frontend</h1>
      <p>Server says: {data ? data : "Loading..."}</p>
    </div>
  );
}

export default App;