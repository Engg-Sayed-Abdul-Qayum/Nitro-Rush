import { useEffect, useRef } from "react";
import { clamp } from "./gameConfig";

const COLORS = ["#ffb547", "#43d9ff", "#b78cff", "#f45c78", "#e9edf4"];

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawPlayer(ctx, x, y, w, h, glow = true) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = "#c7ff35";
    ctx.shadowBlur = 22;
  }
  // Wheels
  ctx.fillStyle = "#090d12";
  roundedRect(ctx, x - 5, y + 16, 9, 24, 4); ctx.fill();
  roundedRect(ctx, x + w - 4, y + 16, 9, 24, 4); ctx.fill();
  roundedRect(ctx, x - 5, y + h - 42, 9, 24, 4); ctx.fill();
  roundedRect(ctx, x + w - 4, y + h - 42, 9, 24, 4); ctx.fill();

  const body = ctx.createLinearGradient(x, y, x + w, y + h);
  body.addColorStop(0, "#edff9b");
  body.addColorStop(.45, "#c7ff35");
  body.addColorStop(1, "#83b51b");
  ctx.fillStyle = body;
  roundedRect(ctx, x, y, w, h, 13); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#25351a";
  roundedRect(ctx, x + 8, y + 19, w - 16, 34, 8); ctx.fill();
  ctx.fillStyle = "#5b7c2b";
  roundedRect(ctx, x + 7, y + 58, w - 14, 26, 7); ctx.fill();
  ctx.fillStyle = "#f4fff0";
  roundedRect(ctx, x + 5, y + 7, 9, 5, 2); ctx.fill();
  roundedRect(ctx, x + w - 14, y + 7, 9, 5, 2); ctx.fill();
  ctx.fillStyle = "#ff4b5f";
  roundedRect(ctx, x + 5, y + h - 11, 9, 5, 2); ctx.fill();
  roundedRect(ctx, x + w - 14, y + h - 11, 9, 5, 2); ctx.fill();
  ctx.restore();
}

function drawEnemy(ctx, car) {
  const { x, y, w, h, color } = car;
  ctx.save();
  ctx.fillStyle = "#070a0f";
  roundedRect(ctx, x - 5, y + 16, 9, 24, 4); ctx.fill();
  roundedRect(ctx, x + w - 4, y + 16, 9, 24, 4); ctx.fill();
  roundedRect(ctx, x - 5, y + h - 42, 9, 24, 4); ctx.fill();
  roundedRect(ctx, x + w - 4, y + h - 42, 9, 24, 4); ctx.fill();
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(.12, color);
  grad.addColorStop(1, "#202735");
  ctx.fillStyle = grad;
  roundedRect(ctx, x, y, w, h, 12); ctx.fill();
  ctx.fillStyle = "rgba(5,12,20,.8)";
  roundedRect(ctx, x + 8, y + 20, w - 16, 34, 7); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.22)";
  roundedRect(ctx, x + 7, y + 59, w - 14, 24, 6); ctx.fill();
  ctx.fillStyle = "#ff3d58";
  roundedRect(ctx, x + 5, y + h - 11, 9, 5, 2); ctx.fill();
  roundedRect(ctx, x + w - 14, y + h - 11, 9, 5, 2); ctx.fill();
  ctx.restore();
}

export default function GameCanvas({ level, status, onProgress, onCrash, onComplete, controlRef }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const callbacksRef = useRef({ onProgress, onCrash, onComplete });

  useEffect(() => {
    callbacksRef.current = { onProgress, onCrash, onComplete };
  }, [onProgress, onCrash, onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 900;
    let height = 600;
    let raf = 0;
    let last = 0;
    let progressTimer = 0;
    const s = {
      playerX: 0, playerY: 0, playerW: 48, playerH: 104,
      roadOffset: 0, distance: 0, score: 0, speed: 0,
      enemies: [], particles: [], spawn: 0, nitro: 100, shake: 0,
      keys: { left: false, right: false },
      finished: false,
    };
    stateRef.current = s;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(320, rect.width);
      height = Math.max(420, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.playerW = clamp(width * .075, 40, 54);
      s.playerH = s.playerW * 2.08;
      s.playerX = s.playerX || width / 2 - s.playerW / 2;
      s.playerX = clamp(s.playerX, roadLeft() + 12, roadRight() - s.playerW - 12);
      s.playerY = height - s.playerH - 35;
    };
    const roadWidth = () => Math.min(width * .76, 520);
    const roadLeft = () => (width - roadWidth()) / 2;
    const roadRight = () => roadLeft() + roadWidth();

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const keyDown = (e) => {
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") s.keys.left = true;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") s.keys.right = true;
    };
    const keyUp = (e) => {
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") s.keys.left = false;
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") s.keys.right = false;
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);

    const drawRoad = (dt) => {
      ctx.fillStyle = "#101a18";
      ctx.fillRect(0, 0, width, height);
      // roadside glow and grass texture
      for (let i = 0; i < 26; i++) {
        const yy = ((i * 83 + s.roadOffset * .7) % (height + 90)) - 45;
        ctx.fillStyle = i % 2 ? "rgba(199,255,53,.045)" : "rgba(255,255,255,.025)";
        ctx.fillRect(0, yy, roadLeft() - 7, 2);
        ctx.fillRect(roadRight() + 7, yy, width, 2);
      }
      const road = ctx.createLinearGradient(roadLeft(), 0, roadRight(), 0);
      road.addColorStop(0, "#202832");
      road.addColorStop(.5, "#2a333e");
      road.addColorStop(1, "#202832");
      ctx.fillStyle = road;
      ctx.fillRect(roadLeft(), 0, roadWidth(), height);
      // edge lines
      ctx.fillStyle = "#c7ff35";
      ctx.fillRect(roadLeft() + 3, 0, 2, height);
      ctx.fillRect(roadRight() - 5, 0, 2, height);
      // lane dashes
      const laneW = roadWidth() / 3;
      for (let lane = 1; lane < 3; lane++) {
        const x = roadLeft() + laneW * lane;
        for (let y = -70; y < height + 70; y += 105) {
          const yy = (y + s.roadOffset) % (height + 105) - 35;
          ctx.fillStyle = "rgba(225,235,245,.48)";
          ctx.fillRect(x - 2, yy, 4, 48);
        }
      }
      // roadside reflectors
      for (let y = -30; y < height + 30; y += 80) {
        const yy = (y + s.roadOffset * 1.15) % (height + 80) - 25;
        ctx.fillStyle = "rgba(199,255,53,.8)";
        ctx.shadowColor = "#c7ff35";
        ctx.shadowBlur = 10;
        ctx.fillRect(roadLeft() - 11, yy, 3, 17);
        ctx.fillRect(roadRight() + 8, yy, 3, 17);
        ctx.shadowBlur = 0;
      }
    };

    const spawnEnemy = () => {
      const laneW = roadWidth() / 3;
      const lane = Math.floor(Math.random() * 3);
      const w = s.playerW * (.91 + Math.random() * .13);
      s.enemies.push({
        x: roadLeft() + laneW * lane + laneW / 2 - w / 2,
        y: -s.playerH - 30,
        w, h: s.playerH * .98,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        extra: Math.random() * 1.1,
      });
    };

    const frame = (time) => {
      const dt = Math.min((time - (last || time)) / 16.67, 2.2);
      last = time;
      const playing = controlRef.current?.status === "playing";
      const paused = controlRef.current?.status === "paused";
      if (playing && !s.finished) {
        const base = 3.6 * level.speed;
        s.speed = base + Math.min(s.distance / 330, 4.5);
        s.roadOffset = (s.roadOffset + s.speed * dt * 2.3) % 105;
        s.distance += s.speed * dt * .58;
        s.score += Math.floor(s.speed * dt * .8);
        s.nitro = Math.min(100, s.nitro + .025 * dt);
        const move = 6.3 * dt;
        if (s.keys.left) s.playerX -= move;
        if (s.keys.right) s.playerX += move;
        const touch = controlRef.current?.direction;
        if (touch === "left") s.playerX -= move;
        if (touch === "right") s.playerX += move;
        s.playerX = clamp(s.playerX, roadLeft() + 13, roadRight() - s.playerW - 13);

        s.spawn -= dt;
        if (s.spawn <= 0) {
          spawnEnemy();
          s.spawn = Math.max(23, 62 / level.traffic - s.distance / 75) + Math.random() * 18;
        }
        s.enemies.forEach((car) => { car.y += (s.speed + car.extra) * dt * 2.5; });
        s.enemies = s.enemies.filter((car) => car.y < height + 130);
        const px = s.playerX + 7, py = s.playerY + 8, pw = s.playerW - 14, ph = s.playerH - 16;
        for (const car of s.enemies) {
          const ex = car.x + 7, ey = car.y + 8, ew = car.w - 14, eh = car.h - 16;
          if (px < ex + ew && px + pw > ex && py < ey + eh && py + ph > ey) {
            s.finished = true;
            s.shake = 13;
            callbacksRef.current.onCrash({ score: s.score, distance: Math.floor(s.distance) });
            break;
          }
        }
        if (s.distance >= level.target && !s.finished) {
          s.finished = true;
          callbacksRef.current.onComplete({ score: s.score, distance: Math.floor(s.distance) });
        }
        progressTimer += dt;
        if (progressTimer > 5) {
          progressTimer = 0;
          callbacksRef.current.onProgress({
            score: s.score, distance: Math.floor(s.distance),
            speed: Math.round(90 + s.speed * 19), nitro: Math.round(s.nitro),
          });
        }
      }

      ctx.save();
      if (s.shake > 0) {
        ctx.translate((Math.random() - .5) * s.shake, (Math.random() - .5) * s.shake);
        s.shake *= .82;
      }
      drawRoad(dt);
      s.enemies.forEach((car) => drawEnemy(ctx, car));
      drawPlayer(ctx, s.playerX, s.playerY, s.playerW, s.playerH, playing);
      // exhaust
      if (playing) {
        for (let i = 0; i < 2; i++) {
          ctx.fillStyle = `rgba(199,255,53,${Math.random() * .35})`;
          ctx.beginPath();
          ctx.arc(s.playerX + (i ? s.playerW - 9 : 9), s.playerY + s.playerH + Math.random() * 13, 2 + Math.random() * 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      if (paused) {
        ctx.fillStyle = "rgba(5,8,13,.52)";
        ctx.fillRect(0, 0, width, height);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [level, controlRef]);

  return <canvas ref={canvasRef} className="game-canvas" aria-label="Nitro Rush racing track" />;
}
