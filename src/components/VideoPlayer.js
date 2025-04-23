import React, { useRef } from 'react';

const VideoPlayer = ({ videoUrl }) => {
  const videoRef = useRef(null);

  const handlePlayPause = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const handleProgress = () => {
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    document.getElementById('video-progress').value = progress;
  };

  const handleSeek = (event) => {
    const time = (event.target.value / 100) * videoRef.current.duration;
    videoRef.current.currentTime = time;
  };

  return (
    <div className="video-player">
      <video ref={videoRef} src={videoUrl} onTimeUpdate={handleProgress} controls />
      <div className="controls">
        <button onClick={handlePlayPause}>Play/Pause</button>
        <input type="range" id="video-progress" onChange={handleSeek} />
      </div>
    </div>
  );
};

export default VideoPlayer;
