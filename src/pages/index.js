import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import useIphoneDetect from '@/hooks/useIphoneDetect';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [assistantResponse, setAssistantResponse] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const ffmpegRef = useRef(null);
  const [startTime, setStartTime] = useState(null); // Track the start time of the recording
  let st = null;


  const isIphone = useIphoneDetect(); // Detect if it's an iPhone

  useEffect(() => {
    const initFFmpeg = async () => {
      const ffmpeg = new FFmpeg({ log: true });
      await ffmpeg.load();
      ffmpegRef.current = ffmpeg;
    };

    initFFmpeg();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      setStartTime(Date.now()); // Set start time when recording starts
      st = Date.now()


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

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });

        if (ffmpegRef.current) {
          try {
            const audioUrl = URL.createObjectURL(audioFile);
            const response = await fetch(audioUrl);
            const arrayBuffer = await response.arrayBuffer();

            ffmpegRef.current.writeFile('input.webm', new Uint8Array(arrayBuffer));

            await ffmpegRef.current.exec([
              '-i', 'input.webm',
              '-ac', '1',
              '-acodec', 'pcm_s16le',
              'output.wav'
            ]);

            const data = await ffmpegRef.current.readFile('output.wav');
            const outputBlob = new Blob([data.buffer], { type: 'audio/wav' });
            const outputFile = new File([outputBlob], 'mono_output.wav', { type: 'audio/wav' });

            await sendAudioToAPI(outputFile);
          } catch (error) {
            console.error('FFmpeg processing error:', error);
          }
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
      setStartTime(null)
      setAssistantResponse(response.data.assistant_response);
    } catch (error) {
      console.error('API error:', error);
    }
  };

  const handleClick = () => {
    if(!isIphone) return;
    if (isRecording) {
      stopRecording(); // If already recording, stop it
    } else {
      startRecording(); // Otherwise, start recording
    }
  };

  const handleMouseDown = () => {
    if (!isIphone && !isRecording) {
      startRecording(); // Only trigger on desktop if not recording
    }
  };

  const handleMouseUp = () => {
    if (!isIphone && isRecording) {
      stopRecording(); // Only stop recording on desktop when recording
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-2xl font-bold mb-6">Voice Recorder</h1>

        <div className="mb-6">
          <button
            onClick={isIphone ? handleClick: () => {}} // Handle click on mobile (iPhone or other)
            onMouseDown={handleMouseDown} // Handle mouse down on desktop
            onMouseUp={handleMouseUp} // Handle mouse up on desktop
            onMouseLeave={handleMouseUp} // Stop recording if mouse leaves
            className={`px-6 py-3 rounded-full transition-colors duration-300 ${
              isRecording
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isRecording ? 'Recording...' : 'Hold to Record'}
          </button>
        </div>

        {assistantResponse && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg max-w-md">
            <p>{assistantResponse}</p>
          </div>
        )}
      </main>
    </div>
  );
}
