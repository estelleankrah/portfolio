/* ── Ticker ─────────────────────────────────────────────────────── */
const tickerItems = [
  'Brand Protection', 'Crisis Response', 'Contract & Document Management',
  'Regulatory Compliance', 'Stakeholder Liaison', 'Strategic Communications',
  'PR & Press Relations', 'Campaign Planning'
];

const dots = ['#6c9bd2','#d4a96a','#9ec48e','#c49cda','#e8887a','#6c9bd2','#d4a96a','#9ec48e'];

function buildTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;
  let html = '';
  // double for seamless loop
  for (let pass = 0; pass < 2; pass++) {
    tickerItems.forEach((item, i) => {
      html += `<span class="ticker-tag">
        <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${dots[i]};flex-shrink:0;margin-right:2px"></span>
        ${item}
      </span><span class="ticker-tag ticker-sep">·</span>`;
    });
  }
  track.innerHTML = html;
}

/* ── Image upload helpers ────────────────────────────────────────── */
function triggerUpload(id) {
  document.getElementById(id).click();
}

function previewStrip(input, idx) {
  const file = input.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = document.getElementById(`strip-${idx}-img`);
  const ph  = document.getElementById(`strip-${idx}-ph`);
  img.src = url;
  img.style.display = 'block';
  if (ph) ph.style.display = 'none';
}

function previewPhoto(input) {
  const file = input.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = document.getElementById('about-photo-img');
  const ph  = document.getElementById('about-photo-ph');
  img.src = url;
  img.style.display = 'block';
  if (ph) ph.style.display = 'none';
}

/* ── Project image uploads (grid cards) ─────────────────────────── */
function initProjectSlots() {
  document.querySelectorAll('.project-img-slot').forEach(slot => {
    const key = slot.dataset.slot;
    // Skip slots that are inside a link — they should navigate, not upload
    if (slot.closest('a[href]')) return;
    slot.addEventListener('click', e => {
      e.preventDefault();
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'image/*';
      inp.onchange = () => {
        const file = inp.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const img = document.getElementById(`${key}-img`);
        const ph  = document.getElementById(`${key}-ph`);
        if (img) { img.src = url; img.style.display = 'block'; }
        if (ph) ph.style.display = 'none';
      };
      inp.click();
    });
  });
}

/* ── Project filter tabs ─────────────────────────────────────────── */
function initFilters() {
  const btns  = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      cards.forEach(card => {
        if (filter === 'all' || card.dataset.cat === filter) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

/* ── Drag-scroll (shared) ────────────────────────────────────────── */
function makeDraggable(el) {
  if (!el) return;
  let isDown = false, startX, scrollLeft;
  el.addEventListener('mousedown', e => {
    isDown = true;
    startX = e.pageX - el.offsetLeft;
    scrollLeft = el.scrollLeft;
  });
  document.addEventListener('mouseup', () => { isDown = false; });
  el.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    el.scrollLeft = scrollLeft - (x - startX) * 1.2;
  });
}

function initDragScroll() {
  makeDraggable(document.querySelector('.strip-scroll-outer'));
  makeDraggable(document.querySelector('.industry-scroll-outer'));
}

/* ── Industry card image upload ──────────────────────────────────── */
function previewIndustryCard(input, prefix) {
  const file = input.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = document.getElementById(`${prefix}-img`);
  const ph  = document.getElementById(`${prefix}-ph`);
  if (img) { img.src = url; img.style.display = 'block'; }
  if (ph) ph.style.display = 'none';
}

/* ── Gallery slots (project page) ───────────────────────────────── */
function initGallerySlots() {
  document.querySelectorAll('.gallery-slot').forEach((slot, i) => {
    slot.addEventListener('click', () => {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/*';
      inp.onchange = () => {
        const file = inp.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        let img = slot.querySelector('img');
        if (!img) { img = document.createElement('img'); slot.appendChild(img); }
        img.src = url;
        img.style.display = 'block';
        const ph = slot.querySelector('.strip-placeholder, .proj-img-ph, [class*="ph"]');
        if (ph) ph.style.display = 'none';
      };
      inp.click();
    });
  });
}

/* ── Industry hero slideshow — cycles each project's images ─────── */
function initIndustrySlideshow() {
  const heroCard  = document.getElementById('industry-hero-card');
  const heroImg   = document.getElementById('industry-hero-img');
  const heroLabel = document.getElementById('industry-hero-label');
  const heroType  = document.getElementById('industry-hero-type');
  const heroBrand = document.getElementById('industry-hero-brand');
  if (!heroCard || !heroImg) return;

  // Build brand entries from cards that have data-hero-imgs
  const brandCards = Array.from(document.querySelectorAll('.industry-brand-card'))
    .filter(c => c.dataset.heroImgs);
  if (!brandCards.length) return;

  const brands = brandCards.map(c => ({
    imgs:  c.dataset.heroImgs.split(',').map(s => s.trim()),
    label: c.dataset.heroLabel || '',
    type:  c.dataset.heroType  || '',
    brand: c.dataset.heroBrand || '',
    href:  c.href || heroCard.href,
    card:  c
  }));

  let brandIdx = 0;   // which brand is active
  let imgIdx   = 0;   // which image within that brand
  let timer    = null;

  // Preload all images silently
  brands.forEach(b => b.imgs.forEach(src => { const i = new Image(); i.src = src; }));

  function swapImage(src) {
    heroImg.style.opacity = '0';
    setTimeout(() => { heroImg.src = src; heroImg.style.opacity = '1'; }, 250);
  }

  function activateBrand(bIdx, iIdx) {
    const b = brands[bIdx];
    brandCards.forEach(c => c.classList.remove('industry-brand-card--active'));
    b.card.classList.add('industry-brand-card--active');
    if (heroLabel) heroLabel.innerHTML = b.label;
    if (heroType)  heroType.textContent = b.type;
    if (heroBrand) heroBrand.innerHTML  = b.brand;
    heroCard.href = b.href;
    swapImage(b.imgs[iIdx]);

    const strip = document.getElementById('industry-scroll');
    if (strip) strip.scrollTo({ left: b.card.offsetLeft - 40, behavior: 'smooth' });
  }

  function advance() {
    imgIdx++;
    if (imgIdx >= brands[brandIdx].imgs.length) {
      imgIdx   = 0;
      brandIdx = (brandIdx + 1) % brands.length;
    }
    activateBrand(brandIdx, imgIdx);
  }

  // Hover a card: switch brand immediately, reset image index
  brandCards.forEach((card, idx) => {
    card.addEventListener('mouseenter', () => {
      clearInterval(timer);
      brandIdx = idx;
      imgIdx   = 0;
      activateBrand(brandIdx, imgIdx);
      timer = setInterval(advance, 3000);
    });
  });

  // Kick off
  activateBrand(0, 0);
  timer = setInterval(advance, 3000);
}

/* ── Whole-card click navigation ────────────────────────────────── */
function initCardLinks() {
  document.querySelectorAll('.project-card').forEach(card => {
    const firstLink = card.querySelector('a[href]');
    if (!firstLink) return;
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      window.location.href = firstLink.href;
    });
  });
}

/* ── Highlighter sweep animation ────────────────────────────────── */
function initHighlighter() {
  const highlights = document.querySelectorAll('.text-highlight');
  if (!highlights.length) return;

  highlights.forEach((el, i) => {
    el.style.transitionDelay = (i * 0.3) + 's';
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.text-highlight').forEach(el => {
          el.classList.add('hl-active');
        });
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  document.querySelectorAll('.superpower-text, .about-bio-left').forEach(el => observer.observe(el));
}

/* ── Section nav (sticky sidebar ToC) ───────────────────────────── */
function initSectionNav() {
  // Only activate on pages with a project hero (not the homepage)
  const isProjectPage = document.querySelector('.proj-page-hero, .rebirth-hero');
  if (!isProjectPage) return;

  // Collect all section title headings
  const headings = document.querySelectorAll('.slide-section-title, .section-subhead, .rebirth-section-title');
  if (headings.length < 2) return;

  const nav = document.createElement('nav');
  nav.className = 'section-nav';
  nav.id = 'section-nav';

  const items = [];

  headings.forEach((h, i) => {
    // Find closest section container
    const container = h.closest('.slide-section, .render-pair, .floor-plan-section, .ig-embed-section, .proj-overview') || h.parentElement;
    if (!container.id) container.id = 'sec-' + i;

    const label = h.closest('.slide-section')?.querySelector('.slide-section-label')?.textContent.trim()
                  || h.textContent.trim();

    const a = document.createElement('a');
    a.href = '#' + container.id;
    a.className = 'section-nav-item';
    a.textContent = label;
    a.title = h.textContent.trim();
    a.addEventListener('click', e => {
      e.preventDefault();
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    nav.appendChild(a);
    items.push({ el: container, link: a });
  });

  document.body.appendChild(nav);

  // Slide in after hero is scrolled past
  const hero = document.querySelector('.proj-page-hero, .rebirth-hero');
  const threshold = hero ? hero.offsetHeight * 0.6 : 300;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('visible', window.scrollY > threshold);
  }, { passive: true });

  // Highlight active section
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        items.forEach(i => i.link.classList.remove('active'));
        const hit = items.find(i => i.el === entry.target);
        if (hit) hit.link.classList.add('active');
      }
    });
  }, { rootMargin: '-15% 0px -75% 0px', threshold: 0 });

  items.forEach(i => observer.observe(i.el));
}

/* ── Mobile sidebar ─────────────────────────────────────────────── */
function initMobileNav() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;

  // Hamburger button
  const btn = document.createElement('button');
  btn.className = 'nav-hamburger';
  btn.id = 'nav-hamburger';
  btn.setAttribute('aria-label', 'Open menu');
  btn.innerHTML = '<span></span><span></span><span></span>';
  nav.appendChild(btn);

  // Sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'nav-sidebar';
  sidebar.id = 'nav-sidebar';
  sidebar.innerHTML = `
    <button class="sidebar-close" id="sidebar-close" aria-label="Close menu">✕</button>
    <nav class="sidebar-links">
      <a href="about-me.html">About</a>
      <a href="index.html#industry">Industry</a>
      <a href="index.html#work">Work</a>
      <a href="index.html#experience">Experience</a>
      <a href="about.html">CV</a>
    </nav>
    <a href="mailto:estelleankrah1@gmail.com" class="sidebar-contact">estelleankrah1@gmail.com</a>
  `;
  document.body.appendChild(sidebar);

  // Overlay
  const overlay = document.createElement('div');
  overlay.className = 'nav-overlay';
  overlay.id = 'nav-overlay';
  document.body.appendChild(overlay);

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', openSidebar);
  document.getElementById('sidebar-close').addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);
}

/* ── Init ────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildTicker();
  initProjectSlots();
  initFilters();
  initDragScroll();
  initGallerySlots();
  initIndustrySlideshow();
  initCardLinks();
  initHighlighter();
  initSectionNav();
  initMobileNav();
});
