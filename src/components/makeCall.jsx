import React, { useState } from 'react';

const MakeCallForm = () => {
    const [toNumber, setToNumber] = useState('');
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');


    const makeCall = async (toNumber, messageText) => {
        try {
            setLoading(true);
            setStatus('');
    
            const response = await fetch('/api/makeCall', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ toNumber, messageText }),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                setStatus(`Call initiated successfully! Call SID: ${data.callSid}`);
            } else {
                setStatus(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Error making call:', error);
            setStatus(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!toNumber || !messageText) {
            setStatus('Please provide both the phone number and the message.');
            return;
        }
        makeCall(toNumber, messageText);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
            <h2>Make a Call</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>
                        <strong>To Number:</strong>
                    </label>
                    <input
                        type="text"
                        value={toNumber}
                        onChange={(e) => setToNumber(e.target.value)}
                        placeholder="Enter phone number"
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>
                        <strong>Message Text:</strong>
                    </label>
                    <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Enter message text"
                        rows="4"
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>
                <button
                    type="submit"
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                    }}
                    disabled={loading}
                >
                    {loading ? 'Making Call...' : 'Make Call'}
                </button>
            </form>
            {status && (
                <div style={{ marginTop: '20px', color: loading ? 'blue' : 'red' }}>
                    {status}
                </div>
            )}
        </div>
    );
};

export default MakeCallForm;
