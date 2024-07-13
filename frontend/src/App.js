import React, { useEffect, useState } from 'react';
import owlbert from './images/owlbert.png';
import './App.css';
import axios from 'axios';
import { saveAs } from 'file-saver';

function App() {
  const [rollNumber, setRollNumber] = useState('');

  const handleInputChange = (e) => {
    setRollNumber(e.target.value);
  };

  useEffect(() => {
    getAdmitCard();
  })

  const getAdmitCard = async () => {
    try {
      const response = await axios.get('https://technothlon-admit-cards-api.vercel.app/api');
      console.log(response);
    } catch (err) {
      console.log(err);
    }
  }

  const local = false;
  const url = local ? 'http://localhost:3002' : 'https://technothlon-admit-cards-api.vercel.app';

  const createAndDownloadAdmitCard = async (rollNumber) => {
    try {
      await axios.post(`${url}/api/create-admit-card`, { rollNumber });
      const response = await axios.get(`${url}/api/get-admit-card`, { responseType: 'blob' });
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      saveAs(pdfBlob, `Technothlon_Admit_Card_${rollNumber}.pdf`);
    } catch (err) {
      window.alert('An error occurred while downloading the admit card');
      console.log(err);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    createAndDownloadAdmitCard(rollNumber);
  };

  return (
    <div className='App'>
      <div className='header'>
        <img src={owlbert} alt='Owlbert' />
        <h1>Technothlon 2024 Admit Cards</h1>
      </div>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="rollNumber">Roll Number</label>
          <input
            type="text"
            id="rollNumber"
            name="rollNumber"
            value={rollNumber}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit" className="download-btn">Download</button>
      </form>
    </div>
  );
}

export default App;
