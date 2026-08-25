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
