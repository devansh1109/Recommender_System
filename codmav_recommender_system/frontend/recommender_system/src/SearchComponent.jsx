import React, { useState } from 'react';
import axios from 'axios';

const SearchComponent = () => {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);

  const handleKeywordChange = (event) => {
    setKeyword(event.target.value);
  };

  const handleSearch = () => {
    axios.post('/api/keyword-search', { keyword })
      .then(response => {
        setResults(response.data.articles);
      })
      .catch(error => {
        console.error('Error fetching articles:', error);
      });
  };

  return (
    <div>
      <input type="text" value={keyword} onChange={handleKeywordChange} placeholder="Enter Keyword" />
      <button onClick={handleSearch}>Search</button>
      
      {results.length > 0 && (
        <div>
          <h2>Search Results:</h2>
          <ul>
            {results.map((article, index) => (
              <li key={index}>
                <h3>{article.Title_y}</h3>
                <p>Authors: {article.First_Name} {article.Last_Name}</p>
                <p>Abstract: {article.abstract}</p>
                <p>Keywords: {article.keywords}</p>
                <p>Year: {article.year}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
