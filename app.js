const timerEl = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const statusEl = document.getElementById('status');
const cycleEl = document.getElementById('cycleCount');
const progressBar = document.getElementById('progressBar');
const modeBtns = document.querySelectorAll('.mode');

let totalSeconds = 25 * 60;
let remaining = totalSeconds;
let intervalId = null;
let currentMode = 'focus';
let cycles = 0;

function format(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function render() {
  timerEl.textContent = format(remaining);
  document.title = `${format(remaining)} - Pomodoro`;
  const pct = ((totalSeconds - remaining) / totalSeconds) * 100;
  progressBar.style.width = `${pct}%`;
}

function setMode(mode, minutes) {
  pause();
  currentMode = mode;
  totalSeconds = minutes * 60;
  remaining = totalSeconds;
  document.body.classList.remove('short', 'long');
  if (mode === 'short') document.body.classList.add('short');
  if (mode === 'long') document.body.classList.add('long');
  modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  statusEl.textContent = mode === 'focus' ? 'Time to focus.' : 'Take a break.';
  render();
}

function start() {
  if (intervalId) return;
  if (Notification && Notification.permission === 'default') Notification.requestPermission();
  startBtn.textContent = 'Pause';
  statusEl.textContent = currentMode === 'focus' ? 'Focusing...' : 'Breathing...';
  intervalId = setInterval(() => {
    remaining--;
    render();
    if (remaining <= 0) finish();
  }, 1000);
}

function pause() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  startBtn.textContent = 'Start';
}

function reset() {
  pause();
  remaining = totalSeconds;
  statusEl.textContent = 'Ready.';
  render();
}

function notify(title, body) {
  try {
    if (Notification && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  } catch (e) {}
  beep();
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {}
}

function finish() {
  pause();
  if (currentMode === 'focus') {
    cycles++;
    cycleEl.textContent = cycles;
    notify('Focus complete!', 'Time for a break.');
    const nextMode = cycles % 4 === 0 ? 'long' : 'short';
    const mins = nextMode === 'long' ? 15 : 5;
    setMode(nextMode, mins);
  } else {
    notify('Break over!', 'Back to focus.');
    setMode('focus', 25);
  }
}

startBtn.addEventListener('click', () => intervalId ? pause() : start());
resetBtn.addEventListener('click', reset);
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode, parseInt(btn.dataset.minutes, 10)));
});

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target.tagName !== 'BUTTON') {
    e.preventDefault();
    intervalId ? pause() : start();
  }
});

render();
