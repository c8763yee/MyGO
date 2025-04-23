import React, { useState } from 'react';

const SearchForm = ({ onSearchResults }) => {
  const [query, setQuery] = useState('');
  const [episode, setEpisode] = useState('');
  const [videoName, setVideoName] = useState('');
  const [pagedBy, setPagedBy] = useState(20);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query) {
      alert('請輸入關鍵字');
      return;
    }

    const response = await fetch(`${API_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, episode, video_name: videoName, paged_by: pagedBy, nth_page: 1 }),
    });

    if (!response.ok) {
      alert('網路錯誤');
      return;
    }

    const data = await response.json();
    onSearchResults(data.results);
  };

  return (
    <form id="search-form" onSubmit={handleSubmit}>
      <div className="mb-3">
        <label htmlFor="search-query" className="form-label">關鍵字</label>
        <input
          type="text"
          className="form-control"
          id="search-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="search-episode" className="form-label">集數</label>
        <input
          type="text"
          className="form-control"
          id="search-episode"
          value={episode}
          onChange={(e) => setEpisode(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="search-video_name" className="form-label">影片名稱</label>
        <input
          type="text"
          className="form-control"
          id="search-video_name"
          value={videoName}
          onChange={(e) => setVideoName(e.target.value)}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="search-paged_by" className="form-label">每頁顯示數量</label>
        <input
          type="number"
          className="form-control"
          id="search-paged_by"
          value={pagedBy}
          onChange={(e) => setPagedBy(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">搜尋</button>
    </form>
  );
};

export default SearchForm;
