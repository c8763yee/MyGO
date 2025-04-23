import React, { useState } from 'react';

const FrameForm = ({ onFrameImage }) => {
  const [episode, setEpisode] = useState('');
  const [frame, setFrame] = useState('');
  const [videoName, setVideoName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!episode || !frame || !videoName) {
      alert('請填寫所有欄位');
      return;
    }

    const response = await fetch(`${API_URL}/frame`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ episode, frame, video_name: videoName }),
    });

    if (!response.ok) {
      alert('網路錯誤');
      return;
    }

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    onFrameImage(imageUrl);
  };

  return (
    <form id="frame-form" onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="frame-episode" className="form-label">集數</label>
        <input
          type="text"
          className="form-control"
          id="frame-episode"
          value={episode}
          onChange={(e) => setEpisode(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="frame-number" className="form-label">幀數</label>
        <input
          type="number"
          className="form-control"
          id="frame-number"
          value={frame}
          onChange={(e) => setFrame(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="frame-video_name" className="form-label">影片名稱</label>
        <input
          type="text"
          className="form-control"
          id="frame-video_name"
          value={videoName}
          onChange={(e) => setVideoName(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">生成畫面</button>
    </form>
  );
};

export default FrameForm;
