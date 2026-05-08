import { useState, useRef, useCallback } from 'react';
import { Play, Square, Download, Video } from 'lucide-react';

interface VideoRecorderProps {
  targetElementId: string;
}

export function VideoRecorder({ targetElementId }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    const element = document.getElementById(targetElementId);
    if (!element) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = window.devicePixelRatio >= 2 ? 2 : 3;
      canvas.width = element.offsetWidth * scale;
      canvas.height = element.offsetHeight * scale;

      const stream = canvas.captureStream(30);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 8000000,
      });

      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordedUrl(null);

      const captureFrame = async () => {
        if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return;
        
        try {
          const { default: html2canvas } = await import('html2canvas');
          const capturedCanvas = await html2canvas(element, {
            backgroundColor: '#0b0e11',
            scale: 2,
            useCORS: true,
            logging: false,
          });
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(capturedCanvas, 0, 0, canvas.width, canvas.height);
        } catch {
          // Skip frame on error
        }
        
        if (mediaRecorderRef.current?.state === 'recording') {
          requestAnimationFrame(captureFrame);
        }
      };

      captureFrame();
    } catch (err) {
      console.error('Recording failed:', err);
    }
  }, [targetElementId]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const downloadRecording = useCallback(() => {
    if (recordedUrl) {
      const link = document.createElement('a');
      link.href = recordedUrl;
      link.download = `trade-recording-${Date.now()}.webm`;
      link.click();
    }
  }, [recordedUrl]);

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f6465d] text-white text-xs font-medium rounded hover:bg-[#f6465d]/80 transition-colors"
        >
          <Video size={12} />
          Record
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f6465d] text-white text-xs font-medium rounded animate-pulse"
        >
          <Square size={12} />
          Stop
        </button>
      )}

      {isRecording && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#f6465d] animate-pulse" />
          <span className="text-xs text-[#f6465d]">REC</span>
        </div>
      )}

      {recordedUrl && (
        <>
          <button
            onClick={downloadRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0ecb81] text-black text-xs font-medium rounded hover:bg-[#0ecb81]/80 transition-colors"
          >
            <Download size={12} />
            Download Video
          </button>
          <button
            onClick={() => window.open(recordedUrl, '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2b3139] text-white text-xs rounded hover:bg-[#3b4149] transition-colors"
          >
            <Play size={12} />
            Preview
          </button>
        </>
      )}
    </div>
  );
}
