import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './BrandBanner.module.css';

const BrandBanner = ({ brand }) => {
  const { name, slug, logoUrl, imageUrl, videoUrl, title, description } = brand;
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // Toggle video play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Toggle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  // Autoplay video when it's in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && videoRef.current) {
            videoRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(error => console.error("Video play failed:", error));
          } else if (videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.brandBanner}>
      {/* Left side with video/image */}
      <div className={styles.mediaContainer}>
        {videoUrl ? (
          <div className={styles.videoWrapper}>
            <video 
              ref={videoRef}
              className={styles.brandVideo}
              muted={isMuted}
              loop
              playsInline
              poster={imageUrl}
            >
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            <div className={styles.videoControls}>
              <button 
                className={styles.playButton} 
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause video" : "Play video"}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
              </button>
              
              <button 
                className={styles.muteButton} 
                onClick={toggleMute}
                aria-label={isMuted ? "Unmute video" : "Mute video"}
              >
                {isMuted ? (
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        ) : (
          <img 
            src={imageUrl} 
            alt={`${name} products`} 
            className={styles.brandImage}
          />
        )}
      </div>
      
      {/* Black strip on right side */}
      <div className={styles.infoContainer}>
        <div className={styles.infoContent}>
          <div className={styles.logoContainer}>
            <img 
              src={logoUrl} 
              alt={`${name} logo`} 
              className={styles.brandLogo}
            />
          </div>
          
          <h2 className={styles.brandTitle}>{title}</h2>
          
          <p className={styles.brandDescription}>
            {description}
          </p>
          
          <Link href={`/marca/${slug}`}>
            <a className={styles.shopButton}>
              Ver produtos
              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BrandBanner;