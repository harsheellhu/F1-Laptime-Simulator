import { useEffect, useRef } from 'react';

/**
 * Ultra-smooth, high-performance Canvas cursor trail.
 * - Lerped custom glowing cursor dot
 * - Fluid multi-point trailing ribbon with smooth damping
 * - Velocity-reactive particle sparks
 * - Magnetic / expanding hover response on interactive elements
 * - Zero React re-renders during mouse move (runs completely on rAF)
 * - Automatically pauses on hidden tab for 0% CPU consumption
 */
export default function CursorTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Only run on devices with a mouse/fine pointer to save mobile GPU/CPU
    if (window.matchMedia && !window.matchMedia('(pointer: fine)').matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates
    const mouse = {
      x: width / 2,
      y: height / 2,
      targetX: width / 2,
      targetY: height / 2,
      vx: 0,
      vy: 0,
      speed: 0,
      visible: false,
      hovering: false,
      clicking: false,
    };

    // Trail points for ribbon
    const TRAIL_LENGTH = 20;
    const trail = Array.from({ length: TRAIL_LENGTH }, () => ({
      x: width / 2,
      y: height / 2,
      vx: 0,
      vy: 0,
    }));

    // Spark particles
    const particles = [];
    const ripples = [];

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.visible = true;

      // Spawn spark particles on fast movement (capped to prevent overload)
      if (mouse.speed > 8 && particles.length < 24 && Math.random() < 0.4) {
        particles.push({
          x: e.clientX + (Math.random() - 0.5) * 6,
          y: e.clientY + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 2.5 - mouse.vx * 0.1,
          vy: (Math.random() - 0.5) * 2.5 - mouse.vy * 0.1,
          size: Math.random() * 2 + 1,
          life: 1,
          decay: Math.random() * 0.04 + 0.03,
          color: Math.random() > 0.35 ? '#ff1844' : '#00f0ff',
        });
      }
    };

    const handleMouseEnter = () => {
      mouse.visible = true;
    };

    const handleMouseLeave = () => {
      mouse.visible = false;
    };

    const handleMouseDown = (e) => {
      mouse.clicking = true;
      if (ripples.length < 4) {
        ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 4,
          maxRadius: 40,
          alpha: 0.8,
        });
      }

      // Burst of particles on click
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1.5;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 2.5 + 1,
          life: 1,
          decay: Math.random() * 0.04 + 0.03,
          color: i % 2 === 0 ? '#ff1844' : '#ff3366',
        });
      }
    };

    const handleMouseUp = () => {
      mouse.clicking = false;
    };

    // Detect hover over interactive elements
    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.closest('button') ||
          target.closest('a') ||
          target.closest('.interactive') ||
          target.closest('.glass-formula') ||
          target.closest('.glass') ||
          target.getAttribute('role') === 'button' ||
          target.classList?.contains('clickable'))
      ) {
        mouse.hovering = true;
      } else {
        mouse.hovering = false;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    window.addEventListener('mouseover', handleMouseOver, { passive: true });

    let animId;
    let dotRadius = 5;
    let targetDotRadius = 5;
    let cursorAura = 0;
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      ctx.clearRect(0, 0, width, height);

      // Smooth lerp mouse position (120fps physics)
      const prevX = mouse.x;
      const prevY = mouse.y;
      mouse.x += (mouse.targetX - mouse.x) * 0.38;
      mouse.y += (mouse.targetY - mouse.y) * 0.38;
      mouse.vx = mouse.x - prevX;
      mouse.vy = mouse.y - prevY;
      mouse.speed = Math.hypot(mouse.vx, mouse.vy);

      // Interpolate trail points (smooth snake damping)
      trail[0].x = mouse.x;
      trail[0].y = mouse.y;

      for (let i = 1; i < TRAIL_LENGTH; i++) {
        const p = trail[i];
        const prev = trail[i - 1];
        p.x += (prev.x - p.x) * 0.44;
        p.y += (prev.y - p.y) * 0.44;
      }

      if (mouse.visible) {
        // Draw trailing fluid ribbon
        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        // Outer glow ribbon
        for (let i = 0; i < TRAIL_LENGTH - 1; i++) {
          const p1 = trail[i];
          const p2 = trail[i + 1];
          const t = 1 - i / TRAIL_LENGTH;
          const alpha = t * 0.35;
          const w = t * (mouse.hovering ? 8 : 5) + 1;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(255, 24, 68, ${alpha})`;
          ctx.lineWidth = w * 1.6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }

        // Inner core ribbon
        for (let i = 0; i < TRAIL_LENGTH - 1; i++) {
          const p1 = trail[i];
          const p2 = trail[i + 1];
          const t = 1 - i / TRAIL_LENGTH;
          const alpha = t * 0.75;
          const w = t * (mouse.hovering ? 4 : 2.5) + 0.6;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(255, 120, 150, ${alpha})`;
          ctx.lineWidth = w;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }

        ctx.restore();

        // Target radius on hover / click
        targetDotRadius = mouse.clicking ? 3 : mouse.hovering ? 12 : 5;
        dotRadius += (targetDotRadius - dotRadius) * 0.2;
        cursorAura += ((mouse.hovering ? 1 : 0) - cursorAura) * 0.15;

        // Interactive Aura ring
        if (cursorAura > 0.01) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, 18 + cursorAura * 5, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 24, 68, ${0.35 * cursorAura})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.restore();
        }

        // Central glowing cursor dot
        ctx.save();
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = mouse.hovering ? 'rgba(255, 255, 255, 0.95)' : '#ffffff';
        ctx.shadowColor = '#ff1844';
        ctx.shadowBlur = mouse.hovering ? 16 : 10;
        ctx.fill();

        ctx.lineWidth = 1.2;
        ctx.strokeStyle = '#ff1844';
        ctx.stroke();
        ctx.restore();
      }

      // Draw click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += (r.maxRadius - r.radius) * 0.14 + 0.5;
        r.alpha *= 0.91;

        if (r.alpha <= 0.01 || r.radius >= r.maxRadius - 1) {
          ripples.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 24, 68, ${r.alpha})`;
        ctx.lineWidth = 2 * r.alpha;
        ctx.stroke();
        ctx.restore();
      }

      // Draw and update sparks
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.9;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    const handleVisibility = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animId);
      } else {
        if (!isRunning) {
          isRunning = true;
          animId = requestAnimationFrame(render);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 999999,
      }}
    />
  );
}
