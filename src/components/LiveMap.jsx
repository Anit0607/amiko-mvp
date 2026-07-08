'use client';

import React, { useEffect, useRef, useState } from 'react';

// Path nodes in Bengaluru (x, y coordinates on our canvas mockup grid)
const PATH_POINTS = [
  { x: 40, y: 50, name: 'Care Buddy Hub' },
  { x: 120, y: 50, name: 'MG Road Intersection' },
  { x: 120, y: 150, name: 'Brigade Road' },
  { x: 260, y: 150, name: 'Richmond Circle' },
  { x: 260, y: 220, name: 'Rose Garden Ave' },
  { x: 310, y: 220, name: "Margaret's Home (42 Rose Garden)" }
];

export default function LiveMap({ isActive, onArrived }) {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [buddyPos, setBuddyPos] = useState({ x: PATH_POINTS[0].x, y: PATH_POINTS[0].y });
  const [eta, setEta] = useState(15); // in minutes
  const animationRef = useRef(null);

  // Animate the Care Buddy along the path
  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      setBuddyPos({ x: PATH_POINTS[0].x, y: PATH_POINTS[0].y });
      setEta(15);
      return;
    }

    let start = null;
    const duration = 25000; // 25 seconds for full trip simulation

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(pct);

      // Compute current coordinates on path
      const totalPoints = PATH_POINTS.length;
      const segmentPercent = 100 / (totalPoints - 1);
      const segmentIndex = Math.floor(pct / segmentPercent);

      if (segmentIndex >= totalPoints - 1) {
        setBuddyPos(PATH_POINTS[totalPoints - 1]);
        setEta(0);
        if (onArrived) onArrived();
      } else {
        const p1 = PATH_POINTS[segmentIndex];
        const p2 = PATH_POINTS[segmentIndex + 1];
        const localPct = (pct - segmentIndex * segmentPercent) / segmentPercent;
        
        const currentX = p1.x + (p2.x - p1.x) * localPct;
        const currentY = p1.y + (p2.y - p1.y) * localPct;

        setBuddyPos({ x: currentX, y: currentY });
        setEta(Math.ceil(15 * (1 - pct / 100)));
      }

      if (pct < 100) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  // Canvas drawing loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Canvas scaling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Draw grid roads, landmarks, and route
    ctx.clearRect(0, 0, width, height);

    // Draw background grid lines (local streets)
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 20; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    for (let i = 20; i < height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }

    // Draw the main route line
    ctx.strokeStyle = 'rgba(255, 87, 34, 0.2)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
    for (let i = 1; i < PATH_POINTS.length; i++) {
      ctx.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
    }
    ctx.stroke();

    // Draw completed route path
    ctx.strokeStyle = 'hsl(14, 95%, 60%)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(PATH_POINTS[0].x, PATH_POINTS[0].y);
    
    // Find point on segment
    const totalPoints = PATH_POINTS.length;
    const segmentPercent = 100 / (totalPoints - 1);
    const segmentIndex = Math.floor(progress / segmentPercent);

    for (let i = 0; i <= segmentIndex; i++) {
      if (i < totalPoints) {
        ctx.lineTo(PATH_POINTS[i].x, PATH_POINTS[i].y);
      }
    }
    ctx.lineTo(buddyPos.x, buddyPos.y);
    ctx.stroke();

    // Draw start hub marker
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(PATH_POINTS[0].x, PATH_POINTS[0].y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Draw destination house marker (42 Rose Garden)
    const dest = PATH_POINTS[totalPoints - 1];
    ctx.fillStyle = '#4caf50'; // Green
    ctx.beginPath();
    ctx.arc(dest.x, dest.y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // House roof outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(dest.x - 4, dest.y + 2);
    ctx.lineTo(dest.x, dest.y - 3);
    ctx.lineTo(dest.x + 4, dest.y + 2);
    ctx.stroke();

    // Draw Care Buddy marker
    ctx.fillStyle = 'hsl(210, 100%, 60%)'; // Blue
    ctx.shadowColor = 'rgba(0,0,0,0.15)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(buddyPos.x, buddyPos.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    // Draw center indicator inside marker
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(buddyPos.x, buddyPos.y, 4, 0, Math.PI * 2);
    ctx.fill();

  }, [buddyPos, progress]);

  return (
    <div className="w-full">
      <div className="relative w-full h-48 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
        
        {/* Floating ETA HUD overlay */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
          <span className="text-xs font-bold text-slate-800">
            {eta > 0 ? `Ravi is en route - ETA ${eta} min` : 'Care Buddy arrived at location'}
          </span>
        </div>
      </div>
    </div>
  );
}
