import React, { useState, useEffect } from 'react';
import ThemeToggle from './components/ThemeToggle';
import VideoPlayer from './components/VideoPlayer';
import SearchForm from './components/SearchForm';
import FrameForm from './components/FrameForm';
import GifForm from './components/GifForm';
import DisplayArea from './components/DisplayArea';
import './styles/index.css';

const App = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [videoUrl, setVideoUrl] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [frameImage, setFrameImage] = useState(null);
  const [generatedGif, setGeneratedGif] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const handleVideoPreview = (videoName, episode) => {
    if (videoName && episode) {
      const videoUrl = `${API_URL}/video/${videoName}/${episode}`;
      setVideoUrl(videoUrl);
    } else {
      setVideoUrl('');
    }
  };

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  const handleFrameImage = (image) => {
    setFrameImage(image);
  };

  const handleGeneratedGif = (gif) => {
    setGeneratedGif(gif);
  };

  return (
    <div className="app">
      <ThemeToggle theme={theme} onToggle={handleThemeToggle} />
      <VideoPlayer videoUrl={videoUrl} />
      <SearchForm onSearchResults={handleSearchResults} />
      <FrameForm onFrameImage={handleFrameImage} />
      <GifForm onGeneratedGif={handleGeneratedGif} />
      <DisplayArea
        searchResults={searchResults}
        frameImage={frameImage}
        generatedGif={generatedGif}
      />
    </div>
  );
};

export default App;
