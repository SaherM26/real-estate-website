const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const counters = document.querySelectorAll('[data-count]');

const animateCounters = () => {
  counters.forEach((counter) => {
    const rawTarget = counter.getAttribute('data-count') || '0';
    const target = Number.parseInt(rawTarget, 10);
    const suffix = rawTarget.replace(String(target), '');
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));

    const tick = () => {
      current = Math.min(target, current + step);
      counter.textContent = `${current}${suffix}`;
      if (current < target) {
        requestAnimationFrame(tick);
      }
    };

    tick();
  });
};

if (counters.length) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounters();
          obs.disconnect();
        }
      });
    },
    { threshold: 0.35 }
  );

  observer.observe(counters[0]);
}

const revealTargets = document.querySelectorAll(
  '.section-head, .intro-grid, .service-grid article, .property-card, .report-stack article, .panel-card, .detail-card, .team-card, .contact-form-panel, .filters-panel, .agent-card, .property-detail-card'
);

revealTargets.forEach((element) => {
  element.classList.add('reveal');
});

if (revealTargets.length) {
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.16,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  revealTargets.forEach((element) => {
    revealObserver.observe(element);
  });
}

document.querySelectorAll('.contact-form').forEach((form) => {
  const formNote = form.querySelector('.form-note');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (formNote) {
      formNote.textContent = 'Thank you. Your inquiry has been received and is ready for CRM integration.';
    }
  });
});

const filterButtons = document.querySelectorAll('[data-filter]');
const filterCards = document.querySelectorAll('.property-results .property-card');

if (filterButtons.length && filterCards.length) {
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter') || 'all';

      filterButtons.forEach((item) => item.classList.remove('is-active'));
      button.classList.add('is-active');

      filterCards.forEach((card) => {
        const types = (card.getAttribute('data-type') || '').split(' ');
        const shouldShow = filter === 'all' || types.includes(filter);
        card.classList.toggle('is-hidden', !shouldShow);
      });
    });
  });
}
