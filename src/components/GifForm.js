import React, { useState } from 'react';

const GifForm = ({ onGeneratedGif }) => {
  const [videoName, setVideoName] = useState('');
  const [episode, setEpisode] = useState('');
  const [startFrame, setStartFrame] = useState('');
  const [endFrame, setEndFrame] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoName || !episode || !startFrame || !endFrame) {
      alert('請填寫所有欄位');
      return;
    }

    const response = await fetch(`${API_URL}/gif`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ video_name: videoName, episode, start_frame: startFrame, end_frame: endFrame }),
    });

    if (!response.ok) {
      alert('網路錯誤');
      return;
    }

    const blob = await response.blob();
    const gifUrl = URL.createObjectURL(blob);
    onGeneratedGif(gifUrl);
  };

  return (
    <form id="gif-form" onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="gif-video_name" className="form-label">影片名稱</label>
        <input
          type="text"
          className="form-control"
          id="gif-video_name"
          value={videoName}
          onChange={(e) => setVideoName(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="gif-episode" className="form-label">集數</label>
        <input
          type="text"
          className="form-control"
          id="gif-episode"
          value={episode}
          onChange={(e) => setEpisode(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="gif-start_frame" className="form-label">開始幀數</label>
        <input
          type="number"
          className="form-control"
          id="gif-start_frame"
          value={startFrame}
          onChange={(e) => setStartFrame(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="gif-end_frame" className="form-label">結束幀數</label>
        <input
          type="number"
          className="form-control"
          id="gif-end_frame"
          value={endFrame}
          onChange={(e) => setEndFrame(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">生成GIF</button>
    </form>
  );
};

export default GifForm;
