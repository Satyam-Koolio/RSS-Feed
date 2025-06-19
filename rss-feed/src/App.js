import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [episodes, setEpisodes] = useState([]);

  const BASE_URL = process.env.REACT_APP_BASE_URL;

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("audio", file);
    formData.append("title", title);
    formData.append("description", description);

    const res = await axios.post(`${BASE_URL}/upload`, formData);
    if (res.data.success) {
      setEpisodes([...episodes, { title, description }]);
      setFile(null);
      setTitle("");
      setDescription("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Podcast Episode Uploader</h1>
      <input
        type='file'
        accept='audio/*'
        onChange={(e) => setFile(e.target.files[0])}
      />
      <input
        placeholder='Title'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        placeholder='Description'
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button onClick={handleUpload}>Upload Episode</button>

      <h2>Episodes</h2>
      <ul>
        {episodes.map((ep, idx) => (
          <li key={idx}>{ep.title}</li>
        ))}
      </ul>

      <a href={`${BASE_URL}/rss.xml`} target='_blank' rel='noreferrer'>
        View RSS Feed
      </a>
    </div>
  );
}

export default App;
