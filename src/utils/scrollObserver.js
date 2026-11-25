/**
 * Observador de scroll para compactar la barra de navegación y revelar secciones con IntersectionObserver.
 */

export function initScrollObserver() {
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('site-header--scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const revealTargets = Array.from(document.querySelectorAll('.reveal'));
  if (revealTargets.length === 0) return;

  const prefersReduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced || typeof IntersectionObserver === 'undefined') {
    for (const el of revealTargets) {
      el.classList.add('reveal--visible');
    }
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.remove('reveal--pending');
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
  );

  for (const el of revealTargets) {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      el.classList.add('reveal--visible');
    } else {
      el.classList.add('reveal--pending');
      observer.observe(el);
    }
  }
}
