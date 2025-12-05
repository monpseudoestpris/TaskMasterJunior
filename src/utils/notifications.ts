let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext && typeof window !== "undefined") {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const initAudio = () => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
};

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }
  if (Notification.permission !== "denied") {
    await Notification.requestPermission();
  }
};

export const sendNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
};

export const playSound = (type: "success" | "alert" | "overdue" | "add" | "overdue2") => {
  // Map types to specific filenames if needed
  let filename = type;
  if (type === "success") {
    filename = "fireworks";
  }

  // Try to play the MP3 file first
  const audio = new Audio(`/sounds/${filename}.mp3`);
  
  audio.play().catch((err) => {
    console.warn(`[Audio] Could not play /sounds/${filename}.mp3, falling back to synth.`, err);
    playSynthSound(type);
  });
};

const playSynthSound = (type: "success" | "alert" | "overdue" | "add" | "overdue2") => {
  const ctx = getAudioContext();
  if (!ctx) return;

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  if (type === "success") {
    // Victory fanfare (Ta-da!)
    oscillator.type = "triangle";
    const now = ctx.currentTime;
    
    // Rapid arpeggio C5-E5-G5-C6 (Fanfare style)
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
    oscillator.frequency.setValueAtTime(1046.50, now + 0.3); // C6
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.setValueAtTime(0.1, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
    
    oscillator.start();
    oscillator.stop(now + 1.0);
  } else if (type === "add") {
    // Add task sound (Short rising pop)
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.1);
  } else if (type === "alert") {
    // Alert sound (Two beeps)
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.setValueAtTime(0, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  } else {
    // Overdue sound (Annoying siren)
    oscillator.type = "sawtooth";
    
    // Siren effect (High-Low-High-Low)
    const now = ctx.currentTime;
    oscillator.frequency.setValueAtTime(900, now);
    oscillator.frequency.linearRampToValueAtTime(400, now + 0.2);
    oscillator.frequency.linearRampToValueAtTime(900, now + 0.4);
    oscillator.frequency.linearRampToValueAtTime(400, now + 0.6);
    oscillator.frequency.linearRampToValueAtTime(900, now + 0.8);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.linearRampToValueAtTime(0.001, now + 1.0);
    
    oscillator.start();
    oscillator.stop(now + 1.0);
  }
};
