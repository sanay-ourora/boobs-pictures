const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.scroll-reveal').forEach((el) => revealObserver.observe(el));

const factLine = document.querySelector('.fact-line');
const factNumbers = [...document.querySelectorAll('.fact-number[data-value]')];
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

const cursorCanvas = document.querySelector('.cursor-flock');
const soundToggle = document.querySelector('.sound-toggle');
const finePointer = matchMedia('(pointer: fine)');

if (cursorCanvas && soundToggle && finePointer.matches && !reducedMotion.matches) {
  const context = cursorCanvas.getContext('2d');
  const birdCount = 69;
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, speed: 0 };
  let width = innerWidth;
  let height = innerHeight;
  let pixelRatio = 1;
  let flockAlpha = 0;
  let lastPointerMove = 0;
  let previousFrame = performance.now();
  let interactiveTarget = false;
  let audioContext;
  let soundEnabled = false;
  let lastChirp = 0;

  const birds = Array.from({ length: birdCount }, (_, index) => ({
    x: pointer.x,
    y: pointer.y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    phase: Math.random() * Math.PI * 2,
    radius: 22 + Math.sqrt(index / birdCount) * 100 + Math.random() * 18,
    size: 2.4 + Math.random() * 2.7,
    orbitSpeed: 0.00042 + Math.random() * 0.00036,
  }));

  const resizeCursorCanvas = () => {
    width = innerWidth;
    height = innerHeight;
    pixelRatio = Math.min(devicePixelRatio || 1, 2);
    cursorCanvas.width = Math.round(width * pixelRatio);
    cursorCanvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const scatterFlock = () => {
    birds.forEach((bird) => {
      bird.x = pointer.x + (Math.random() - 0.5) * 130;
      bird.y = pointer.y + (Math.random() - 0.5) * 90;
    });
  };

  addEventListener('resize', resizeCursorCanvas, { passive: true });
  addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;

    const movement = Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
    pointer.speed = pointer.speed * 0.72 + movement * 0.28;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    interactiveTarget = event.target instanceof Element && Boolean(event.target.closest('a, button'));

    if (!lastPointerMove) scatterFlock();
    lastPointerMove = performance.now();
  }, { passive: true });

  const drawBird = (bird, index, now) => {
    const direction = Math.atan2(bird.vy, bird.vx);
    const wingLift = Math.sin(now * 0.012 + bird.phase) * bird.size * 0.72;
    const wingSpan = bird.size * 2.1;
    const opacity = flockAlpha * (0.34 + (index % 9) * 0.055);

    context.save();
    context.translate(bird.x, bird.y);
    context.rotate(direction);
    context.globalAlpha = Math.min(opacity, flockAlpha);
    context.lineCap = 'round';
    context.lineJoin = 'round';

    const traceWings = () => {
      context.beginPath();
      context.moveTo(-wingSpan, 0);
      context.quadraticCurveTo(-wingSpan * 0.46, -wingLift, 0, 0);
      context.quadraticCurveTo(wingSpan * 0.46, -wingLift, wingSpan, 0);
      context.stroke();
    };

    context.strokeStyle = 'rgba(3,13,19,.88)';
    context.lineWidth = 3.2;
    traceWings();
    context.strokeStyle = '#11d7f3';
    context.lineWidth = 1.25;
    traceWings();
    context.restore();
  };

  const chirp = (now) => {
    if (!soundEnabled || !audioContext || pointer.speed < 3 || now - lastChirp < 1450) return;

    lastChirp = now;
    const startedAt = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const panner = audioContext.createStereoPanner?.();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(820 + Math.random() * 180, startedAt);
    oscillator.frequency.exponentialRampToValueAtTime(1380 + Math.random() * 220, startedAt + 0.11);
    gain.gain.setValueAtTime(0.0001, startedAt);
    gain.gain.exponentialRampToValueAtTime(0.022, startedAt + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + 0.14);

    if (panner) {
      panner.pan.value = (pointer.x / Math.max(width, 1)) * 2 - 1;
      oscillator.connect(gain).connect(panner).connect(audioContext.destination);
    } else {
      oscillator.connect(gain).connect(audioContext.destination);
    }

    oscillator.start(startedAt);
    oscillator.stop(startedAt + 0.15);
  };

  soundToggle.addEventListener('click', async () => {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === 'suspended') await audioContext.resume();
    soundEnabled = !soundEnabled;
    soundToggle.setAttribute('aria-pressed', String(soundEnabled));
    soundToggle.setAttribute('aria-label', soundEnabled ? 'Disable birdsong' : 'Enable birdsong');
    soundToggle.lastChild.textContent = soundEnabled ? ' Birdsong on' : ' Birdsong off';
  });

  const animateFlock = (now) => {
    const frameScale = Math.min((now - previousFrame) / 16.67, 2);
    const pointerIsActive = now - lastPointerMove < 1500;
    const targetAlpha = pointerIsActive ? 1 : 0;
    flockAlpha += (targetAlpha - flockAlpha) * 0.075 * frameScale;
    pointer.speed *= Math.pow(0.92, frameScale);
    previousFrame = now;

    context.clearRect(0, 0, width, height);

    if (flockAlpha > 0.008) {
      birds.forEach((bird, index) => {
        const spread = interactiveTarget ? 1.36 : 1;
        const orbit = now * bird.orbitSpeed + bird.phase;
        const targetX = pointer.x + Math.cos(orbit) * bird.radius * spread;
        const targetY = pointer.y + Math.sin(orbit * 1.17) * bird.radius * 0.68 * spread;
        const pull = (0.0052 + (index % 7) * 0.00034) * frameScale;

        bird.vx += (targetX - bird.x) * pull;
        bird.vy += (targetY - bird.y) * pull;
        bird.vx *= Math.pow(0.91, frameScale);
        bird.vy *= Math.pow(0.91, frameScale);

        const speed = Math.hypot(bird.vx, bird.vy);
        const maxSpeed = interactiveTarget ? 6.2 : 5.2;
        if (speed > maxSpeed) {
          bird.vx *= maxSpeed / speed;
          bird.vy *= maxSpeed / speed;
        }

        bird.x += bird.vx * frameScale;
        bird.y += bird.vy * frameScale;
        drawBird(bird, index, now);
      });

      chirp(now);
    }

    requestAnimationFrame(animateFlock);
  };

  resizeCursorCanvas();
  requestAnimationFrame(animateFlock);
}

if (factLine && factNumbers.length && !reducedMotion.matches) {
  const factObserver = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;

    factNumbers.forEach((number) => {
      number.textContent = '00';
    });

    const animateNumber = (number, duration) => new Promise((resolve) => {
      const target = Number(number.dataset.value);
      const startedAt = performance.now();
      number.style.setProperty('--count-duration', `${duration}ms`);

      const count = (now) => {
        number.classList.add('is-counting');
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(target * eased);
        number.textContent = String(value).padStart(2, '0');

        if (progress < 1) {
          requestAnimationFrame(count);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(count);
    });

    const runSequence = async () => {
      const durations = [860, 960, 500];

      await new Promise((resolve) => setTimeout(resolve, 640));

      for (let index = 0; index < factNumbers.length; index += 1) {
        await animateNumber(factNumbers[index], durations[index]);
        if (index < factNumbers.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 140));
        }
      }
    };

    runSequence();
    factObserver.unobserve(factLine);
  }, { threshold: 0.4 });

  factObserver.observe(factLine);
}

const card = document.querySelector('.map-card');
document.querySelectorAll('.pin').forEach((pin, index) => {
  pin.addEventListener('click', () => {
    document.querySelectorAll('.pin').forEach((item) => item.classList.remove('active'));
    pin.classList.add('active');
    card.innerHTML = `<span>SIGHTING ${String(index + 1).padStart(2, '0')}</span><strong>${pin.dataset.place}</strong><i>${pin.dataset.species}</i>`;
    const map = document.querySelector('.map-shell').getBoundingClientRect();
    const dot = pin.getBoundingClientRect();
    card.style.left = `${Math.min(dot.left - map.left + 20, map.width - card.offsetWidth - 16)}px`;
    card.style.top = `${Math.min(dot.top - map.top + 20, map.height - card.offsetHeight - 48)}px`;
  });
});

const hero = document.querySelector('.hero');
const heroMedia = document.querySelector('.hero-media');
const heroCopy = document.querySelector('.hero-copy');
let pointerX = 0;
let pointerY = 0;
let scrollShift = 0;

const renderHeroDepth = () => {
  heroMedia.style.transform = `scale(1.045) translate3d(${pointerX}px, ${pointerY + scrollShift}px, 0)`;
};

hero.addEventListener('pointermove', (event) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  pointerX = (event.clientX / innerWidth - 0.5) * 10;
  pointerY = (event.clientY / innerHeight - 0.5) * 7;
  renderHeroDepth();
});

let scrollFrame;
addEventListener('scroll', () => {
  if (scrollFrame || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  scrollFrame = requestAnimationFrame(() => {
    const progress = Math.min(scrollY / Math.max(innerHeight, 1), 1);
    scrollShift = progress * 34;
    heroCopy.style.transform = `translate3d(0, ${progress * 46}px, 0)`;
    heroCopy.style.opacity = String(1 - progress * 0.72);
    renderHeroDepth();
    scrollFrame = null;
  });
}, { passive: true });
