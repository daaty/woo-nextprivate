export default function LoadingSpinner({ size = 'normal' }) {
  const isSmall = size === 'small';
  const containerSize = isSmall ? 40 : 60;
  const spinnerSize = isSmall ? 32 : 50;
  const borderWidth = isSmall ? 3 : 4;
  
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      <div className="loading-ring"></div>
      <div className="loading-inner-ring"></div>
      <style jsx>{`
        .loading-spinner-container {
          position: relative;
          width: ${containerSize}px;
          height: ${containerSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
        }        .loading-spinner {
          width: ${spinnerSize}px;
          height: ${spinnerSize}px;
          border: ${borderWidth}px solid transparent;
          border-top: ${borderWidth}px solid #ff6900;
          border-right: ${borderWidth}px solid #00a8e1;
          border-radius: 50%;
          animation: spin 1s linear infinite, gradient-shift 3s ease-in-out infinite;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
          box-shadow: 0 0 ${isSmall ? 8 : 15}px rgba(255, 105, 0, 0.6), 0 0 ${isSmall ? 16 : 30}px rgba(0, 168, 225, 0.6), inset 0 0 ${isSmall ? 5 : 10}px rgba(255, 255, 255, 0.8);
        }        .loading-ring {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: ${isSmall ? 2 : 3}px solid rgba(0, 168, 225, 0.3);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .loading-inner-ring {
          position: absolute;
          width: ${isSmall ? 20 : 30}px;
          height: ${isSmall ? 20 : 30}px;
          border: ${isSmall ? 2 : 3}px solid transparent;
          border-left: ${isSmall ? 2 : 3}px solid #00a8e1;
          border-bottom: ${isSmall ? 2 : 3}px solid #ff6900;
          border-radius: 50%;
          animation: spin-reverse 1.5s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(-360deg);
          }
        }

        @keyframes gradient-shift {
          0%, 100% {
            border-top-color: #ff6900;
            border-right-color: #00a8e1;
          }
          50% {
            border-top-color: #00a8e1;
            border-right-color: #ff6900;
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
}
