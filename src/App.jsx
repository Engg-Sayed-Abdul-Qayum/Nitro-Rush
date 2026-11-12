import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity, ArrowLeft, ArrowRight, Award, ChevronRight, CircleHelp,
  Gauge, Gamepad2, Pause, Play, RotateCcw, ShieldCheck, Sparkles,
  Trophy, Volume2, VolumeX, Zap
} from "lucide-react";
import GameCanvas from "./game/GameCanvas";
import { LEVELS } from "./game/gameConfig";

const readSaved = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("nitro-rush-save") || "{}");
    return { unlocked: Math.max(1, Math.min(3, saved.unlocked || 1)), best: saved.best || {} };
  } catch {
    return { unlocked: 1, best: {} };
  }
};

function CarMark({ small = false }) {
  return (
    <div className={`car-mark ${small ? "car-mark-small" : ""}`}>
      <div className="car-mark-window" />
      <div className="car-mark-stripe" />
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-icon"><Zap size={21} fill="currentColor" /></div>
      <div className="leading-none">
        <div className="font-display text-[22px] font-bold tracking-[.14em] text-white">NITRO<span className="text-neon">RUSH</span></div>
        <div className="mt-1 text-[9px] font-bold tracking-[.36em] text-slate-500">STREET RACING</div>
      </div>
    </div>
  );
}

function LevelCard({ level, locked, best, onClick }) {
  return (
    <button onClick={onClick} disabled={locked} className={`level-card group ${locked ? "level-locked" : ""}`} style={{ "--level-color": level.color }}>
      <div className="level-card-top">
        <span className="level-number">0{level.id}</span>
        {locked ? <ShieldCheck size={17} className="text-slate-600" /> : <span className="level-difficulty">{level.difficulty}</span>}
      </div>
      <div className="level-art">
        <div className="art-road"><i /><i /><i /></div>
        <div className="art-glow" />
        <CarMark />
        {locked && <div className="lock-overlay"><ShieldCheck size={22} /><span>LOCKED</span></div>}
      </div>
      <div className="level-card-bottom">
        <div>
          <div className="text-[9px] font-bold tracking-[.25em] text-slate-500">{level.subtitle}</div>
          <div className="mt-1 font-display text-xl font-bold uppercase tracking-wide text-white">{level.name}</div>
          <div className="mt-1 text-xs text-slate-500">{level.description}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-bold tracking-widest text-slate-600">BEST</div>
          <div className="mt-1 font-display text-lg font-bold text-white">{best ? best.toLocaleString() : "—"}</div>
        </div>
      </div>
      <div className="level-card-footer">
        <span>{locked ? "COMPLETE PREVIOUS STAGE" : "ENTER RACE"}</span>
        {!locked && <ChevronRight size={16} />}
      </div>
    </button>
  );
}

function Stat({ label, value, suffix = "", icon: Icon }) {
  return (
    <div className="hud-stat">
      <div className="flex items-center gap-1.5 text-slate-500"><Icon size={12} /><span>{label}</span></div>
      <div className="mt-1 font-display text-2xl font-bold leading-none text-white">{value}<small>{suffix}</small></div>
    </div>
  );
}

export default function App() {
  const [saved, setSaved] = useState(readSaved);
  const [screen, setScreen] = useState("home");
  const [level, setLevel] = useState(LEVELS[0]);
  const [status, setStatus] = useState("ready");
  const [stats, setStats] = useState({ score: 0, distance: 0, speed: 0, nitro: 100 });
  const [result, setResult] = useState(null);
  const [direction, setDirection] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const controlRef = useRef({ status: "ready", direction: null });

  useEffect(() => {
    controlRef.current = { status, direction };
  }, [status, direction]);

  const persist = (next) => {
    setSaved(next);
    localStorage.setItem("nitro-rush-save", JSON.stringify(next));
  };

  const startLevel = (selected) => {
    setLevel(selected);
    setStats({ score: 0, distance: 0, speed: 0, nitro: 100 });
    setResult(null);
    setDirection(null);
    setStatus("playing");
    controlRef.current = { status: "playing", direction: null };
    setScreen("game");
  };

  const updateProgress = useCallback((next) => setStats((old) => ({ ...old, ...next })), []);

  const crash = useCallback((data) => {
    setResult(data);
    setStatus("crashed");
  }, []);

  const complete = useCallback((data) => {
    setResult(data);
    setStatus("complete");
    const nextUnlocked = Math.min(3, Math.max(saved.unlocked, level.id + 1));
    const best = { ...saved.best, [level.id]: Math.max(saved.best[level.id] || 0, data.score) };
    persist({ unlocked: nextUnlocked, best });
  }, [level, saved]);

  const pause = () => setStatus((s) => s === "playing" ? "paused" : s === "paused" ? "playing" : s);

  useEffect(() => {
    const handler = (e) => {
      if (e.key.toLowerCase() === "p" || e.key === "Escape") {
        if (screen === "game" && (status === "playing" || status === "paused")) pause();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [screen, status]);

  const backHome = () => {
    setScreen("home");
    setStatus("ready");
    setDirection(null);
  };

  const progress = Math.min(100, (stats.distance / level.target) * 100);

  return (
    <main className="app-shell min-h-screen text-white">
      <div className="ambient ambient-one" /><div className="ambient ambient-two" />
      <header className="topbar">
        <Brand />
        <div className="hidden items-center gap-8 md:flex">
          <span className="top-nav active">GARAGE</span>
          <span className="top-nav">CAREER</span>
          <span className="top-nav">LEADERBOARD</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="online-pill"><span /> ONLINE</div>
          <button className="icon-button" aria-label="Toggle sound" onClick={() => setSoundOn(!soundOn)}>
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <div className="profile-chip"><div className="profile-avatar">R</div><span className="hidden sm:inline">RACER</span></div>
        </div>
      </header>

      {screen === "home" ? (
        <div className="home-content">
          <section className="hero-section">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> THE STREETS ARE YOURS</div>
              <h1 className="hero-title">OWN THE<br /><span>FAST</span> LANE<span className="hero-period">.</span></h1>
              <p className="hero-description">Push your limits. Dodge the traffic. Make every second count. Your next street legend starts here.</p>
              <div className="hero-actions">
                <button className="primary-button" onClick={() => startLevel(LEVELS[saved.unlocked - 1])}>
                  <Play size={17} fill="currentColor" /> QUICK RACE <ChevronRight size={17} />
                </button>
                <div className="hero-hint"><Gamepad2 size={16} /><span>KEYBOARD & TOUCH CONTROLS</span></div>
              </div>
              <div className="hero-metrics">
                <div><strong>03</strong><span>RACING STAGES</span></div>
                <div className="metric-divider" />
                <div><strong>∞</strong><span>PURE ADRENALINE</span></div>
                <div className="metric-divider" />
                <div><strong>01</strong><span>ROAD TO GLORY</span></div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="hero-light" />
              <div className="hero-road">
                <div className="hero-road-line" /><div className="hero-road-line" />
                <div className="hero-car"><CarMark /></div>
              </div>
              <div className="hero-speed"><span>TOP SPEED</span><strong>320</strong><small>KM/H</small></div>
              <div className="hero-stamp"><span>NR</span><small>EST. 2024</small></div>
              <div className="hero-visual-label">BUILT FOR THE<br /><b>FEARLESS.</b></div>
            </div>
          </section>

          <section className="levels-section">
            <div className="section-heading">
              <div><div className="eyebrow"><span className="eyebrow-line" /> SELECT YOUR CHALLENGE</div><h2>CHOOSE YOUR <span>STAGE</span></h2></div>
              <div className="career-progress"><Trophy size={16} /><span>CAREER PROGRESS</span><b>{saved.unlocked}/3</b></div>
            </div>
            <div className="level-grid">
              {LEVELS.map((item) => <LevelCard key={item.id} level={item} locked={item.id > saved.unlocked} best={saved.best[item.id]} onClick={() => startLevel(item)} />)}
            </div>
          </section>
          <footer className="home-footer"><span>© 2026 NITRO RUSH RACING</span><span>DESIGNED TO OUTRUN THE ORDINARY <span className="text-neon">✦</span></span><span>V 1.0.0</span></footer>
        </div>
      ) : (
        <div className="race-page">
          <div className="race-toolbar">
            <button className="back-button" onClick={backHome}><ArrowLeft size={16} /> GARAGE</button>
            <div className="race-title"><span>STAGE 0{level.id}</span><strong>{level.name}</strong></div>
            <button className="icon-button" onClick={pause} disabled={status === "crashed" || status === "complete"} aria-label="Pause game">
              {status === "paused" ? <Play size={17} /> : <Pause size={17} />}
            </button>
          </div>
          <div className="race-layout">
            <aside className="race-sidebar">
              <div className="side-label">RACE TELEMETRY</div>
              <Stat label="SCORE" value={stats.score.toLocaleString()} icon={Award} />
              <Stat label="SPEED" value={stats.speed} suffix=" KM/H" icon={Gauge} />
              <Stat label="DISTANCE" value={stats.distance} suffix={` / ${level.target} M`} icon={Activity} />
              <div className="progress-block"><div className="flex justify-between text-[10px] font-bold tracking-widest text-slate-500"><span>STAGE PROGRESS</span><span>{Math.floor(progress)}%</span></div><div className="progress-track"><div style={{ width: `${progress}%`, background: level.color }} /></div></div>
              <div className="nitro-block"><div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400"><Zap size={14} className="text-neon" /> NITRO CHARGE</div><div className="nitro-bars">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i < Math.ceil(stats.nitro / 10) ? "filled" : ""} />)}</div></div>
              <div className="controls-card"><div className="side-label">CONTROLS</div><div className="key-row"><kbd>←</kbd><kbd>→</kbd><span>STEER</span></div><div className="key-row"><kbd>A</kbd><kbd>D</kbd><span>ALTERNATE</span></div><div className="key-row"><kbd>P</kbd><span>PAUSE</span></div></div>
            </aside>
            <section className="game-stage">
              <div className="game-stage-top"><div className="live-indicator"><span /> LIVE RACE</div><div className="stage-weather">NIGHT DRIVE <span>✦</span></div></div>
              <div className="canvas-wrap">
                <GameCanvas level={level} status={status} onProgress={updateProgress} onCrash={crash} onComplete={complete} controlRef={controlRef} />
                {status === "ready" && <div className="game-overlay"><div className="overlay-panel"><span className="overlay-kicker">READY, RACER?</span><h2>LIGHTS.<br /><em>CAMERA.</em><br />NITRO.</h2><button className="primary-button" onClick={() => setStatus("playing")}><Play size={16} fill="currentColor" /> START ENGINE</button></div></div>}
                {status === "paused" && <div className="game-overlay"><div className="overlay-panel compact"><span className="overlay-kicker">TAKE A BREATHER</span><h2>RACE<br /><em>PAUSED.</em></h2><button className="primary-button" onClick={() => setStatus("playing")}><Play size={16} fill="currentColor" /> RESUME RACE</button><button className="text-button" onClick={backHome}>BACK TO GARAGE</button></div></div>}
                {(status === "crashed" || status === "complete") && <div className="game-overlay"><div className="overlay-panel compact">
                  <div className={`result-icon ${status}`} >{status === "complete" ? <Trophy size={25} /> : <Zap size={25} />}</div>
                  <span className="overlay-kicker">{status === "complete" ? "STAGE CLEARED" : "RACE OVER"}</span>
                  <h2>{status === "complete" ? <>YOU<br /><em>DID IT.</em></> : <>WIPED<br /><em>OUT.</em></>}</h2>
                  <div className="result-stats"><div><span>SCORE</span><b>{result?.score?.toLocaleString()}</b></div><div><span>DISTANCE</span><b>{result?.distance} M</b></div></div>
                  {status === "complete" && level.id < 3 ? <button className="primary-button" onClick={() => startLevel(LEVELS[level.id])}>NEXT STAGE <ChevronRight size={17} /></button> : <button className="primary-button" onClick={() => startLevel(level)}><RotateCcw size={16} /> RACE AGAIN</button>}
                  <button className="text-button" onClick={backHome}>BACK TO GARAGE</button>
                </div></div>}
              </div>
              <div className="mobile-controls">
                <button onPointerDown={() => setDirection("left")} onPointerUp={() => setDirection(null)} onPointerLeave={() => setDirection(null)} onPointerCancel={() => setDirection(null)} aria-label="Steer left"><ArrowLeft /></button>
                <span>HOLD TO STEER</span>
                <button onPointerDown={() => setDirection("right")} onPointerUp={() => setDirection(null)} onPointerLeave={() => setDirection(null)} onPointerCancel={() => setDirection(null)} aria-label="Steer right"><ArrowRight /></button>
              </div>
              <div className="game-stage-footer"><span><span className="text-neon">●</span> CONNECTION STABLE</span><span>ROAD CONDITIONS: CLEAR</span><span>ENGINE: V8 TURBO</span></div>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}
