/* =========================================================
   SEMYON · AI VISUALS — interactions
   Lean, rAF-driven, passive listeners
   ========================================================= */

(() => {
  const body = document.body;
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- LOADER + INTRO ----- */
  const loader = document.getElementById('loader');
  const startedAt = performance.now();
  const minDuration = 1700;         // total loader life — matches CSS animation

  const finishIntro = () => {
    if (!loader) return;
    loader.classList.add('done');
    body.classList.remove('is-loading');
    body.classList.add('intro-done');     // triggers staggered hero reveal
  };

  const start = () => {
    const elapsed = performance.now() - startedAt;
    const wait = Math.max(minDuration - elapsed, 0);
    setTimeout(finishIntro, wait);
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });

  // Failsafe
  setTimeout(finishIntro, 3000);

  /* ----- DOM ready interactions ----- */
  document.addEventListener('DOMContentLoaded', () => {

    /* Header scrolled state — throttled with rAF */
    const header = document.querySelector('.header');
    let lastY = window.scrollY;
    let scrollTicking = false;
    const updateHeader = () => {
      if (header) header.classList.toggle('scrolled', lastY > 30);
      scrollTicking = false;
    };
    window.addEventListener('scroll', () => {
      lastY = window.scrollY;
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(updateHeader);
      }
    }, { passive: true });
    updateHeader();

    /* Reveal on scroll — IntersectionObserver, no JS-driven delays */
    const revealEls = document.querySelectorAll('.reveal, .reveal-up');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
      revealEls.forEach(el => io.observe(el));
    } else {
      revealEls.forEach(el => el.classList.add('is-in'));
    }

    /* Counters */
    const counters = document.querySelectorAll('.stat-num[data-count]');
    const counted = new WeakSet();
    if ('IntersectionObserver' in window) {
      const cIo = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting && !counted.has(e.target)) {
            counted.add(e.target);
            animateCount(e.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(c => cIo.observe(c));
    } else {
      counters.forEach(animateCount);
    }

    function animateCount(el) {
      if (reduceMotion) {
        el.textContent = el.dataset.count + (el.dataset.suffix || '');
        return;
      }
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1400;
      const start = performance.now();
      const step = now => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.floor(eased * target) + (t === 1 ? suffix : '');
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    /* Service cards: glow follows cursor (rAF-throttled, desktop only) */
    if (!isCoarse && !reduceMotion) {
      document.querySelectorAll('.service-card, .feature').forEach(card => {
        let frame = null;
        const onMove = (e) => {
          if (frame) return;
          frame = requestAnimationFrame(() => {
            frame = null;
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
            card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
          });
        };
        card.addEventListener('mousemove', onMove, { passive: true });
      });
    }

    /* Modals — feature details */
    const modalRoot = document.getElementById('modalRoot');
    if (modalRoot) {
      const modals = modalRoot.querySelectorAll('.modal');
      const triggers = document.querySelectorAll('[data-modal]');

      const openModal = (id) => {
        const target = modalRoot.querySelector(`[data-modal-id="${id}"]`);
        if (!target) return;
        modals.forEach(m => m.classList.remove('is-active'));
        target.classList.add('is-active');
        modalRoot.classList.add('is-open');
        document.body.classList.add('modal-open');
      };

      const closeModal = () => {
        modalRoot.classList.remove('is-open');
        document.body.classList.remove('modal-open');
        // Clear active flag after fade-out finishes
        setTimeout(() => {
          modals.forEach(m => m.classList.remove('is-active'));
        }, 450);
      };

      triggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openModal(btn.dataset.modal);
        });
      });

      modalRoot.querySelectorAll('[data-close]').forEach(el => {
        el.addEventListener('click', closeModal);
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalRoot.classList.contains('is-open')) {
          closeModal();
        }
      });
    }

    /* Smooth anchor scroll with offset */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length <= 1) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
  });
})();
