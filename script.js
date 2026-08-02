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

const configured = typeof window.supabase !== 'undefined'
  && typeof window.SUPABASE_URL === 'string'
  && typeof window.SUPABASE_ANON_KEY === 'string'
  && !window.SUPABASE_URL.includes('YOUR_')
  && !window.SUPABASE_ANON_KEY.includes('YOUR_');

const db = configured
  ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
  : null;

const formatPrice = (price) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0
}).format(Number(price));

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const buildCard = (property) => `
  <article class="property-card" data-type="${escapeHtml(property.property_type)}">
    <img src="${escapeHtml(property.image_url)}" alt="${escapeHtml(property.title)}">
    <div class="property-content">
      <div class="property-topline"><span>${escapeHtml(property.location)}</span><strong>${formatPrice(property.price)}</strong></div>
      <h3>${escapeHtml(property.title)}</h3>
      <p>${escapeHtml(property.description)}</p>
      <ul class="pill-list"><li>${property.bedrooms} Beds</li><li>${property.bathrooms} Baths</li><li>${Number(property.area_sqft).toLocaleString()} sq ft</li></ul>
      <div class="property-actions"><a class="property-link" href="property-detail.html?slug=${encodeURIComponent(property.slug)}">View details</a><span class="listing-badge">${property.featured ? 'Featured' : 'Available'}</span></div>
    </div>
  </article>`;

const loadProperties = async () => {
  const list = document.querySelector('.property-results');
  if (!db || !list) return;
  const { data, error } = await db.from('properties')
    .select('*')
    .eq('status', 'available')
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });
  if (!error && data?.length) list.innerHTML = data.map(buildCard).join('');
};

const loadPropertyDetail = async () => {
  const title = document.querySelector('[data-detail-title]');
  if (!db || !title) return;
  const slug = new URLSearchParams(window.location.search).get('slug');
  if (!slug) return;
  const { data: property, error } = await db.from('properties').select('*').eq('slug', slug).single();
  if (error || !property) return;
      document.title = `${property.title} | Nestora Realty Advisory`;
  title.textContent = property.title;
  document.querySelector('[data-detail-lead]').textContent = `${property.location} · ${property.bedrooms} beds · ${property.bathrooms} baths · ${Number(property.area_sqft).toLocaleString()} sq ft`;
  const image = document.querySelector('[data-detail-image]');
  if (image) {
    image.src = property.image_url;
    image.alt = property.title;
  }
  const price = document.querySelector('[data-detail-price]');
  if (price) price.textContent = formatPrice(property.price);
  const specs = document.querySelector('[data-detail-specs]');
  if (specs) specs.innerHTML = `<li>${property.bedrooms} Bedrooms</li><li>${property.bathrooms} Bathrooms</li><li>${Number(property.area_sqft).toLocaleString()} sq ft internal area</li><li>${escapeHtml(property.location)}</li><li>${escapeHtml(property.property_type)} property</li>`;
  const heading = document.querySelector('[data-detail-heading]');
  if (heading) heading.textContent = `${property.title}: a considered property opportunity.`;
  const description = document.querySelector('[data-detail-description]');
  if (description) description.textContent = property.description;
};

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
      if (current < target) requestAnimationFrame(tick);
    };
    tick();
  });
};

if (counters.length) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounters();
        obs.disconnect();
      }
    });
  }, { threshold: 0.35 });
  observer.observe(counters[0]);
}

const revealTargets = document.querySelectorAll('.section-head, .intro-grid, .service-grid article, .property-card, .report-stack article, .panel-card, .detail-card, .team-card, .contact-form-panel, .filters-panel, .agent-card, .property-detail-card');
revealTargets.forEach((element) => element.classList.add('reveal'));
if (revealTargets.length) {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -40px 0px' });
  revealTargets.forEach((element) => observer.observe(element));
}

document.querySelectorAll('.contact-form').forEach((form) => {
  const note = form.querySelector('.form-note');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Array.from(form.querySelectorAll('input, select, textarea')).map((field) => field.value.trim());
    if (!values[0] || !values[1]) {
      if (note) note.textContent = 'Please enter your name and email address.';
      return;
    }
    if (!db) {
      if (note) note.textContent = 'Form demo is ready. Add your Supabase credentials in supabase-config.js to save live inquiries.';
      return;
    }
    const { error } = await db.from('inquiries').insert({
      name: values[0], email: values[1], phone: values[2] || null,
      service: values[3] || null, location_preference: values[4] || null,
      message: values[5] || null,
      source_page: window.location.pathname.split('/').pop() || 'index.html'
    });
    if (error) {
      if (note) note.textContent = 'We could not send your inquiry. Please try again shortly.';
      return;
    }
    form.reset();
    if (note) note.textContent = 'Thank you. Your inquiry has been received and an advisor will be in touch.';
  });
});

const filters = document.querySelectorAll('[data-filter]');
filters.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.getAttribute('data-filter') || 'all';
    filters.forEach((item) => item.classList.remove('is-active'));
    button.classList.add('is-active');
    document.querySelectorAll('.property-results .property-card').forEach((card) => {
      const types = (card.getAttribute('data-type') || '').split(' ');
      card.classList.toggle('is-hidden', filter !== 'all' && !types.includes(filter));
    });
  });
});

const initAdmin = async () => {
  const loginPanel = document.querySelector('[data-admin-login]');
  const dashboard = document.querySelector('[data-admin-dashboard]');
  if (!loginPanel || !dashboard) return;
  const loginNote = document.querySelector('[data-login-note]');
  if (!db) {
    if (loginNote) loginNote.textContent = 'Add your Supabase URL and anon key in supabase-config.js before signing in.';
    return;
  }

  const loadDashboard = async () => {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    const [properties, inquiries] = await Promise.all([
      db.from('properties').select('*').order('created_at', { ascending: false }),
      db.from('inquiries').select('*').order('created_at', { ascending: false }).limit(20)
    ]);
    const propertyList = document.querySelector('[data-admin-properties]');
    const inquiryList = document.querySelector('[data-inquiry-list]');
    if (propertyList) propertyList.innerHTML = properties.data?.length ? properties.data.map((property) => `<article class="admin-item"><strong>${escapeHtml(property.title)}</strong><small>${escapeHtml(property.location)} · ${formatPrice(property.price)} · ${escapeHtml(property.status)}</small><div class="admin-item-actions"><button type="button" data-status-id="${property.id}" data-status="${property.status === 'available' ? 'sold' : 'available'}">Mark ${property.status === 'available' ? 'sold' : 'available'}</button><button class="danger-action" type="button" data-delete-id="${property.id}">Delete</button></div></article>`).join('') : '<p>No properties yet.</p>';
    if (inquiryList) inquiryList.innerHTML = inquiries.data?.length ? inquiries.data.map((inquiry) => `<article class="admin-item"><strong>${escapeHtml(inquiry.name)}</strong><small>${escapeHtml(inquiry.email)}${inquiry.phone ? ` · ${escapeHtml(inquiry.phone)}` : ''}</small><p>${escapeHtml(inquiry.message || 'No message provided.')}</p></article>`).join('') : '<p>No inquiries yet.</p>';
  };

  const { data: { session } } = await db.auth.getSession();
  if (session) await loadDashboard();

  document.querySelector('[data-login-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const { error } = await db.auth.signInWithPassword({ email: form.email.value, password: form.password.value });
    if (error) {
      if (loginNote) loginNote.textContent = error.message;
      return;
    }
    await loadDashboard();
  });

  document.querySelector('[data-sign-out]')?.addEventListener('click', async () => {
    await db.auth.signOut();
    dashboard.hidden = true;
    loginPanel.hidden = false;
  });

  document.querySelector('[data-property-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const note = document.querySelector('[data-property-note]');
    const payload = Object.fromEntries(new FormData(form).entries());
    ['price', 'bedrooms', 'bathrooms', 'area_sqft'].forEach((key) => { payload[key] = Number(payload[key]); });
    payload.featured = form.featured.checked;
    const { error } = await db.from('properties').insert(payload);
    if (error) {
      if (note) note.textContent = error.message;
      return;
    }
    form.reset();
    if (note) note.textContent = 'Property published.';
    await loadDashboard();
  });

  document.querySelector('[data-admin-properties]')?.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.deleteId && window.confirm('Delete this property?')) {
      await db.from('properties').delete().eq('id', button.dataset.deleteId);
      await loadDashboard();
    }
    if (button.dataset.statusId) {
      await db.from('properties').update({ status: button.dataset.status }).eq('id', button.dataset.statusId);
      await loadDashboard();
    }
  });
};

loadProperties();
loadPropertyDetail();
initAdmin();
