import { useState, type KeyboardEvent } from 'react';

export default function RetrievePaste() {
  const [adjective, setAdjective] = useState('');
  const [noun, setNoun] = useState('');
  const [number, setNumber] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!adjective || !noun || !number) {
      setError('Please fill in all three fields');
      return;
    }
    setError('');
    const paddedNumber = number.padStart(3, '0');
    window.location.href = `/${adjective}-${noun}-${paddedNumber}`;
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }

  return (
    <div className="page page-retrieve">
      <div className="retrieve-panel">
        <div className="retrieve-inputs">
          <input
            type="text"
            className="retrieve-input"
            placeholder="adjective"
            maxLength={30}
            value={adjective}
            onChange={(e) => setAdjective(e.target.value.replace(/[^a-z]/g, ''))}
            onKeyDown={handleKeyDown}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            autoFocus
          />
          <span className="retrieve-sep">—</span>
          <input
            type="text"
            className="retrieve-input"
            placeholder="noun"
            maxLength={30}
            value={noun}
            onChange={(e) => setNoun(e.target.value.replace(/[^a-z]/g, ''))}
            onKeyDown={handleKeyDown}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
          />
          <span className="retrieve-sep">—</span>
          <input
            type="text"
            className="retrieve-input retrieve-input-number"
            placeholder="000"
            maxLength={3}
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button type="button" className="btn btn-accent retrieve-submit" onClick={handleSubmit}>
          Get Paste
        </button>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
