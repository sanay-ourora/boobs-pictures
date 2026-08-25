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
const finePointer = matchMedia('(pointer: fine)');
const soundControl = document.querySelector('.sound-control');
const soundRange = document.querySelector('.sound-range');
const soundMute = document.querySelector('.sound-mute');
const presenceFadeDuration = 5000;
const pagePresence = { pointer: true, visible: !document.hidden };

const announcePagePresence = () => {
  document.dispatchEvent(new CustomEvent('pagepresencechange', {
    detail: { present: pagePresence.pointer && pagePresence.visible },
  }));
};

document.documentElement.addEventListener('pointerenter', () => {
  pagePresence.pointer = true;
  announcePagePresence();
});
document.documentElement.addEventListener('pointerleave', () => {
  pagePresence.pointer = false;
  announcePagePresence();
});
document.addEventListener('visibilitychange', () => {
  pagePresence.visible = !document.hidden;
  announcePagePresence();
});

if (soundControl && soundRange && soundMute && finePointer.matches) {
  let audioContext;
  let birdsong;
  let soundGain;
  let soundPanner;
  let soundIsPresent = true;
  let pauseTimer;
  let previousVolume = 50;

  const updateSoundDisplay = (value) => {
    soundControl.style.setProperty('--sound-level', `${value}%`);
    soundControl.dataset.active = String(value > 0);
    soundControl.dataset.present = String(soundIsPresent);
    if (!birdsong) soundControl.dataset.playing = 'false';
    soundMute.setAttribute('aria-pressed', String(value === 0));
    soundMute.setAttribute('aria-label', value ? 'Mute birdsong' : `Restore birdsong volume to ${previousVolume} percent`);
    soundRange.setAttribute('aria-valuetext', value ? `${value} percent` : 'Muted');
  };

  const prepareBirdsong = () => {
    if (birdsong) return;

    birdsong = new Audio('assets/birds.wav');
    birdsong.loop = true;
    birdsong.preload = 'auto';
    birdsong.volume = 1;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    audioContext = new AudioContextClass();
    const source = audioContext.createMediaElementSource(birdsong);
    soundGain = audioContext.createGain();
    soundPanner = audioContext.createStereoPanner?.();
    soundGain.gain.value = 0;

    if (soundPanner) {
      source.connect(soundGain).connect(soundPanner).connect(audioContext.destination);
    } else {
      source.connect(soundGain).connect(audioContext.destination);
    }
  };

  soundRange.addEventListener('input', async () => {
    const value = Number(soundRange.value);
    const level = value / 100;
    if (value) previousVolume = value;
    updateSoundDisplay(value);

    if (!value) {
      if (soundGain && audioContext) {
        const mutedAt = audioContext.currentTime;
        soundGain.gain.cancelScheduledValues(mutedAt);
        soundGain.gain.setTargetAtTime(0, mutedAt, 0.025);
      }
      birdsong?.pause();
      soundControl.dataset.playing = 'false';
      return;
    }

    prepareBirdsong();
    if (audioContext?.state === 'suspended') await audioContext.resume();
    if (soundGain && audioContext) {
      soundGain.gain.setTargetAtTime(soundIsPresent ? level : 0, audioContext.currentTime, 0.035);
    } else if (birdsong) {
      birdsong.volume = soundIsPresent ? level : 0;
    }

    if (soundIsPresent && birdsong?.paused) {
      try {
        await birdsong.play();
        soundControl.dataset.playing = 'true';
      } catch {
        soundRange.value = '0';
        updateSoundDisplay(0);
      }
    }
  });

  soundMute.addEventListener('click', () => {
    const currentVolume = Number(soundRange.value);
    if (currentVolume) previousVolume = currentVolume;
    soundRange.value = String(currentVolume ? 0 : previousVolume);
    soundRange.dispatchEvent(new Event('input', { bubbles: true }));
  });

  addEventListener('pointermove', (event) => {
    if (!soundPanner || !audioContext) return;
    const pan = (event.clientX / Math.max(innerWidth, 1)) * 2 - 1;
    soundPanner.pan.setTargetAtTime(pan, audioContext.currentTime, 0.08);
  }, { passive: true });

  document.addEventListener('pagepresencechange', async (event) => {
    soundIsPresent = event.detail.present;
    soundControl.dataset.present = String(soundIsPresent);
    clearTimeout(pauseTimer);

    if (!birdsong || !Number(soundRange.value)) return;

    if (!soundIsPresent) {
      if (soundGain && audioContext) {
        const startedAt = audioContext.currentTime;
        soundGain.gain.cancelScheduledValues(startedAt);
        soundGain.gain.setValueAtTime(soundGain.gain.value, startedAt);
        soundGain.gain.linearRampToValueAtTime(0, startedAt + presenceFadeDuration / 1000);
      } else {
        birdsong.volume = 0;
      }
      pauseTimer = setTimeout(() => {
        birdsong.pause();
        soundControl.dataset.playing = 'false';
      }, presenceFadeDuration + 100);
      return;
    }

    if (audioContext?.state === 'suspended') await audioContext.resume();
    if (birdsong.paused) {
      try {
        await birdsong.play();
        soundControl.dataset.playing = 'true';
      } catch {
        return;
      }
    }

    const level = Number(soundRange.value) / 100;
    if (soundGain && audioContext) {
      const resumedAt = audioContext.currentTime;
      soundGain.gain.cancelScheduledValues(resumedAt);
      soundGain.gain.setValueAtTime(soundGain.gain.value, resumedAt);
      soundGain.gain.setTargetAtTime(level, resumedAt, 0.11);
    } else {
      birdsong.volume = level;
    }
  });

  updateSoundDisplay(0);
}

if (cursorCanvas && finePointer.matches && !reducedMotion.matches) {
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
  let pageIsPresent = true;
  let presenceFadeStarted = 0;
  let presenceFadeStartAlpha = 0;

  const birds = Array.from({ length: birdCount }, (_, index) => ({
    x: pointer.x,
    y: pointer.y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    phase: Math.random() * Math.PI * 2,
    radius: 22 + Math.sqrt(index / birdCount) * 100 + Math.random() * 18,
    size: 2.2 + Math.random() * 1.4,
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
  document.addEventListener('pagepresencechange', (event) => {
    pageIsPresent = event.detail.present;
    if (pageIsPresent) {
      presenceFadeStarted = 0;
    } else {
      presenceFadeStarted = performance.now();
      presenceFadeStartAlpha = flockAlpha;
    }
  });
  addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch') return;

    const movement = Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
    pointer.speed = pointer.speed * 0.72 + movement * 0.28;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    interactiveTarget = event.target instanceof Element && Boolean(event.target.closest('a, button, input'));

    if (!lastPointerMove) scatterFlock();
    lastPointerMove = performance.now();
  }, { passive: true });

  const drawBird = (bird, index, now) => {
    const direction = Math.atan2(bird.vy, bird.vx);
    const wingLift = 0.9 + Math.sin(now * 0.012 + bird.phase) * 0.38;
    const opacity = flockAlpha * (0.34 + (index % 9) * 0.055);
    const size = bird.size;

    context.save();
    context.translate(bird.x, bird.y);
    context.rotate(direction);
    context.globalAlpha = Math.min(opacity, flockAlpha);
    context.lineJoin = 'round';

    context.beginPath();
    context.moveTo(-1.65 * size, 0);
    context.lineTo(-2.2 * size, -0.62 * size);
    context.lineTo(-1.25 * size, -0.28 * size);
    context.bezierCurveTo(-0.55 * size, -0.7 * size, 0.72 * size, -0.58 * size, 1.25 * size, -0.12 * size);
    context.lineTo(2.05 * size, 0);
    context.lineTo(1.25 * size, 0.24 * size);
    context.bezierCurveTo(0.52 * size, 0.72 * size, -0.7 * size, 0.68 * size, -1.65 * size, 0);
    context.closePath();
    context.fillStyle = '#11d7f3';
    context.strokeStyle = 'rgba(3,13,19,.68)';
    context.lineWidth = 0.62;
    context.fill();
    context.stroke();

    context.beginPath();
    context.moveTo(-0.7 * size, -0.08 * size);
    context.quadraticCurveTo(-0.2 * size, -2.2 * size * wingLift, 0.9 * size, -0.7 * size * wingLift);
    context.quadraticCurveTo(0.38 * size, -0.2 * size, -0.7 * size, -0.08 * size);
    context.closePath();
    context.fillStyle = 'rgba(234,240,235,.9)';
    context.fill();
    context.stroke();
    context.restore();
  };

  const animateFlock = (now) => {
    const frameScale = Math.min((now - previousFrame) / 16.67, 2);
    const pointerIsMoving = now - lastPointerMove < 180;
    const targetAlpha = lastPointerMove && pageIsPresent ? (pointerIsMoving ? 1 : 0.76) : 0;
    if (!pageIsPresent && presenceFadeStarted) {
      const fadeProgress = Math.min((now - presenceFadeStarted) / presenceFadeDuration, 1);
      flockAlpha = presenceFadeStartAlpha * (1 - fadeProgress);
    } else {
      flockAlpha += (targetAlpha - flockAlpha) * 0.075 * frameScale;
    }
    pointer.speed *= Math.pow(0.92, frameScale);
    previousFrame = now;

    context.clearRect(0, 0, width, height);

    if (flockAlpha > 0.008) {
      birds.forEach((bird, index) => {
        const spread = interactiveTarget ? 1.36 : 1;
        const holdingPattern = pointerIsMoving ? 0.72 : 1;
        const orbit = now * bird.orbitSpeed * (pointerIsMoving ? 0.7 : 1.18) + bird.phase;
        const wobble = 1 + Math.sin(now * 0.0011 + bird.phase * 2.3) * 0.09;
        const targetX = pointer.x + Math.cos(orbit) * bird.radius * spread * holdingPattern * wobble;
        const targetY = pointer.y + Math.sin(orbit * 1.13) * bird.radius * 0.72 * spread * holdingPattern;
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
