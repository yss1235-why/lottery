// File path: src/components/draws/DrawPlayer.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { formatDate } from '@/lib/formatters';
import { MdPlayArrow, MdPause, MdVolumeUp, MdVolumeOff, MdFullscreen } from 'react-icons/md';
import { Draw } from '@/types/draw';

interface DrawPlayerProps {
  draw: Draw;
}

export default function DrawPlayer({ draw }: DrawPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set up video event listeners
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    
    const onTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };
    
    const onLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };
    
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    
    videoElement.addEventListener('timeupdate', onTimeUpdate);
    videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
    videoElement.addEventListener('play', onPlay);
    videoElement.addEventListener('pause', onPause);
    
    return () => {
      videoElement.removeEventListener('timeupdate', onTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
      videoElement.removeEventListener('play', onPlay);
      videoElement.removeEventListener('pause', onPause);
    };
  }, []);

  // Video control functions
  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };
  
  const toggleMute = () => {
    if (!videoRef.current) return;
    
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    
    const newTime = parseFloat(e.target.value);
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const enterFullscreen = () => {
    if (!playerRef.current) return;
    
    if (playerRef.current.requestFullscreen) {
      playerRef.current.requestFullscreen();
    }
  };
  
  // Show/hide controls with timeout
  const showControlsWithTimeout = () => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };
  
  // Format time for display
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="draw-player px-sm py-md">
      <div 
        ref={playerRef}
        className="relative bg-black rounded-lg overflow-hidden"
        onMouseMove={showControlsWithTimeout}
        onTouchStart={showControlsWithTimeout}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full max-h-[70vh] object-contain"
          src={draw.videoUrl}
          poster="/assets/images/ui/draw-poster.jpg"
          muted={isMuted}
          onClick={togglePlay}
        />
        
        {/* Video Controls */}
        <div className={`video-controls absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-dark/90 to-transparent p-3 transition-opacity ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          {/* Progress Bar */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-neutral-light/30 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3498DB ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 0%)`
            }}
          />
          
          {/* Control Buttons */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-3">
              <button
                onClick={togglePlay}
                className="bg-secondary w-8 h-8 rounded-full flex items-center justify-center"
              >
                {isPlaying ? <MdPause /> : <MdPlayArrow />}
              </button>
              
              <button
                onClick={toggleMute}
                className="text-neutral-light/80 hover:text-white transition-colors"
              >
                {isMuted ? <MdVolumeOff /> : <MdVolumeUp />}
              </button>
              
              <div className="text-sm text-neutral-light/70">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <button
              onClick={enterFullscreen}
              className="text-neutral-light/80 hover:text-white transition-colors"
            >
              <MdFullscreen />
            </button>
          </div>
        </div>
        
        {/* Video Info Overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-neutral-dark/80 to-transparent p-3">
          <h2 className="text-lg font-bold">{draw.title}</h2>
          <div className="text-sm text-neutral-light/70">
            {formatDate(draw.date)}
          </div>
        </div>
        
        {/* Winner display - simplified static version */}
        {draw.winner && (
          <div className="absolute bottom-16 right-4 bg-neutral-dark p-4 rounded-lg shadow-lg z-10">
            <h3 className="text-lg font-bold mb-2">Winner: {draw.winner.name}</h3>
            <div className="text-prize-gold font-bold">
              Prize: {draw.winner.prize}
            </div>
            {draw.winner.ticketNumber && (
              <div className="mt-1 text-sm text-neutral-light/70">
                Ticket #{draw.winner.ticketNumber}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
