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
// Security: remove query parameters from admin URL
if (
  window.location.pathname.endsWith('admin.html') &&
  window.location.search
) {
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );
}

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
  const galleryImages = [
    property.gallery_image_1,
    property.gallery_image_2,
    property.gallery_image_3
  ];

  document.querySelectorAll('[data-gallery-image]').forEach((img, index) => {
    const galleryUrl = galleryImages[index];

    if (galleryUrl) {
      img.src = galleryUrl;
      img.alt = `${property.title} gallery image ${index + 1}`;
      img.style.display = '';
    } else {
      img.style.display = 'none';
    }
  });
  const price = document.querySelector('[data-detail-price]');
  if (price) price.textContent = formatPrice(property.price);
  const specs = document.querySelector('[data-detail-specs]');
  if (specs) specs.innerHTML = `<li>${property.bedrooms} Bedrooms</li><li>${property.bathrooms} Bathrooms</li><li>${Number(property.area_sqft).toLocaleString()} sq ft internal area</li><li>${escapeHtml(property.location)}</li><li>${escapeHtml(property.property_type)} property</li>`;
  const heading = document.querySelector('[data-detail-heading]');
  if (heading) heading.textContent = `${property.title}: a considered property opportunity.`;
  const description = document.querySelector('[data-detail-description]');
  if (description) description.textContent = property.description;
};
const loadFeaturedProperties = async () => {
  const list = document.querySelector('[data-featured-properties]');

  if (!db || !list) return;

  const { data, error } = await db
    .from('properties')
    .select('*')
    .eq('status', 'available')
    .eq('featured', true)
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error loading featured properties:', error);
    list.innerHTML = '<p>Unable to load featured properties.</p>';
    return;
  }

  if (!data?.length) {
    list.innerHTML = '<p>No featured properties available.</p>';
    return;
  }

  list.innerHTML = data.map(buildCard).join('');
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
      console.error('Inquiry error:', error);

      if (note) {
        note.textContent = 'We could not send your inquiry. Please try again shortly.';
      }

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
    // Dashboard statistics
    const allProperties = properties.data || [];
    const allInquiries = inquiries.data || [];

    const totalProperties = allProperties.length;

    const availableProperties = allProperties.filter(
      (property) => property.status === 'available'
    ).length;

    const soldProperties = allProperties.filter(
      (property) => property.status === 'sold'
    ).length;

    const newInquiries = allInquiries.filter(
      (inquiry) => (inquiry.status || 'new') === 'new'
    ).length;

    const totalStat = document.querySelector('[data-stat-total]');
    const availableStat = document.querySelector('[data-stat-available]');
    const soldStat = document.querySelector('[data-stat-sold]');
    const inquiryStat = document.querySelector('[data-stat-inquiries]');

    if (totalStat) totalStat.textContent = totalProperties;
    if (availableStat) availableStat.textContent = availableProperties;
    if (soldStat) soldStat.textContent = soldProperties;
    if (inquiryStat) inquiryStat.textContent = newInquiries;
    if (propertyList) propertyList.innerHTML = properties.data?.length ? properties.data.map((property) => `<article class="admin-item"><strong>${escapeHtml(property.title)}</strong><small>${escapeHtml(property.location)} · ${formatPrice(property.price)} · ${escapeHtml(property.status)}</small><div class="admin-item-actions"> <button type="button"
    data-edit-id="${property.id}">
    Edit
  </button>
  <button type="button" data-status-id="${property.id}" data-status="${property.status === 'available' ? 'sold' : 'available'}">Mark ${property.status === 'available' ? 'sold' : 'available'}</button><button class="danger-action" type="button" data-delete-id="${property.id}">Delete</button></div></article>`).join('') : '<p>No properties yet.</p>';
    if (inquiryList) {
      inquiryList.innerHTML = inquiries.data?.length
        ? inquiries.data.map((inquiry) => {

          const submittedDate = inquiry.created_at
            ? new Date(inquiry.created_at).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short'
            })
            : 'Unknown';

          return `
          <article class="admin-item inquiry-admin-item">

            <strong>${escapeHtml(inquiry.name)}</strong>

            <small>
              ${escapeHtml(inquiry.email)}
              ${inquiry.phone ? ` · ${escapeHtml(inquiry.phone)}` : ''}
            </small>

            <div class="inquiry-details">

              <p>
                <strong>Service:</strong>
                ${escapeHtml(inquiry.service || 'Not specified')}
              </p>

              <p>
                <strong>Preferred location:</strong>
                ${escapeHtml(inquiry.location_preference || 'Not specified')}
              </p>

              <p>
                <strong>Message:</strong><br>
                ${escapeHtml(inquiry.message || 'No message provided.')}
              </p>

              <small>
                Submitted: ${escapeHtml(submittedDate)}
              </small>

              <small>
                Status: ${escapeHtml(inquiry.status || 'new')}
              </small>

            </div>

            <div class="admin-item-actions">

              ${inquiry.status !== 'contacted'
              ? `
                  <button
                    type="button"
                    data-inquiry-contacted="${inquiry.id}">
                    Mark contacted
                  </button>
                `
              : `
                  <span class="listing-badge">
                    Contacted
                  </span>
                `
            }

              <button
                class="danger-action"
                type="button"
                data-inquiry-delete="${inquiry.id}">
                Delete
              </button>

            </div>

          </article>
        `;
        }).join('')
        : '<p>No inquiries yet.</p>';
    }
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

    ['price', 'bedrooms', 'bathrooms', 'area_sqft'].forEach((key) => {
      payload[key] = Number(payload[key]);
    });

    payload.featured = form.featured.checked;

    let error;

    // EDIT existing property
    if (form.dataset.editId) {
      const result = await db
        .from('properties')
        .update(payload)
        .eq('id', form.dataset.editId);

      error = result.error;

      if (!error) {
        if (note) note.textContent = 'Property updated successfully.';
      }
    }

    // ADD new property
    else {
      const result = await db
        .from('properties')
        .insert(payload);

      error = result.error;

      if (!error) {
        if (note) note.textContent = 'Property published.';
      }
    }

    if (error) {
      if (note) note.textContent = error.message;
      return;
    }

    form.reset();

    delete form.dataset.editId;

    form.querySelector('h2').textContent = 'Add a property';
    form.querySelector('button[type="submit"]').textContent = 'Publish property';

    await loadDashboard();
  });

  document.querySelector('[data-admin-properties]')?.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.editId) {
      const { data: property, error } = await db
        .from('properties')
        .select('*')
        .eq('id', button.dataset.editId)
        .single();

      if (error || !property) {
        alert('Could not load property.');
        return;
      }

      const form = document.querySelector('[data-property-form]');

      form.title.value = property.title;
      form.slug.value = property.slug;
      form.location.value = property.location;
      form.price.value = property.price;
      form.bedrooms.value = property.bedrooms;
      form.bathrooms.value = property.bathrooms;
      form.area_sqft.value = property.area_sqft;
      form.property_type.value = property.property_type;
      form.image_url.value = property.image_url;

      form.gallery_image_1.value = property.gallery_image_1 || '';
      form.gallery_image_2.value = property.gallery_image_2 || '';
      form.gallery_image_3.value = property.gallery_image_3 || '';

      form.description.value = property.description;
      form.featured.checked = property.featured;

      form.dataset.editId = property.id;

      form.querySelector('h2').textContent = 'Edit property';
      form.querySelector('button[type="submit"]').textContent = 'Update property';

      form.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      return;
    }
    if (button.dataset.deleteId && window.confirm('Delete this property?')) {
      await db.from('properties').delete().eq('id', button.dataset.deleteId);
      await loadDashboard();
    }
    if (button.dataset.statusId) {
      await db.from('properties').update({ status: button.dataset.status }).eq('id', button.dataset.statusId);
      await loadDashboard();
    }
  });
  document.querySelector('[data-inquiry-list]')?.addEventListener('click', async (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    // MARK AS CONTACTED
    if (button.dataset.inquiryContacted) {
      const { error } = await db
        .from('inquiries')
        .update({ status: 'contacted' })
        .eq('id', button.dataset.inquiryContacted);

      if (error) {
        console.error('Could not update inquiry:', error);
        alert(error.message);
        return;
      }

      await loadDashboard();
    }

    // DELETE INQUIRY
    if (
      button.dataset.inquiryDelete &&
      window.confirm('Delete this inquiry?')
    ) {
      const { error } = await db
        .from('inquiries')
        .delete()
        .eq('id', button.dataset.inquiryDelete);

      if (error) {
        console.error('Could not delete inquiry:', error);
        alert(error.message);
        return;
      }

      await loadDashboard();
    }
  });
};


loadProperties();
loadFeaturedProperties();
loadPropertyDetail();
initAdmin();