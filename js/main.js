/* Jaracza 21 — makieta: nagłówek, menu boczne, wideo w hero, pojawianie się sekcji */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Nagłówek: tło po przewinięciu ---------- */
  /* Białe tło już po minimalnym przewinięciu (~1 cm) */
  var header = document.querySelector('.site-header');

  function updateHeader() {
    header.classList.toggle('is-solid', window.scrollY > 40);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', updateHeader);

  /* ---------- Menu boczne ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var drawer = document.getElementById('menu-boczne');
  var panel = drawer.querySelector('.drawer__panel');
  var lastFocus = null;

  function focusables() {
    return panel.querySelectorAll('a[href], button:not([disabled])');
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    requestAnimationFrame(function () {
      drawer.classList.add('is-open');
    });
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    focusables()[0].focus();
  }

  function closeDrawer() {
    drawer.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    setTimeout(function () { drawer.hidden = true; }, reduceMotion ? 0 : 500);
    if (lastFocus) lastFocus.focus();
  }

  toggle.addEventListener('click', openDrawer);
  drawer.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]') || e.target.closest('.drawer__list a')) closeDrawer();
  });
  document.addEventListener('keydown', function (e) {
    if (drawer.hidden) return;
    if (e.key === 'Escape') closeDrawer();
    if (e.key === 'Tab') {
      var items = focusables();
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Wideo w hero ---------- */
  /* Przy ograniczonym ruchu wideo się nie ładuje — zostaje kadr startowy */
  var video = document.querySelector('.hero__video');

  if (video) {
    var mobile = window.matchMedia('(max-width: 860px)').matches;
    if (mobile) video.poster = video.dataset.posterMobile;

    if (reduceMotion) {
      video.removeAttribute('autoplay');
    } else {
      video.src = mobile ? video.dataset.srcMobile : video.dataset.srcDesktop;
      var play = video.play();
      if (play && play.catch) play.catch(function () {});
    }
  }

  /* ---------- Paralaksa zdjęć na całą szerokość ---------- */
  var layers = document.querySelectorAll('[data-parallax]');
  if (layers.length && !reduceMotion) {
    var ticking = false;
    function updateParallax() {
      var vh = window.innerHeight;
      layers.forEach(function (layer) {
        var box = layer.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > vh) return;
        /* -1 gdy pasek wchodzi od dołu, 1 gdy wychodzi górą */
        var progress = (vh - box.top) / (vh + box.height) * 2 - 1;
        layer.style.transform = 'translate3d(0,' + (progress * -8).toFixed(2) + '%,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(updateParallax); }
    }, { passive: true });
    window.addEventListener('resize', updateParallax);
    updateParallax();
  }

  /* ---------- Formularze-makiety: walidacja i stan „wysłano” (bez wysyłki danych) ---------- */
  document.querySelectorAll('.js-mock-form').forEach(function (form) {
    function check(input) {
      var valid = input.type === 'checkbox' ? input.checked : input.checkValidity() && input.value.trim() !== '';
      var errId = input.getAttribute('aria-describedby');
      var err = errId && document.getElementById(errId);
      input.setAttribute('aria-invalid', String(!valid));
      if (err) err.hidden = valid;
      return valid;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = form.querySelectorAll('[required]');
      var firstInvalid = null;
      required.forEach(function (input) {
        if (!check(input) && !firstInvalid) firstInvalid = input;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }
      form.reset();
      form.querySelector('.form-success').hidden = false;
    });

    form.addEventListener('input', function (e) {
      if (e.target.getAttribute('aria-invalid') === 'true') check(e.target);
    });
  });

  /* ---------- Karuzela lokali: strzałki przewijają o jeden kafelek ---------- */
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    var track = carousel.querySelector('.carousel__track');
    var buttons = carousel.querySelectorAll('.carousel__btn');
    if (!track) return;

    function step() {
      var slide = track.querySelector('.carousel__slide');
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return slide ? slide.getBoundingClientRect().width + gap : track.clientWidth;
    }
    function updateButtons() {
      var max = track.scrollWidth - track.clientWidth - 2;
      buttons[0].disabled = track.scrollLeft <= 2;
      buttons[1].disabled = track.scrollLeft >= max;
    }
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        track.scrollBy({ left: step() * Number(btn.dataset.dir), behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });
    track.addEventListener('scroll', updateButtons, { passive: true });
    window.addEventListener('resize', updateButtons);
    updateButtons();
  });

  /* ---------- Pojawianie się sekcji ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();
