'use client';

import React, { useEffect, useRef } from 'react';

export default function VoiceVisualizer({ state }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set device pixel ratio scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    let phase = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const centerY = height / 2;

      ctx.lineWidth = 2.5;
      
      // Determine wave count and amplitude based on speech state
      let numWaves = 3;
      let maxAmplitude = 0;
      let speed = 0.05;

      if (state === 'listening') {
        maxAmplitude = 25;
        speed = 0.15;
        numWaves = 4;
      } else if (state === 'parsing') {
        maxAmplitude = 8;
        speed = 0.25;
        numWaves = 2;
      } else {
        // Idle state: flat or tiny ambient wave
        maxAmplitude = 2;
        speed = 0.02;
        numWaves = 1;
      }

      // Draw layered sine waves
      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        const waveOffset = i * 45;
        const opacity = 1 - (i / numWaves) * 0.6;
        
        ctx.strokeStyle = `rgba(255, 87, 34, ${opacity})`;
        
        for (let x = 0; x < width; x++) {
          const progress = x / width;
          // Apply a fade on both left & right edges (bell-curve style window)
          const edgeEnvelope = Math.sin(progress * Math.PI);
          
          const angle = (progress * Math.PI * 2.5) + phase + waveOffset;
          const y = centerY + Math.sin(angle) * maxAmplitude * edgeEnvelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      phase += speed;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-24 bg-transparent rounded-2xl"
      style={{ display: 'block' }}
    />
  );
}
