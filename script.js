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
hero.addEventListener('pointermove', (event) => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const x = (event.clientX / innerWidth - 0.5) * 10;
  const y = (event.clientY / innerHeight - 0.5) * 7;
  heroMedia.style.transform = `scale(1.045) translate(${x}px, ${y}px)`;
});

