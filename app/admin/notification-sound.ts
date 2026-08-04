export type WorkspacePreferences = {
  monochrome: boolean;
  sounds: boolean;
  reducedMotion: boolean;
  compact: boolean;
  soundName?: string;
  soundData?: string;
};

export const defaultPreferences: WorkspacePreferences = {
  monochrome: false,
  sounds: true,
  reducedMotion: false,
  compact: false,
};

export function playNotificationSound(soundData?: string) {
  if (soundData) {
    const audio = new Audio(soundData);
    audio.volume = 1;
    void audio.play().catch(() => playDefaultNotificationSound());
    return;
  }
  playDefaultNotificationSound();
}

function playDefaultNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext ||
      (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.38, context.currentTime + 0.018);
    master.gain.setValueAtTime(0.38, context.currentTime + 0.14);
    master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.48);
    master.connect(context.destination);

    [740, 988].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const voice = context.createGain();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.12, context.currentTime + 0.2);
      voice.gain.value = index === 0 ? 0.85 : 0.42;
      oscillator.connect(voice);
      voice.connect(master);
      oscillator.start(context.currentTime + index * 0.035);
      oscillator.stop(context.currentTime + 0.5);
    });
    window.setTimeout(() => void context.close(), 650);
  } catch {
    // Some browsers block audio until the user interacts with the page.
  }
}
