import React from 'react';
import { useLocation } from 'react-router-dom'; // Assuming you use React Router

const ResultsComponent = () => {
  const location = useLocation();
  const results = location.state.results || [];

  return (
    <div>
      <h1>Search Results</h1>
      {results.length > 0 ? (
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
      ) : (
        <p>No results found.</p>
      )}
    </div>
  );
};

export default ResultsComponent;
