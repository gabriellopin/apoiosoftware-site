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

  /* ---------- URL limpa: rola até a seção sem deixar #ancora no endereço ---------- */
  function limpaHash() {
    history.replaceState(null, '', location.pathname + location.search);
  }
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href*="#"]');
    if (!link) return;
    var href = link.getAttribute('href');
    var pos = href.indexOf('#');
    var caminho = href.slice(0, pos);
    var id = href.slice(pos + 1);
    if (!id) return;
    if (caminho && caminho !== location.pathname && !(caminho === '/' && location.pathname === '/')) return;
    var alvo = document.getElementById(id);
    if (!alvo) return;
    e.preventDefault();
    alvo.scrollIntoView({ behavior: reduzMovimento ? 'auto' : 'smooth' });
    alvo.setAttribute('tabindex', '-1');
    alvo.focus({ preventScroll: true });
    limpaHash();
  });
  // chegou de outra página com #ancora: o navegador rola sozinho, só limpamos o endereço
  if (location.hash) window.addEventListener('load', limpaHash);

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

  /* ---------- Pausa do marquee (WCAG 2.2.2) ---------- */
  var pausa = document.querySelector('.marquee-pause');
  if (pausa) {
    pausa.addEventListener('click', function () {
      var track = pausa.parentElement.querySelector('.marquee-track');
      var pausado = track.classList.toggle('paused');
      pausa.setAttribute('aria-pressed', String(pausado));
      pausa.setAttribute('aria-label', pausado ? 'Retomar a faixa de ferramentas' : 'Pausar a faixa de ferramentas');
    });
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
    // com JS ativo, a validação customizada assume; sem JS, vale a nativa
    form.noValidate = true;
    var feedback = form.querySelector('.form-feedback');

    // retorno do envio sem JS (FormSubmit redireciona com ?enviado=1)
    if (window.location.search.indexOf('enviado=1') !== -1) {
      feedback.textContent = 'Recebido. Vamos entrar em contato em breve.';
    }

    // plano escolhido na página de planos chega via ?plano=
    var mPlano = window.location.search.match(/[?&]plano=(light|premium|pro)/);
    if (mPlano) {
      var nomePlano = { light: 'Light', premium: 'Premium', pro: 'Pro' }[mPlano[1]];
      var campoPlano = document.createElement('input');
      campoPlano.type = 'hidden';
      campoPlano.name = 'plano_escolhido';
      campoPlano.value = nomePlano;
      form.appendChild(campoPlano);
      feedback.textContent = 'Plano ' + nomePlano + ' selecionado. Preencha para continuar.';
    }

    // máscara de telefone brasileira (não reformata ao apagar, evitando o
    // loop de backspace no hífen)
    var tel = document.getElementById('f-telefone');
    tel.addEventListener('input', function (e) {
      if (e.inputType && e.inputType.indexOf('delete') === 0) return;
      var d = tel.value.replace(/\D/g, '');
      if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);
      d = d.slice(0, 11);
      if (d.length > 6) tel.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
      else if (d.length > 2) tel.value = '(' + d.slice(0, 2) + ') ' + d.slice(2);
      else tel.value = d;
    });

    function erroDoCampo(campo) {
      var v = campo.value.trim();
      if (campo.name === 'nome') {
        if (!v) return 'Informe seu nome.';
        if (!/\p{L}/u.test(v)) return 'O nome precisa conter letras.';
      }
      if (campo.name === 'email' && (!v || !campo.checkValidity())) return 'Informe um e-mail válido.';
      if (campo.name === 'telefone' && v.replace(/\D/g, '').length < 10) return 'Informe o telefone com DDD.';
      if (campo.name === 'pacientes' && !v) return 'Selecione uma faixa.';
      return '';
    }

    function valida() {
      var primeiroErro = null;
      form.querySelectorAll('.field input, .field select').forEach(function (campo) {
        var aviso = campo.parentElement.querySelector('.field-error');
        if (!aviso) {
          aviso = document.createElement('span');
          aviso.className = 'field-error';
          campo.parentElement.appendChild(aviso);
        }
        var msg = erroDoCampo(campo);
        campo.classList.toggle('invalid', !!msg);
        campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
        aviso.textContent = msg;
        if (msg && !primeiroErro) primeiroErro = campo;
      });
      return primeiroErro;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      feedback.classList.remove('error');
      feedback.textContent = '';

      var primeiroErro = valida();
      if (primeiroErro) {
        primeiroErro.focus();
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
        feedback.textContent = 'Recebido. Vamos entrar em contato em breve. ';
        var refazer = document.createElement('a');
        refazer.href = '#';
        refazer.textContent = 'Corrigir e reenviar';
        refazer.addEventListener('click', function (ev) {
          ev.preventDefault();
          botao.disabled = false;
          feedback.textContent = '';
        });
        feedback.appendChild(refazer);
      }).catch(function () {
        botao.disabled = false;
        feedback.classList.add('error');
        feedback.textContent = 'Não foi possível enviar agora. Escreva para contato@apoiosoftware.com.br.';
      });
    });
  }

  /* ---------- Aviso de cookies (LGPD) ----------
     Guarda a escolha em localStorage; window.apoioCookiesAceitos
     fica disponível para condicionar futuros scripts de medição. */
  var CHAVE_COOKIES = 'apoio-consentimento-cookies';
  var escolhaCookies = null;
  try { escolhaCookies = localStorage.getItem(CHAVE_COOKIES); } catch (e) {}
  window.apoioCookiesAceitos = escolhaCookies === 'aceito';

  if (!escolhaCookies) {
    var avisoCookies = document.createElement('div');
    avisoCookies.className = 'cookie-aviso';
    avisoCookies.setAttribute('role', 'region');
    avisoCookies.setAttribute('aria-label', 'Aviso de cookies');
    avisoCookies.innerHTML =
      '<p>Usamos cookies essenciais para o site funcionar e, com o seu aceite, cookies de medição de audiência. ' +
      'Saiba mais na <a href="/politica-de-cookies">Política de Cookies</a>.</p>' +
      '<div class="cookie-acoes">' +
      '<button type="button" class="btn btn-outline" data-cookies="recusado">Recusar</button>' +
      '<button type="button" class="btn btn-primary" data-cookies="aceito">Aceitar</button>' +
      '</div>';
    document.body.appendChild(avisoCookies);

    avisoCookies.addEventListener('click', function (e) {
      var botao = e.target.closest('[data-cookies]');
      if (!botao) return;
      try { localStorage.setItem(CHAVE_COOKIES, botao.dataset.cookies); } catch (e2) {}
      window.apoioCookiesAceitos = botao.dataset.cookies === 'aceito';
      avisoCookies.classList.remove('visivel');
      setTimeout(function () { avisoCookies.remove(); }, 350);
    });

    requestAnimationFrame(function () {
      requestAnimationFrame(function () { avisoCookies.classList.add('visivel'); });
    });
  }
})();
