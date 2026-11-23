import React, { useRef, useEffect } from 'react';
import { Sun, Wind, Zap } from 'lucide-react';

interface RenewableCore3DProps {
  solarMw?: number;
  windMw?: number;
  cleanPct?: number;
}

export const RenewableCore3D: React.FC<RenewableCore3DProps> = ({
  solarMw = 412,
  windMw = 185,
  cleanPct = 78,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // 3D Particles on spherical surface
    const particleCount = 70;
    const particles: { theta: number; phi: number; speed: number; radius: number; color: string }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        theta: Math.random() * Math.PI * 2,
        phi: (Math.random() - 0.5) * Math.PI,
        speed: (Math.random() * 0.015 + 0.005) * (i % 2 === 0 ? 1 : -1),
        radius: 80 + Math.random() * 25,
        color: i % 3 === 0 ? '#10B981' : i % 3 === 1 ? '#38BDF8' : '#F59E0B',
      });
    }

    const render = () => {
      time += 0.015;

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
      const cy = height / 2;

      // 3D Rotation matrices
      const rotY = time * 0.6;
      const rotX = 0.35;

      // 1. Draw glowing inner energy core
      const coreGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, 65);
      coreGrad.addColorStop(0, 'rgba(52, 211, 153, 0.9)');
      coreGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.4)');
      coreGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');

      ctx.beginPath();
      ctx.arc(cx, cy, 65, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // 2. Draw 3 Rotating Orbital Rings in 3D
      const rings = [
        { radius: 75, angle: time * 0.8, tilt: 0.7, color: 'rgba(245, 158, 11, 0.5)', width: 2 }, // Solar Ring
        { radius: 95, angle: -time * 0.6, tilt: -0.5, color: 'rgba(56, 189, 248, 0.5)', width: 2 }, // Wind Ring
        { radius: 115, angle: time * 0.4, tilt: 1.1, color: 'rgba(16, 185, 129, 0.6)', width: 2.5 }, // Clean Mix Ring
      ];

      rings.forEach((ring) => {
        ctx.beginPath();
        const steps = 40;
        for (let s = 0; s <= steps; s++) {
          const t = (s / steps) * Math.PI * 2;
          const x = Math.cos(t) * ring.radius;
          const z = Math.sin(t) * ring.radius;

          // Apply ring tilt and rotation
          const x1 = x * Math.cos(ring.angle) - z * Math.sin(ring.angle);
          const z1 = x * Math.sin(ring.angle) + z * Math.cos(ring.angle);
          const y2 = z1 * Math.sin(ring.tilt);
          const z2 = z1 * Math.cos(ring.tilt);

          const scale = 320 / (z2 + 320);
          const px = cx + x1 * scale;
          const py = cy + y2 * scale;

          if (s === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.width;
        ctx.stroke();
      });

      // 3. Render 3D Orbiting Particle Nodes
      particles.forEach((p) => {
        p.theta += p.speed;

        // Spherical to 3D Cartesian
        const x = p.radius * Math.cos(p.phi) * Math.cos(p.theta);
        const y = p.radius * Math.sin(p.phi);
        const z = p.radius * Math.cos(p.phi) * Math.sin(p.theta);

        // Yaw and Pitch
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = x * cosY + z * sinY;
        const z1 = -x * sinY + z * cosY;

        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;

        const scale = 320 / (z2 + 320);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;

        const size = Math.max(1, (scale * 2.2));
        const alpha = Math.max(0.2, (z2 + p.radius) / (2 * p.radius));

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [solarMw, windMw, cleanPct]);

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-3xl bg-gradient-to-br from-slate-950 via-[#062E25] to-slate-900 border border-emerald-500/30 overflow-hidden shadow-2xl flex items-center justify-center p-4">
      {/* Background Starfield Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px] opacity-15 pointer-events-none" />

      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating Center Badge */}
      <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
        <div className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
          Clean Mix
        </div>
        <div className="text-3xl font-black font-mono text-white tracking-tight drop-shadow-md">
          {cleanPct}%
        </div>
        <div className="text-[10px] text-slate-300 font-medium">Grid Generation</div>
      </div>

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white bg-black/40 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 pointer-events-none">
        <div className="flex items-center gap-1.5 text-amber-400 font-bold">
          <Sun className="w-3.5 h-3.5" />
          <span>{solarMw} MW Solar</span>
        </div>
        <div className="flex items-center gap-1.5 text-sky-400 font-bold">
          <Wind className="w-3.5 h-3.5" />
          <span>{windMw} MW Wind</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <Zap className="w-3.5 h-3.5" />
          <span>{solarMw + windMw} MW Total</span>
        </div>
      </div>
    </div>
  );
};
