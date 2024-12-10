import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import useIphoneDetect from '@/hooks/useIphoneDetect';


export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [startTime, setStartTime] = useState(null); // Track the start time of the recording
  let st = null;

  const isIphone = useIphoneDetect(); // Detect if it's an iPhone

  // Call the function to check and log supported mime types

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
      audioChunksRef.current = [];
      setStartTime(Date.now()); // Set start time when recording starts
      st = Date.now();

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const duration = (Date.now() - st) / 1000; // Calculate the duration in seconds

        if (duration < 1) {
          console.log("Recording is too short, not sending to API.");
          return; // Skip the API call if the recording is shorter than 1 second
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp4' }); // Use 'audio/mp4' type
        const audioFile = new File([audioBlob], 'recording.mp4', { type: 'audio/mp4' }); // File extension adjusted to '.ogg'


        // Convert .webm to .wav
        const wavFile = await convertWebMToWAV(audioFile);
        await sendAudioToAPI(wavFile);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true); // Update state when recording starts
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop(); // Stop the recording
      setIsRecording(false); // Ensure state is updated after stopping the recording
    }
  };

  const convertWebMToWAV = async (webmFile) => {
    const arrayBuffer = await webmFile.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const decodedAudioData = await audioContext.decodeAudioData(arrayBuffer);

    // Convert to Mono (if stereo)
    const monoAudioBuffer = audioContext.createBuffer(1, decodedAudioData.length, decodedAudioData.sampleRate);
    monoAudioBuffer.getChannelData(0).set(decodedAudioData.getChannelData(0));

    // Encode to WAV format
    const wavData = encodeWAV(monoAudioBuffer);
    return new File([wavData], 'recording.wav', { type: 'audio/wav' });
  };

  const encodeWAV = (audioBuffer) => {
    const numOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length * numOfChannels * 2 + 44;

    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let offset = 0;

    // Write WAV Header
    writeString(view, offset, 'RIFF');
    offset += 4;
    view.setUint32(offset, length - 8, true);
    offset += 4;
    writeString(view, offset, 'WAVE');
    offset += 4;
    writeString(view, offset, 'fmt ');
    offset += 4;
    view.setUint32(offset, 16, true); // Subchunk size
    offset += 4;
    view.setUint16(offset, 1, true); // Audio format (1 = PCM)
    offset += 2;
    view.setUint16(offset, numOfChannels, true); // Number of channels
    offset += 2;
    view.setUint32(offset, sampleRate, true); // Sample rate
    offset += 4;
    view.setUint32(offset, sampleRate * numOfChannels * 2, true); // Byte rate
    offset += 4;
    view.setUint16(offset, numOfChannels * 2, true); // Block align
    offset += 2;
    view.setUint16(offset, 16, true); // Bits per sample
    offset += 2;

    // Data chunk
    writeString(view, offset, 'data');
    offset += 4;
    view.setUint32(offset, audioBuffer.length * numOfChannels * 2, true); // Data chunk size
    offset += 4;

    // Interleave the audio data for multiple channels
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        const sample = audioBuffer.getChannelData(channel)[i];
        view.setInt16(offset, sample * 0x7fff, true);
        offset += 2;
      }
    }

    return buffer;
  };

  const writeString = (view, offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  const sendAudioToAPI = async (audioFile) => {
    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);

      const response = await axios.post('https://voice-ai-521223808142.us-central1.run.app/v1/voice-assistant-without-speech', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setAssistantResponse(response.data.assistant_response);
    } catch (error) {
      console.error('API error:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: 'wheat' }}>
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '1.25rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' , color : 'black'}}>Amaan&rsquo;s AI Assistant</h1>

        <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={startRecording}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: '#fff',
              borderRadius: '9999px',
              transition: 'background-color 0.3s',
              marginBottom: '1.5rem',
              cursor: 'pointer',
              ...(isRecording && ({
                display : 'none'
              }))
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#2563eb')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#3b82f6')}
          >
            Start Recording
          </button>
          <button
            onClick={stopRecording}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#ef4444',
              color: '#fff',
              borderRadius: '9999px',
              transition: 'background-color 0.3s',
              cursor: 'pointer',
              ...(!isRecording && ({
                display : 'none'
              }))
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = '#dc2626')}
            onMouseLeave={(e) => (e.target.style.backgroundColor = '#ef4444')}
          >
            Stop Recording
          </button>
        </div>

        {assistantResponse && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem', maxWidth: '24rem', fontWeight: 'bold', color: 'black' }}>
            <p>{assistantResponse}</p>
          </div>
        )}
      </main>
    </div>
  );

}
