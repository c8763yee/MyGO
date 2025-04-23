import React from 'react';

const DisplayArea = ({ searchResults, frameImage, generatedGif }) => {
  return (
    <div className="display-area">
      {searchResults.length > 0 && (
        <div className="search-results">
          <h2>Search Results</h2>
          <ul>
            {searchResults.map((result, index) => (
              <li key={index}>{result.text}</li>
            ))}
          </ul>
        </div>
      )}
      {frameImage && (
        <div className="frame-image">
          <h2>Frame Image</h2>
          <img src={frameImage} alt="Frame" />
        </div>
      )}
      {generatedGif && (
        <div className="generated-gif">
          <h2>Generated GIF</h2>
          <img src={generatedGif} alt="GIF" />
        </div>
      )}
    </div>
  );
};

export default DisplayArea;
