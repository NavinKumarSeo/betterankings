/* ============================================================
   BetteRankings — landing page interactions
   Vanilla JS, no dependencies, no build step.
   ============================================================ */

(function() {
  'use strict';

  // 1. Smooth scroll for in-page anchor links — accounts for sticky header
  const HEADER_OFFSET = 80; // sticky header height + breathing room

  document.querySelectorAll('a[href^="#"], a[href*="/#"]').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = link.getAttribute('href');
      // Only intercept same-page hash links
      if (href === '#' || href.length < 2) return;

      // Extract just the hash portion
      let hash = href;
      if (href.startsWith('/#')) {
        // Same-domain link like /#pricing — only intercept if we're on the home page
        if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
          return; // Let the browser navigate normally
        }
        hash = href.substring(1); // /#pricing → #pricing
      }

      const target = document.querySelector(hash);
      if (!target) return;

      e.preventDefault();
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;
      window.scrollTo({ top: targetTop, behavior: 'smooth' });

      // Close mobile nav if open
      const nav = document.querySelector('.nav');
      if (nav && nav.classList.contains('open')) {
        nav.classList.remove('open');
        document.querySelector('.nav-toggle')?.setAttribute('aria-expanded', 'false');
      }

      // Update URL hash without jumping
      if (history.pushState) history.pushState(null, '', hash);
    });
  });

  // 2. Animated counters in trust strip + hero card
  function animateCounter(el) {
    const target = parseFloat(el.dataset.target || el.textContent);
    if (Number.isNaN(target)) return;
    const duration = 1200;
    const start = performance.now();
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = target * eased;
      el.textContent = (target % 1 === 0) ? Math.round(val) : val.toFixed(1);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = String(target);
    }
    requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.counter').forEach(function(el) { counterObserver.observe(el); });
  } else {
    document.querySelectorAll('.counter').forEach(function(el) {
      el.textContent = el.dataset.target || el.textContent;
    });
  }

  // 3. Reveal-on-scroll for cards
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.metric-card, .step, .price-card, .testimonial, .for-card').forEach(function(el, i) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = 'opacity 0.5s ease ' + (i * 0.05) + 's, transform 0.5s ease ' + (i * 0.05) + 's';
      revealObserver.observe(el);
    });
  }

  // 4. PayPal form-submit handler — confirms business email is set
  document.querySelectorAll('.paypal-form').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      const businessInput = form.querySelector('input[name="business"]');
      const email = businessInput ? businessInput.value : '';
      if (!email || email.indexOf('@') === -1) {
        e.preventDefault();
        alert('PayPal email not configured. Please contact hello@betterankings.com.');
        return false;
      }
    });
  });

  // 5. Mobile nav toggle accessibility
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (navToggle && nav) {
    navToggle.setAttribute('aria-controls', 'primary-nav');
    nav.setAttribute('id', 'primary-nav');
    document.addEventListener('click', function(e) {
      if (!nav.contains(e.target) && !navToggle.contains(e.target) && nav.classList.contains('open')) {
        nav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // 6. Sticky mobile CTA — visible after scrolling past hero, hides at footer
  const stickyCta = document.querySelector('.mobile-sticky-cta');
  const heroEl = document.querySelector('.hero');
  const footerEl = document.querySelector('.site-footer');
  if (stickyCta && heroEl && footerEl) {
    let ticking = false;
    function updateStickyCta() {
      const scrollY = window.scrollY;
      const heroBottom = heroEl.offsetTop + heroEl.offsetHeight;
      const footerTop = footerEl.offsetTop - 200;
      stickyCta.classList.toggle('visible', scrollY > heroBottom && scrollY < footerTop);
      ticking = false;
    }
    window.addEventListener('scroll', function() {
      if (!ticking) { requestAnimationFrame(updateStickyCta); ticking = true; }
    }, { passive: true });
  }

  // 7. Header shadow on scroll
  const headerEl = document.querySelector('.site-header');
  if (headerEl) {
    window.addEventListener('scroll', function() {
      headerEl.style.boxShadow = window.scrollY > 8 ? '0 4px 20px rgba(0,0,0,0.06)' : '';
    }, { passive: true });
  }

})();
