import { useState } from 'react';
import { api } from '../api/client';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const upload = async () => {
    if (!file) return;
    setError('');
    setResult(null);

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await api.post('/excel/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    }
  };

  return (
    <div>
      <h2>Excel Upload Page</h2>
      <div className="card">
        <p>Upload Excel inventory/production files (`.xlsm`, `.xlsx`, `.xls`).</p>
        <input type="file" accept=".xlsm,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0])} />
        <button onClick={upload}>Import Workbook</button>
        {error && <div className="alert error">{error}</div>}
        {result && (
          <pre className="json-block">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}
