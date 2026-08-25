const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.scroll-reveal').forEach((el) => revealObserver.observe(el));

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
