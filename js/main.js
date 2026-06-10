/* Apoio Software — interações do site */
(function () {
  'use strict';

  var reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header com sombra ao rolar ---------- */
  var header = document.querySelector('.site-header');
  function aoRolar() {
    header.classList.toggle('scrolled', window.scrollY > 12);
  }
  window.addEventListener('scroll', aoRolar, { passive: true });
  aoRolar();

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var aberto = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(aberto));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Revelação ao rolar ---------- */
  var reveals = document.querySelectorAll('.reveal, .reveal-scale');
  if (reduzMovimento || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  } else {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visible');
          obs.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { obs.observe(el); });
  }

  /* ---------- Coreografia do chat ----------
     Sequência: pergunta → "digitando" → resposta → chips.
     Cada bloco .msg/.chips ganha um atraso incremental. */
  function animaChat(corpo) {
    if (corpo.dataset.animado) return;
    corpo.dataset.animado = '1';

    var blocos = corpo.querySelectorAll('.msg, .chips');
    var atraso = 200;

    blocos.forEach(function (bloco) {
      if (bloco.classList.contains('typing')) {
        bloco.style.transitionDelay = atraso + 'ms';
        // o "digitando" some quando a resposta chega
        setTimeout(function () { bloco.classList.add('done'); }, atraso + 1400);
        atraso += 1400;
      } else {
        bloco.style.transitionDelay = atraso + 'ms';
        atraso += bloco.classList.contains('user') ? 700 : 900;
      }
    });

    corpo.classList.add('chat-on');
  }

  var chats = document.querySelectorAll('[data-chat]');
  if (reduzMovimento || !('IntersectionObserver' in window)) {
    chats.forEach(function (c) {
      c.classList.add('chat-on');
      var t = c.querySelector('.typing');
      if (t) t.classList.add('done');
    });
  } else {
    var obsChat = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          animaChat(entrada.target);
          obsChat.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.35 });
    chats.forEach(function (c) { obsChat.observe(c); });
  }

  /* ---------- Parallax sutil (transform apenas) ---------- */
  var itensParallax = document.querySelectorAll('[data-parallax]');
  if (!reduzMovimento && itensParallax.length) {
    var ticking = false;
    function parallax() {
      var y = window.scrollY;
      itensParallax.forEach(function (el) {
        var fator = parseFloat(el.dataset.parallax) || 0.1;
        el.style.transform = 'translate3d(0,' + (y * fator * -1) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(parallax);
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------- Formulário de lead ---------- */
  var form = document.getElementById('lead-form');
  if (form) {
    var feedback = form.querySelector('.form-feedback');

    // máscara simples de telefone brasileiro
    var tel = document.getElementById('f-telefone');
    tel.addEventListener('input', function () {
      var d = tel.value.replace(/\D/g, '').slice(0, 11);
      if (d.length > 6) tel.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
      else if (d.length > 2) tel.value = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      else tel.value = d;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      feedback.classList.remove('error');
      feedback.textContent = '';

      var valido = true;
      form.querySelectorAll('input, select').forEach(function (campo) {
        campo.classList.remove('invalid');
        if (!campo.checkValidity() || !campo.value.trim()) {
          campo.classList.add('invalid');
          valido = false;
        }
      });
      var dTel = tel.value.replace(/\D/g, '');
      if (dTel.length < 10) { tel.classList.add('invalid'); valido = false; }

      if (!valido) {
        feedback.classList.add('error');
        feedback.textContent = 'Confira os campos destacados e tente de novo.';
        return;
      }

      // Envia o lead por e-mail via FormSubmit (sem backend próprio).
      // O primeiro envio dispara um e-mail de ativação para contato@apoiosoftware.com.br.
      var dados = {
        nome: form.nome.value.trim(),
        email: form.email.value.trim(),
        telefone: tel.value,
        pacientes: form.pacientes.value,
        _subject: 'Novo lead do site: ' + form.nome.value.trim(),
        _template: 'table'
      };

      var botao = form.querySelector('button[type="submit"]');
      botao.disabled = true;
      feedback.textContent = 'Enviando...';

      fetch('https://formsubmit.co/ajax/contato@apoiosoftware.com.br', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(dados)
      }).then(function (r) {
        if (!r.ok) throw new Error('falha no envio');
        form.querySelectorAll('input, select').forEach(function (c) { c.disabled = true; });
        feedback.textContent = 'Recebido. Vamos entrar em contato em breve.';
      }).catch(function () {
        botao.disabled = false;
        feedback.classList.add('error');
        feedback.textContent = 'Não foi possível enviar agora. Escreva para contato@apoiosoftware.com.br.';
      });
    });
  }
})();
