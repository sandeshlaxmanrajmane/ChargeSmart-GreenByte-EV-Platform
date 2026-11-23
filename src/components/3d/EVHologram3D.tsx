import React, { useRef, useEffect, useState } from 'react';
import { Zap, Sun, Wind, ShieldCheck, RotateCcw, Play, Pause, Layers } from 'lucide-react';

interface EVHologram3DProps {
  initialChargeKw?: number;
  currencySymbol?: string;
}

export const EVHologram3D: React.FC<EVHologram3DProps> = ({
  initialChargeKw = 50,
  currencySymbol = '$',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interactive 3D Orbit States
  const [rotationX, setRotationX] = useState<number>(0.25); // Pitch (tilt down)
  const [rotationY, setRotationY] = useState<number>(-0.6); // Yaw (angle view)
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastMousePos, setLastMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Real-time telemetry states
  const [chargeSpeedKw, setChargeSpeedKw] = useState<number>(initialChargeKw);
  const [currentSoc, setCurrentSoc] = useState<number>(74);
  const [isCharging, setIsCharging] = useState<boolean>(true);
  const [powerSource, setPowerSource] = useState<'solar' | 'wind' | 'grid'>('solar');

  // Simulation tick for SoC rise
  useEffect(() => {
    if (!isCharging) return;
    const interval = setInterval(() => {
      setCurrentSoc((prev) => (prev >= 100 ? 20 : prev + 1));
    }, 2400);
    return () => clearInterval(interval);
  }, [isCharging]);

  // Mouse drag handlers for 3D Orbit
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    setRotationY((prev) => prev + dx * 0.008);
    setRotationX((prev) => Math.max(-0.2, Math.min(0.8, prev + dy * 0.008)));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMousePos.x;
    const dy = e.touches[0].clientY - lastMousePos.y;

    setRotationY((prev) => prev + dx * 0.008);
    setRotationX((prev) => Math.max(-0.2, Math.min(0.8, prev + dy * 0.008)));
    setLastMousePos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  // 3D Engine Canvas Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // Define 3D Vertices for a modern aerodynamic EV Car
    // Origin is at bottom-center of the vehicle
    const carVertices: [number, number, number][] = [
      // Chassis base (bottom floor)
      [-70, 0, -140], // 0: rear left bottom
      [70, 0, -140],  // 1: rear right bottom
      [75, 0, 130],   // 2: front right bottom
      [-75, 0, 130],  // 3: front left bottom

      // Beltline (hood & window base)
      [-68, -35, -135], // 4: rear left belt
      [68, -35, -135],  // 5: rear right belt
      [68, -32, 50],    // 6: windshield base right
      [-68, -32, 50],   // 7: windshield base left
      [70, -25, 125],   // 8: nose right
      [-70, -25, 125],  // 9: nose left

      // Roofline
      [-52, -72, -80],  // 10: rear window top left
      [52, -72, -80],   // 11: rear window top right
      [52, -70, 10],    // 12: windshield top right
      [-52, -70, 10],   // 13: windshield top left

      // Battery pack (under floor)
      [-55, -2, -100],  // 14: battery rear left
      [55, -2, -100],   // 15: battery rear right
      [55, -2, 70],     // 16: battery front right
      [-55, -2, 70],    // 17: battery front left

      // Battery pack bottom
      [-55, 12, -100],  // 18
      [55, 12, -100],   // 19
      [55, 12, 70],     // 20
      [-55, 12, 70],    // 21
    ];

    // Car wireframe edges
    const carEdges: [number, number][] = [
      // Bottom frame
      [0, 1], [1, 2], [2, 3], [3, 0],
      // Beltline
      [4, 5], [5, 6], [6, 8], [8, 9], [9, 7], [7, 4],
      // Pillars & Verticals
      [0, 4], [1, 5], [2, 8], [3, 9],
      // Windshield
      [7, 13], [6, 12], [13, 12],
      // Roof
      [13, 10], [12, 11], [10, 11],
      // Rear Glass
      [10, 4], [11, 5],
      // Front Hood
      [7, 6],
      // Battery Module Box
      [14, 15], [15, 16], [16, 17], [17, 14],
      [18, 19], [19, 20], [20, 21], [21, 18],
      [14, 18], [15, 19], [16, 20], [17, 21],
    ];

    // 4 Wheels: center positions [x, y, z, radius]
    const wheels = [
      [-72, 10, -85, 22], // Rear Left
      [72, 10, -85, 22],  // Rear Right
      [-72, 10, 85, 22],  // Front Left
      [72, 10, 85, 22],   // Front Right
    ];

    // 3D Particles streaming from charger into car
    const particlesCount = 45;
    const particles: {
      x: number;
      y: number;
      z: number;
      speed: number;
      size: number;
      alpha: number;
    }[] = [];

    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: -95 + (Math.random() - 0.5) * 15,
        y: -140 + Math.random() * 100,
        z: -60 + (Math.random() - 0.5) * 15,
        speed: 1.2 + Math.random() * 2.5,
        size: 1.5 + Math.random() * 2.5,
        alpha: Math.random(),
      });
    }

    const render = () => {
      time += 0.02;

      // Handle high-DPI
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2 + 15;
      const fov = 420;

      // Gentle auto-rotation when user is not dragging
      const currentRotY = rotationY + (!isDragging ? Math.sin(time * 0.4) * 0.15 : 0);
      const currentRotX = rotationX;

      // 3D Rotation Transform Function
      const project = (x: number, y: number, z: number): [number, number, number] => {
        // Rotate around Y axis (Yaw)
        const cosY = Math.cos(currentRotY);
        const sinY = Math.sin(currentRotY);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        // Rotate around X axis (Pitch)
        const cosX = Math.cos(currentRotX);
        const sinX = Math.sin(currentRotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        // Perspective Projection
        const cameraDistance = 380;
        const scale = fov / (z2 + cameraDistance);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        return [px, py, z2];
      };

      // 1. Draw 3D Circular Ground Grid and Radar Rings
      ctx.lineWidth = 1;
      for (let r = 80; r <= 240; r += 40) {
        ctx.beginPath();
        const steps = 36;
        for (let s = 0; s <= steps; s++) {
          const theta = (s / steps) * Math.PI * 2;
          const gx = Math.cos(theta) * r;
          const gz = Math.sin(theta) * r;
          const [px, py] = project(gx, 25, gz);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(16, 185, 129, ${0.08 + (r === 160 ? 0.12 : 0)})`;
        ctx.stroke();
      }

      // Animated Pulsing Energy Wave on the Ground
      const pulseRadius = ((time * 45) % 220) + 30;
      ctx.beginPath();
      for (let s = 0; s <= 36; s++) {
        const theta = (s / 36) * Math.PI * 2;
        const gx = Math.cos(theta) * pulseRadius;
        const gz = Math.sin(theta) * pulseRadius;
        const [px, py] = project(gx, 25, gz);
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(52, 211, 153, ${Math.max(0, 0.45 - pulseRadius / 250)})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. Draw 3D Battery Pack Fill (Volumetric Electrolyte Glow)
      const fillHeight = (currentSoc / 100) * 14;
      const batteryTopY = -2;
      const batteryCurY = batteryTopY + (14 - fillHeight);

      // Project 4 corners of battery fill
      const bf1 = project(-55, batteryCurY, -100);
      const bf2 = project(55, batteryCurY, -100);
      const bf3 = project(55, 12, 70);
      const bf4 = project(-55, 12, 70);

      const bGrad = ctx.createLinearGradient(bf1[0], bf1[1], bf3[0], bf3[1]);
      bGrad.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
      bGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.65)');
      bGrad.addColorStop(1, 'rgba(13, 148, 136, 0.5)');

      ctx.beginPath();
      ctx.moveTo(bf1[0], bf1[1]);
      ctx.lineTo(bf2[0], bf2[1]);
      ctx.lineTo(bf3[0], bf3[1]);
      ctx.lineTo(bf4[0], bf4[1]);
      ctx.closePath();
      ctx.fillStyle = bGrad;
      ctx.fill();

      // 3. Project and Render Car Vertices & Wireframe
      const projectedVerts = carVertices.map(([x, y, z]) => project(x, y, z));

      // Draw Wireframe Edges
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.85)';
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 8;

      carEdges.forEach(([i, j]) => {
        const v1 = projectedVerts[i];
        const v2 = projectedVerts[j];

        // Is battery edge?
        const isBatteryEdge = i >= 14 || j >= 14;

        ctx.beginPath();
        ctx.moveTo(v1[0], v1[1]);
        ctx.lineTo(v2[0], v2[1]);

        if (isBatteryEdge) {
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.95)';
          ctx.lineWidth = 2.2;
        } else {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)';
          ctx.lineWidth = 1.6;
        }
        ctx.stroke();
      });

      // Reset shadow blur
      ctx.shadowBlur = 0;

      // 4. Draw 3D Wheels
      wheels.forEach(([wx, wy, wz, wr]) => {
        ctx.beginPath();
        const steps = 18;
        for (let s = 0; s <= steps; s++) {
          const theta = (s / steps) * Math.PI * 2;
          const y = wy + Math.cos(theta) * wr;
          const z = wz + Math.sin(theta) * wr;
          const [px, py] = project(wx, y, z);
          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Hub center
        const [cpx, cpy] = project(wx, wy, wz);
        ctx.beginPath();
        ctx.arc(cpx, cpy, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = '#34D399';
        ctx.fill();
      });

      // 5. Headlights & Taillights 3D Projector Cones
      const [hl1x, hl1y] = project(-65, -28, 125);
      const [hl2x, hl2y] = project(65, -28, 125);
      const [b1x, b1y] = project(-100, -10, 260);
      const [b2x, b2y] = project(100, -10, 260);

      // Light beams forward
      const beamGrad = ctx.createLinearGradient(hl1x, hl1y, b1x, b1y);
      beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      beamGrad.addColorStop(1, 'rgba(52, 211, 153, 0)');

      ctx.beginPath();
      ctx.moveTo(hl1x, hl1y);
      ctx.lineTo(b1x, b1y);
      ctx.lineTo(b2x, b2y);
      ctx.lineTo(hl2x, hl2y);
      ctx.closePath();
      ctx.fillStyle = beamGrad;
      ctx.fill();

      // 6. Draw Charging Cable & 3D Flowing Energy Particles
      if (isCharging) {
        // Charging port position on rear left
        const [portX, portY] = project(-68, -30, -110);
        // Overhead dispenser position
        const [chargerX, chargerY] = project(-120, -130, -110);

        // Cable curve
        ctx.beginPath();
        ctx.moveTo(chargerX, chargerY);
        ctx.bezierCurveTo(
          chargerX - 20,
          chargerY + 50,
          portX - 30,
          portY + 20,
          portX,
          portY
        );
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Dispenser pillar
        const [baseX, baseY] = project(-120, 25, -110);
        ctx.beginPath();
        ctx.moveTo(chargerX, chargerY);
        ctx.lineTo(baseX, baseY);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Particle speed based on charge power kW
        const speedMultiplier = chargeSpeedKw >= 100 ? 2.5 : chargeSpeedKw >= 50 ? 1.6 : 1.0;

        // Animate particles flowing downward along cable
        particles.forEach((p) => {
          p.y += p.speed * speedMultiplier;
          if (p.y > -25) {
            p.y = -135;
            p.x = -115 + (Math.random() - 0.5) * 10;
          }

          // Fractional progress t between dispenser and port
          const t = Math.max(0, Math.min(1, (p.y - (-135)) / 110));
          const curX = (1 - t) * -120 + t * -68;
          const curZ = -110;

          const [ppx, ppy] = project(curX, p.y, curZ);

          ctx.beginPath();
          ctx.arc(ppx, ppy, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(52, 211, 153, ${0.4 + Math.sin(time * 5 + p.y) * 0.4})`;
          ctx.shadowColor = '#34D399';
          ctx.shadowBlur = 6;
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [rotationX, rotationY, isDragging, chargeSpeedKw, currentSoc, isCharging]);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-3xl bg-gradient-to-br from-[#06332A] via-[#0A4237] to-[#041D17] border border-emerald-500/30 overflow-hidden shadow-2xl p-5 sm:p-7 text-white select-none"
    >
      {/* 3D Depth Grid Lines Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      {/* Top Hologram Status Header */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
            3D Clean Energy Digital Twin
          </span>
          <span className="text-[11px] text-slate-300 font-mono hidden sm:inline">
            Drag to Orbit 360°
          </span>
        </div>

        {/* Play / Pause toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCharging(!isCharging)}
            className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-emerald-300 border border-white/15 transition-all flex items-center gap-1.5"
          >
            {isCharging ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isCharging ? 'Simulate Intake' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* The 3D Interactive Canvas */}
      <div
        className="relative w-full h-72 sm:h-80 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Floating 3D Telemetry HUD Pins */}
        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-emerald-500/30 text-xs space-y-1 pointer-events-none shadow-lg animate-float-3d">
          <div className="text-[10px] uppercase font-bold text-slate-400">Battery Level</div>
          <div className="text-xl font-black font-mono text-emerald-400 flex items-center gap-1.5">
            <span>{currentSoc}%</span>
            <span className="text-[10px] text-emerald-300 font-normal">SoC</span>
          </div>
          <div className="w-24 h-1.5 bg-slate-700/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
              style={{ width: `${currentSoc}%` }}
            />
          </div>
        </div>

        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md rounded-2xl p-3 border border-emerald-500/30 text-xs space-y-1 text-right pointer-events-none shadow-lg">
          <div className="text-[10px] uppercase font-bold text-slate-400">Intake Rate</div>
          <div className="text-xl font-black font-mono text-amber-300 flex items-center justify-end gap-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{chargeSpeedKw} kW</span>
          </div>
          <div className="text-[10px] text-emerald-300 font-semibold">
            {chargeSpeedKw >= 100 ? '⚡ Ultra-Fast DC' : chargeSpeedKw >= 50 ? '⚡ DC Fast' : 'AC Standard'}
          </div>
        </div>
      </div>

      {/* Bottom Interactive Controls */}
      <div className="relative z-10 pt-3 border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Speed Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-semibold uppercase mr-1">Power Output:</span>
          {[22, 50, 120].map((kw) => (
            <button
              key={kw}
              onClick={() => setChargeSpeedKw(kw)}
              className={`px-3 py-1 rounded-xl font-mono font-bold text-xs transition-all ${
                chargeSpeedKw === kw
                  ? 'bg-emerald-500 text-forest-dark shadow-md'
                  : 'bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10'
              }`}
            >
              {kw} kW
            </button>
          ))}
        </div>

        {/* Clean Source Indicator */}
        <div className="flex items-center gap-3 text-slate-300">
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>92% Solar Canopy Active</span>
          </div>
          <span className="text-slate-500">•</span>
          <span className="font-mono text-slate-400">0.04 kg CO₂e/kWh</span>
        </div>
      </div>
    </div>
  );
};
