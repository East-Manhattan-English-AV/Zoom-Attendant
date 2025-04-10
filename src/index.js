import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

try {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('Zoom Attendant app started');
} catch (error) {
  console.error('Zoom Attendant failed to start:', error);

  // Show error visibly on page
  try {
    const errorElement = document.createElement('div');
    errorElement.style.padding = '20px';
    errorElement.style.background = '#ffcdd2';
    errorElement.style.color = '#b71c1c';
    errorElement.style.margin = '20px';
    errorElement.style.borderRadius = '4px';
    errorElement.innerHTML = `<h2>Error loading app</h2><pre>${error.message}\n\n${error.stack}</pre>`;
    document.body.appendChild(errorElement);
  } catch (e) {
    // Last resort
    console.error('Could not display error on page:', e);
  }
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
