import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const BulkForms = () => {
  const [templates, setTemplates] = useState([]);
  const [outputFiles, setOutputFiles] = useState([]);
  const [templateFile, setTemplateFile] = useState(null);
  const [patientFile, setPatientFile] = useState(null);
  const [patientFilePreview, setPatientFilePreview] = useState(null);
  const [selectedPatientFile, setSelectedPatientFile] = useState('');
  const [loading, setLoading] = useState(false);  // Fixed: was 'setTimeout'
  const [message, setMessage] = useState({ text: '', type: '' });  // Added missing message state
  
  
    // Fetch templates on load
    useEffect(() => {
    }, []);
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);  // Fixed: timeout position
    };

  const fetchTemplates = async () => {
      try {
      const response = await fetch(`${API_BASE_URL}/templates`);
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
        console.error('Error fetching templates:', error);
        showMessage('Error fetching templates', 'error');
    }
  };
  
  const fetchOutputFiles = async () => {
      try {
      const response = await fetch(`${API_BASE_URL}/output-files`);
      const data = await response.json();
      setOutputFiles(data.files || []);
    } catch (error) {
        console.error('Error fetching output files:', error);
    }
  };

  const uploadTemplate = async () => {
    if (!templateFile) {
      showMessage('Please select a template file', 'error');
      return;
    }
    fetchTemplates();
    fetchOutputFiles();

    const formData = new FormData();
    formData.append('file', templateFile);

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/upload-template`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        showMessage(`Template "${data.filename}" uploaded successfully`);
        fetchTemplates();
        setTemplateFile(null);
        // Clear file input
        const fileInput = document.getElementById('template-input');
        if (fileInput) fileInput.value = '';
      } else {
        showMessage(data.detail || 'Upload failed', 'error');
      }
    } catch (error) {
      showMessage('Error uploading template', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadPatientFile = async () => {
    if (!patientFile) {
      showMessage('Please select a patient file', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', patientFile);

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/upload-patient-file`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        showMessage(`File "${data.filename}" uploaded successfully`);
        setPatientFilePreview(data.preview);
        setSelectedPatientFile(data.filename);
        setPatientFile(null);
        // Clear file input
        const fileInput = document.getElementById('patient-input');
        if (fileInput) fileInput.value = '';
      } else {
        showMessage(data.detail || 'Upload failed', 'error');
      }
    } catch (error) {
      showMessage('Error uploading patient file', error);
    } finally {
      setLoading(false);
    }
  };

  const generateForms = async () => {
    if (!selectedPatientFile) {
      showMessage('Please upload a patient file first', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename: selectedPatientFile }),
      });
      const data = await response.json();
      if (response.ok) {
        showMessage(`Generated ${data.files?.length || 0} forms successfully`);
        fetchOutputFiles();
      } else {
        showMessage(data.detail || 'Generation failed', 'error');
      }
    } catch (error) {
      showMessage('Error generating forms', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (filename) => {
    window.open(`${API_BASE_URL}/download/${filename}`, '_blank');
  };

  const downloadAllZip = () => {
    window.open(`${API_BASE_URL}/download-all-zip`, '_blank');
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Bulk Forms Generator</h1>

      {/* Message Display */}
      {message.text && (
        <div style={{ ...styles.message, ...(message.type === 'error' ? styles.error : styles.success) }}>
          {message.text}
        </div>
      )}

      {/* Upload Template Section */}
      <div style={styles.card}>
        <h2>1. Upload Template (DOCX)</h2>
        <input
          id="template-input"
          type="file"
          accept=".docx"
          onChange={(e) => setTemplateFile(e.target.files[0])}
          style={styles.input}
        />
        <button onClick={uploadTemplate} disabled={loading} style={styles.button}>
          {loading ? 'Uploading...' : 'Upload Template'}
        </button>
        
        {templates.length > 0 && (
          <div style={styles.fileList}>
            <strong>Available Templates:</strong>
            <ul>
              {templates.map((template, idx) => (
                <li key={idx}>{template}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Upload Patient Data Section */}
      <div style={styles.card}>
        <h2>2. Upload Patient Data (Excel/CSV)</h2>
        <input
          id="patient-input"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setPatientFile(e.target.files[0])}
          style={styles.input}
        />
        <button onClick={uploadPatientFile} disabled={loading} style={styles.button}>
          {loading ? 'Uploading...' : 'Upload Patient File'}
        </button>

        {/* Preview Data */}
        {patientFilePreview && (
          <div style={styles.preview}>
            <strong>Data Preview:</strong>
            <pre style={styles.pre}>{JSON.stringify(patientFilePreview, null, 2)}</pre>
          </div>
        )}

        {selectedPatientFile && (
          <div style={styles.info}>
            ✅ Active file: <strong>{selectedPatientFile}</strong>
          </div>
        )}
      </div>

      {/* Generate Forms Section */}
      <div style={styles.card}>
        <h2>3. Generate Forms</h2>
        <button 
          onClick={generateForms} 
          disabled={loading || !selectedPatientFile} 
          style={{ ...styles.button, ...styles.generateButton }}
        >
          {loading ? 'Generating...' : 'Generate Forms'}
        </button>
      </div>

      {/* Output Files Section */}
      <div style={styles.card}>
        <h2>4. Download Generated Forms</h2>
        {outputFiles.length > 0 ? (
          <>
            <button onClick={downloadAllZip} style={{ ...styles.button, ...styles.zipButton }}>
              📦 Download All as ZIP
            </button>
            
            <div style={styles.fileList}>
              <strong>Generated Files:</strong>
              <ul>
                {outputFiles.map((file, idx) => (
                  <li key={idx} style={styles.fileItem}>
                    <span>{file}</span>
                    <button 
                      onClick={() => downloadFile(file)} 
                      style={styles.downloadButton}
                    >
                      Download
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : (
          <p style={styles.noFiles}>No generated files yet. Upload data and generate forms.</p>
        )}
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
  },
  card: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
  },
  input: {
    display: 'block',
    margin: '10px 0',
    padding: '8px',
    width: '100%',
    maxWidth: '300px',
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px',
  },
  generateButton: {
    backgroundColor: '#28a745',
    fontSize: '16px',
    padding: '12px 24px',
  },
  zipButton: {
    backgroundColor: '#ffc107',
    color: '#333',
    marginBottom: '15px',
  },
  downloadButton: {
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '3px',
    cursor: 'pointer',
    marginLeft: '10px',
    fontSize: '12px',
  },
  message: {
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb',
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb',
  },
  preview: {
    marginTop: '15px',
    padding: '10px',
    backgroundColor: '#fff',
    border: '1px solid #ddd',
    borderRadius: '5px',
  },
  pre: {
    overflowX: 'auto',
    fontSize: '12px',
    margin: '10px 0',
  },
  fileList: {
    marginTop: '15px',
  },
  fileItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    borderBottom: '1px solid #eee',
  },
  info: {
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#d4edda',
    borderRadius: '5px',
    fontSize: '14px',
  },
  noFiles: {
    color: '#666',
    fontStyle: 'italic',
  },
};

export default BulkForms;