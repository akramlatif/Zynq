'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

type MicState = 'idle' | 'recording' | 'processing' | 'done';

interface VoiceMicButtonProps {
  onSuccess: (transcription: string, agentMessage: any) => void;
  disabled?: boolean;
}

export default function VoiceMicButton({ onSuccess, disabled }: VoiceMicButtonProps) {
  const [micState, setMicState] = useState<MicState>('idle');
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const streamRef = useRef<MediaStream | null>(null);

  // Stop recording and cleanup streams safely
  const cleanupRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  useEffect(() => {
    return () => cleanupRecording();
  }, [cleanupRecording]);

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyserRef.current!.getByteFrequencyData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        canvasCtx.fillStyle = `rgb(239, 68, 68)`; // Tailwind red-500
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    draw();
  };

  const startRecording = async (e: React.TouchEvent | React.MouseEvent) => {
    if (disabled || micState !== 'idle') return;
    // Prevent default to stop scrolling/click weirdness on mobile during hold
    if (e.cancelable) e.preventDefault();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup Web Audio API for visualizer
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 64;
      
      drawVisualizer();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setMicState('processing');
        setTranscriptionStatus('Transcribing...');
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        // Fallback to mp4 extension for iOS compatibility sometimes needed
        formData.append('audio', audioBlob, 'recording.webm'); 

        try {
          const response = await fetch('/api/agent/voice', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) throw new Error('Voice API failed');

          const data = await response.json();
          
          if (data.transcription) {
            setTranscriptionStatus('Done!');
            setMicState('done');
            setTimeout(() => {
              onSuccess(data.transcription, data.message);
              setMicState('idle');
              setTranscriptionStatus('');
            }, 1000);
          } else {
            throw new Error('Could not transcribe');
          }
        } catch (error) {
          console.error('Transcription error:', error);
          toast.error('Failed to process voice message.');
          setMicState('idle');
          setTranscriptionStatus('');
        }
      };

      mediaRecorder.start();
      setMicState('recording');
      
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast.error('Microphone access denied. Please check permissions.');
    }
  };

  const stopRecording = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e?.cancelable) e.preventDefault();
    if (micState === 'recording') {
      cleanupRecording();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Status Bubble */}
      {micState !== 'idle' && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 flex items-center gap-2">
          {micState === 'recording' && (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Recording...
            </>
          )}
          {micState === 'processing' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              {transcriptionStatus}
            </>
          )}
          {micState === 'done' && (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              {transcriptionStatus}
            </>
          )}
        </div>
      )}

      {/* Mic Button */}
      <div className="relative">
        {/* Pulsing rings when recording */}
        {micState === 'recording' && (
          <>
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25 scale-150 pointer-events-none" />
            <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse opacity-50 scale-125 pointer-events-none" />
          </>
        )}
        
        {/* Visualizer Canvas overlaying button when recording */}
        {micState === 'recording' && (
          <canvas 
            ref={canvasRef} 
            className="absolute -top-16 left-1/2 -translate-x-1/2 w-24 h-12 pointer-events-none" 
            width={96} 
            height={48} 
          />
        )}

        <button
          type="button"
          disabled={disabled || micState === 'processing'}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
          className={`p-3 rounded-full transition-all duration-200 select-none ${
            micState === 'recording'
              ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/40'
              : micState === 'processing' || micState === 'done'
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'text-slate-500 hover:text-primary hover:bg-primary/5'
          }`}
          title="Hold to record"
        >
          {micState === 'processing' ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : micState === 'done' ? (
            <Check className="w-6 h-6 text-emerald-500" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
}
