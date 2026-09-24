// Importações Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCxxzzYuIgCGhP2hKcb0RqSt8daaxobXtw",
  authDomain: "projeto-login-10-11.firebaseapp.com",
  projectId: "projeto-login-10-11",
  storageBucket: "projeto-login-10-11.firebasestorage.app",
  messagingSenderId: "256789148847",
  appId: "1:256789148847:web:f5f1ca404b12d83f72d05a"
};

let auth, db, currentUser = null;
try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) { console.warn('Firebase não inicializado.', e); }

// ============================================================
// TOAST
// ============================================================
function showToast(message) {
  const toast = document.getElementById('systemToast');
  if (!toast) return;
  toast.innerText = message;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 3500);
}

// ============================================================
// TEMA
// ============================================================
document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('sim_theme_v5', next);
});

// Carrega tema salvo
const savedTheme = localStorage.getItem('sim_theme_v5');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

// ============================================================
// SIDEBAR
// ============================================================
const hoverSidebar = document.getElementById('hoverSidebar');
const triggerZone = document.getElementById('sidebarTriggerZone');

triggerZone?.addEventListener('mouseenter', () => hoverSidebar?.classList.add('visible'));
hoverSidebar?.addEventListener('mouseleave', () => hoverSidebar?.classList.remove('visible'));

document.addEventListener('touchstart', (e) => {
  if (e.touches[0].clientX < 25) {
    hoverSidebar?.classList.add('visible');
  } else if (hoverSidebar?.classList.contains('visible') && !hoverSidebar.contains(e.target)) {
    hoverSidebar.classList.remove('visible');
  }
});

// ============================================================
// CONTADORES
// ============================================================
const counters = document.querySelectorAll('.proof-number');
let animated = false;
const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !animated) {
    counters.forEach(counter => {
      const target = +counter.getAttribute('data-target');
      let count = 0;
      const speed = target / 30;
      const updateCount = () => {
        count += speed;
        if (count < target) {
          counter.innerText = Math.ceil(count);
          setTimeout(updateCount, 30);
        } else {
          counter.innerText = target;
        }
      };
      updateCount();
    });
    animated = true;
  }
}, { threshold: 0.5 });
if (document.querySelector('.proof-bar')) observer.observe(document.querySelector('.proof-bar'));

// ============================================================
// ANATOMIA
// ============================================================
const anatomyCards = document.querySelectorAll('.anatomy-card');
anatomyCards.forEach(card => {
  card.addEventListener('mouseenter', () => {
    anatomyCards.forEach(c => c.classList.remove('anatomy-active'));
    card.classList.add('anatomy-active');
  });
});

// ============================================================
// LIGHTBOX
// ============================================================
window.openLightbox = (src, caption) => {
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxCaption').innerText = caption;
  document.getElementById('lightboxModal').classList.add('open');
};
window.closeLightbox = () => document.getElementById('lightboxModal').classList.remove('open');

// ============================================================
// AUTENTICAÇÃO PROFISSIONAL
// ============================================================
const authModal = document.getElementById('authModal');
const authAlert = document.getElementById('authAlert');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');

// Lista EXPANDIDA de domínios de e-mail temporários/falsos
const DISPOSABLE_DOMAINS = [
  '10minutemail.com','10minutemail.net','10minutemail.org','10minutemail.co.uk',
  'tempmail.com','tempmail.net','tempmail.org','temp-mail.org','temp-mail.io','tempmail.dev',
  'guerrillamail.com','guerrillamail.net','guerrillamail.org','guerrillamail.biz','guerrillamailblock.com','grr.la','spam4.me',
  'mailinator.com','mailinator.net','mailinator.org','mailinator2.com',
  'yopmail.com','yopmail.fr','yopmail.net','cool.fr.nf','jetable.fr.nf','yopmail.gq','yopmail.pp.ua','yopmail.usa.cc',
  'throwawaymail.com','throwaway.email','throwam.com',
  'fakeinbox.com','fakemail.net','fakemail.fr','fakemailgenerator.com','emailfake.com',
  'trashmail.com','trashmail.net','trashmail.org','trashmail.ws','trash-mail.at','trash-mail.com','trash-mail.de',
  'getnada.com','nada.email','maildrop.cc','mailnesia.com',
  'tempr.email','discard.email','discardmail.com','discardmail.de',
  'mohmal.com','emailondeck.com','mintemail.com','mytemp.email',
  'spamgourmet.com','spamgourmet.net','spamgourmet.org','spaml.com','spam.la','spamfree24.org',
  'mailmetrash.com','mailexpire.com','mailimate.com','mail-temporaire.fr',
  'tempinbox.com','tempinbox.co.uk','tempmailaddress.com','tempmailo.com','tempmails.net',
  'dispostable.com','mailsac.com','mailcatch.com','inboxalias.com','inboxkitten.com','inboxes.com',
  'burnermail.io','33mail.com','anonbox.net','binkmail.com','bobmail.info',
  'generator.email','email-temp.com','emailtemporario.com.br','emailtemporanea.com',
  'rcpt.at','wegwerfmail.de','wegwerfmail.net','wegwerfmail.org',
  'einrot.com','armyspy.com','cuvox.de','dayrep.com','fleckens.hu','gustr.com','jourrapide.com',
  'rhyta.com','superrito.com','teleworm.us','chammy.info','deadaddress.com','devnullmail.com',
  'dingbone.com','safetymail.info','spamherelots.com','spamhereplease.com',
  'thisisnotmyrealemail.com','trash-amil.com','trash2009.com','trashdevil.com','trashemail.de',
  'trashymail.com','tyldd.com','uggsrock.com','venompen.com','veryrealemail.com',
  'viditag.com','viewcastmedia.com','vomoto.com','vpn.st','vsimcard.com','vubby.com',
  'wasteland.rfc822.org','webemail.me','webm4il.info','weg-werf-email.de','wegwerf-emails.de',
  'wh4f.org','whatiaas.com','whatpaas.com','whyspam.me','wilemail.com',
  'willhackforfood.biz','willselfdestruct.com','winemaven.info','wronghead.com',
  'wuzup.net','wuzupmail.net','www.e4ward.com','www.gishpuppy.com','www.mailinator.com',
  'wwwnew.eu','x.ip6.li','xagloo.co','xagloo.com','xemaps.com','xents.com','xmaily.com',
  'xoxy.net','yep.it','yogamaven.com','yomail.info','you-spam.com','ypmail.webarnak.fr.eu.org',
  'yuurok.com','z1p.biz','za.com','zehnminuten.de','zehnminutenmail.de','zetmail.com',
  'zippymail.info','zoaxe.com','zoemail.com','zoemail.net','zoemail.org','zomg.info',
  'zxcv.com','zxcvbnm.com','zzz.com','tempmailer.com','tempmailer.de',
  'fake-mail.net','fakemailgenerator.net','mail-temp.com','mailtemp.info',
  'throwawaymail.net','trbvm.com','trbvn.com','trbvo.com','tempemail.net','tempemail.com',
  'temp-mail.ru','tempail.com','tempinbox.xyz','throwaway.email',
  'disposableemailaddresses.emailmiser.com','mailforspam.com','mailismagic.com',
  'momail.net','throwitallaway.com','letthemeatspam.com','lookugly.com',
  'mail-temporaire.fr','mailtemp.com.br','emailtemporario.net','lortemail.dk','makemetheking.com'
];

// Padrões suspeitos
const SUSPICIOUS_PATTERNS = [
  /^test@test\./i, /^fake@fake\./i, /^admin@admin\./i, /^user@user\./i,
  /^abc@abc\./i, /^123@123\./i, /^aaa@aaa\./i, /^asdf@asdf\./i,
  /^qwerty@qwerty\./i, /^xxxx@xxxx\./i
];

// Lista de domínios confiáveis comuns (para priorizar)
const TRUSTED_DOMAINS = [
  'gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'yahoo.com.br',
  'live.com', 'icloud.com', 'me.com', 'protonmail.com', 'proton.me',
  'uol.com.br', 'bol.com.br', 'terra.com.br', 'globo.com', 'ig.com.br',
  'ifnmg.edu.br', 'edu.br', 'ac.uk', 'edu'
];

// Funções Globais do Modal
window.openAuthModal = () => { 
  authAlert?.classList.add('hidden'); 
  authModal?.classList.add('open'); 
};
window.closeAuthModal = () => authModal?.classList.remove('open');

window.switchAuthTab = (tab) => {
  authAlert?.classList.add('hidden');
  const isLogin = tab === 'login';
  document.getElementById('tabBtnLogin')?.classList.toggle('active', isLogin);
  document.getElementById('tabBtnRegister')?.classList.toggle('active', !isLogin);
  document.getElementById('loginForm')?.classList.toggle('hidden', !isLogin);
  document.getElementById('registerForm')?.classList.toggle('hidden', isLogin);
  
  if (authTitle) authTitle.innerText = isLogin ? 'Bem-vindo de volta' : 'Crie sua conta';
  if (authSubtitle) authSubtitle.innerText = isLogin 
    ? 'Acesse sua conta para gerenciar o projeto' 
    : 'Junte-se a nós e acompanhe o projeto';
};

window.togglePassword = (inputId, btn) => {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerText = '🙈';
  } else {
    input.type = 'password';
    btn.innerText = '👁️';
  }
};

// Validação de E-mail RIGOROSA (Anti-Fake)
function isValidEmail(email) {
  // Formato básico
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!re.test(email)) {
    return { valid: false, msg: 'Formato de e-mail inválido.' };
  }
  
  const [localPart, domain] = email.toLowerCase().split('@');
  
  // Domínio mínimo
  if (domain.length < 4 || !domain.includes('.')) {
    return { valid: false, msg: 'Domínio de e-mail inválido.' };
  }
  
  // TLD deve ter 2+ caracteres
  const tld = domain.split('.').pop();
  if (tld.length < 2) {
    return { valid: false, msg: 'Domínio de e-mail inválido.' };
  }
  
  // Bloqueio de domínios descartáveis
  if (DISPOSABLE_DOMAINS.includes(domain)) {
    return { valid: false, msg: '⚠️ E-mails temporários não são permitidos. Use um e-mail real e permanente.' };
  }
  
  // Bloqueio de padrões suspeitos
  if (SUSPICIOUS_PATTERNS.some(p => p.test(email))) {
    return { valid: false, msg: '⚠️ E-mail com padrão suspeito. Use um endereço de e-mail real.' };
  }
  
  // Local part muito curto ou apenas números
  if (localPart.length < 3) {
    return { valid: false, msg: 'A parte antes do @ deve ter pelo menos 3 caracteres.' };
  }
  if (/^\d+$/.test(localPart)) {
    return { valid: false, msg: 'E-mail com apenas números não é permitido.' };
  }
  
  // Muitos caracteres repetidos
  if (/(.)\1{5,}/.test(localPart)) {
    return { valid: false, msg: 'E-mail inválido (muitos caracteres repetidos).' };
  }
  
  return { valid: true, trusted: TRUSTED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d)) };
}

// Força da Senha
document.getElementById('regPassword')?.addEventListener('input', function() {
  const strengthBar = document.getElementById('passStrength');
  if (!strengthBar) return;
  const val = this.value;
  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 10) score++;
  if (val.match(/[A-Z]/)) score++;
  if (val.match(/[0-9]/)) score++;
  if (val.match(/[^A-Za-z0-9]/)) score++;
  
  strengthBar.className = 'password-strength';
  if (val.length === 0) { strengthBar.style.width = '0'; return; }
  if (score <= 2) strengthBar.classList.add('weak');
  else if (score <= 3) strengthBar.classList.add('medium');
  else strengthBar.classList.add('strong');
});

// Helpers de alerta
function showAuthError(msg) {
  if (!authAlert) return;
  authAlert.innerText = msg;
  authAlert.className = 'auth-alert error';
  authAlert.classList.remove('hidden');
}
function showAuthSuccess(msg) {
  if (!authAlert) return;
  authAlert.innerText = msg;
  authAlert.className = 'auth-alert success';
  authAlert.classList.remove('hidden');
}

// ============================================================
// LOGOUT COM CONFIRMAÇÃO
// ============================================================
window.requestLogout = () => {
  document.getElementById('confirmLogoutModal')?.classList.add('open');
};
window.cancelLogout = () => {
  document.getElementById('confirmLogoutModal')?.classList.remove('open');
};
window.confirmLogout = async () => {
  document.getElementById('confirmLogoutModal')?.classList.remove('open');
  try {
    await signOut(auth);
    showToast('Você saiu da conta com sucesso.');
  } catch (err) {
    showToast('Erro ao sair. Tente novamente.');
  }
};

// ============================================================
// CONTROLE DO BOTÃO "ADQUIRIR"
// ============================================================
const btnAdquirir = document.getElementById('btnAdquirir');
const msgLogin = document.getElementById('msgLoginNecessario');

if (btnAdquirir) {
  btnAdquirir.addEventListener('click', function(e) {
    e.preventDefault();

    if (currentUser) {
      if (!currentUser.emailVerified) {
        showToast("⚠️ Verifique seu e-mail antes de prosseguir. Confira sua caixa de entrada.");
        return;
      }
      window.location.href = 'comprar.html';
    } else {
      window.openAuthModal();
      if (msgLogin) {
        msgLogin.style.display = 'block';
        setTimeout(() => { msgLogin.style.display = 'none'; }, 5000);
      }
    }
  });
}

// ============================================================
// AUTENTICAÇÃO
// ============================================================
if (auth) {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    const topNav = document.getElementById('topUserNav');
    const sidebarNav = document.getElementById('sidebarUserArea');

    if (btnAdquirir) {
      if (user && user.emailVerified) {
        btnAdquirir.textContent = '✅ QUERO ADQUIRIR';
        btnAdquirir.style.opacity = '1';
      } else if (user && !user.emailVerified) {
        btnAdquirir.textContent = '⚠️ VERIFIQUE SEU E-MAIL';
        btnAdquirir.style.opacity = '0.85';
      } else {
        btnAdquirir.textContent = '🔒 FAÇA LOGIN PARA ADQUIRIR';
        btnAdquirir.style.opacity = '0.7';
      }
    }

    if (user) {
      const isVerified = user.emailVerified;
      const userName = user.displayName || user.email.split('@')[0];
      const initial = userName.charAt(0).toUpperCase();
      const photoUrl = localStorage.getItem('userPhoto_' + user.uid);
      
      const avatarHtml = photoUrl 
        ? `<img src="${photoUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />`
        : initial;

      const userHtml = `
        <div class="user-chip">
          <div class="user-avatar">${avatarHtml}</div>
          <span class="user-email">${user.email}</span>
          ${!isVerified ? '<span style="font-size:0.7rem;color:#F59E0B;margin-left:5px;" title="E-mail não verificado">⚠️</span>' : ''}
          <a href="perfil.html" class="btn btn-outline" style="text-decoration:none;font-size:0.7rem;padding:0.35rem 0.7rem;">Perfil</a>
          <button id="btnLogout" class="btn btn-outline" style="font-size:0.7rem;padding:0.35rem 0.7rem;">Sair</button>
        </div>
      `;
      
      if (topNav) topNav.innerHTML = userHtml;
      if (sidebarNav) sidebarNav.innerHTML = userHtml;
      
      document.querySelectorAll('#btnLogout').forEach(b => 
        b.addEventListener('click', (e) => { 
          e.preventDefault(); 
          window.requestLogout(); 
        })
      );
    } else {
      if (topNav) topNav.innerHTML = `<button class="btn btn-primary" onclick="window.openAuthModal()">Minha Conta</button>`;
      if (sidebarNav) sidebarNav.innerHTML = `<button class="btn btn-outline btn-full" onclick="window.openAuthModal()">Entrar / Cadastrar</button>`;
    }
  });

  // LOGIN
  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnLoginSubmit');
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    
    btn?.classList.add('loading');
    authAlert?.classList.add('hidden');

    try {
      await signInWithEmailAndPassword(auth, email, pass);
      window.closeAuthModal();
      showToast("✅ Sessão iniciada com sucesso!");
    } catch (err) {
      let msg = "E-mail ou senha incorretos.";
      if (err.code === 'auth/user-not-found') msg = "Usuário não encontrado. Crie uma conta.";
      else if (err.code === 'auth/wrong-password') msg = "Senha incorreta. Tente novamente.";
      else if (err.code === 'auth/invalid-credential') msg = "E-mail ou senha incorretos.";
      else if (err.code === 'auth/too-many-requests') msg = "Muitas tentativas. Tente mais tarde.";
      else if (err.code === 'auth/invalid-email') msg = "Formato de e-mail inválido.";
      showAuthError(msg);
    } finally {
      btn?.classList.remove('loading');
    }
  });

  // REGISTRO
  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnRegisterSubmit');
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPassword').value;
    const passConfirm = document.getElementById('regPasswordConfirm').value;

    authAlert?.classList.add('hidden');

    if (!name || name.length < 3) {
      return showAuthError("Por favor, insira seu nome completo (mínimo 3 caracteres).");
    }
    
    const emailCheck = isValidEmail(email);
    if (!emailCheck.valid) return showAuthError(emailCheck.msg);
    
    if (pass.length < 6) return showAuthError("A senha deve ter no mínimo 6 caracteres.");
    if (pass !== passConfirm) return showAuthError("As senhas não coincidem.");

    btn?.classList.add('loading');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });
      await sendEmailVerification(user);

      // Cria documento do usuário no Firestore
      try {
        await setDoc(doc(db, 'usuarios', user.uid), {
          displayName: name,
          email: email,
          createdAt: serverTimestamp(),
          bio: '',
          stats: { compras: 0, simulacoes: 0 },
          preferences: { notifications: true, shareStats: false },
          activity: [{
            title: 'Conta criada',
            icon: '🎉',
            timestamp: new Date().toISOString()
          }]
        });
      } catch (fsErr) {
        console.warn('Erro ao criar doc Firestore:', fsErr);
      }

      window.closeAuthModal();
      showToast("✅ Conta criada! Verifique seu e-mail para ativar.");
      
    } catch (err) {
      let msg = "Erro ao criar conta. Tente novamente.";
      if (err.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso. Faça login.";
      else if (err.code === 'auth/invalid-email') msg = "E-mail inválido.";
      else if (err.code === 'auth/weak-password') msg = "Senha muito fraca.";
      showAuthError(msg);
    } finally {
      btn?.classList.remove('loading');
    }
  });

  // RECUPERAÇÃO DE SENHA
  window.resetPassword = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    if (!email) return showAuthError("Digite seu e-mail no campo acima para recuperar a senha.");
    
    const emailCheck = isValidEmail(email);
    if (!emailCheck.valid) return showAuthError(emailCheck.msg);
    
    try {
      await sendPasswordResetEmail(auth, email);
      showAuthSuccess("E-mail de recuperação enviado! Verifique sua caixa de entrada e o spam.");
    } catch (err) {
      let msg = "Erro ao enviar e-mail. Verifique se o e-mail está correto.";
      if (err.code === 'auth/user-not-found') msg = "Não há conta cadastrada com este e-mail.";
      showAuthError(msg);
    }
  };

} else {
  const topNav = document.getElementById('topUserNav');
  const sidebarNav = document.getElementById('sidebarUserArea');
  if (topNav) topNav.innerHTML = `<span style="color:var(--text-muted);font-size:0.8rem;">Firebase indisponível</span>`;
  if (sidebarNav) sidebarNav.innerHTML = `<span style="color:var(--text-muted);font-size:0.8rem;">--</span>`;
}

// ============================================================
// SIMULADOR
// ============================================================
const simSvg = document.getElementById('simulatedHandSvg');
const heroSvg = document.getElementById('heroHandSvg');
const stateLabel = document.getElementById('simHandStateLabel');
const telPwm = document.getElementById('telPwm');
const telStatus = document.getElementById('telStatus');
const terminalLog = document.getElementById('terminalLog');

function appendLog(text) {
  if (!terminalLog) return;
  const line = document.createElement('div');
  line.className = 'log-line';
  line.innerText = text;
  terminalLog.appendChild(line);
  terminalLog.scrollTop = terminalLog.scrollHeight;
}

let currentHandState = 'OPEN';

window.setHandState = function(action) {
  if (action === 'ABRIR') {
    currentHandState = 'OPEN';
    if (simSvg) simSvg.className = 'sim-hand-svg state-open';
    if (heroSvg) heroSvg.className = 'cad-hand svg-open';
    if (stateLabel) {
      stateLabel.className = 'sim-state-banner state-open-banner';
      stateLabel.innerText = 'ESTADO ATUAL: MÃO ABERTA';
    }
    if (telPwm) telPwm.innerText = '0° (RECUO)';
    if (telStatus) telStatus.innerText = 'SISTEMA EM REPOUSO';
    appendLog('[ARDUINO] PWM(0°) -> Servos recuados (Mão Aberta).');
  } else if (action === 'FECHAR') {
    currentHandState = 'CLOSED';
    if (simSvg) simSvg.className = 'sim-hand-svg state-closed';
    if (heroSvg) heroSvg.className = 'cad-hand svg-closed';
    if (stateLabel) {
      stateLabel.className = 'sim-state-banner state-closed-banner';
      stateLabel.innerText = 'ESTADO ATUAL: MÃO FECHADA';
    }
    if (telPwm) telPwm.innerText = '180° (TRAÇÃO)';
    if (telStatus) telStatus.innerText = 'PREENSÃO ATIVA';
    appendLog('[ARDUINO] PWM(180°) -> Servos tracionados (Mão Fechada).');
  }
};

document.addEventListener('DOMContentLoaded', function() {
  const btnOpen = document.getElementById('btnCmdOpen');
  const btnClose = document.getElementById('btnCmdClose');

  btnOpen?.addEventListener('click', (e) => { e.preventDefault(); window.setHandState('ABRIR'); });
  btnClose?.addEventListener('click', (e) => { e.preventDefault(); window.setHandState('FECHAR'); });

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('micBtn');

  if (SpeechRecognition && micBtn) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';

    micBtn.addEventListener('click', () => {
      try {
        recognition.start();
        micBtn.classList.add('listening');
        const title = document.getElementById('micStateTitle');
        if (title) title.innerText = "Ouvindo comando...";
      } catch (e) { recognition.stop(); }
    });

    recognition.onresult = (event) => {
      micBtn.classList.remove('listening');
      const title = document.getElementById('micStateTitle');
      if (title) title.innerText = "Ativar Reconhecimento Vocal";
      const cmd = event.results[0][0].transcript.toLowerCase().trim();
      const transcript = document.getElementById('speechTranscript');
      if (transcript) transcript.innerText = `Capturado: "${cmd}"`;

      if (cmd.includes('abrir') || cmd.includes('abra')) window.setHandState('ABRIR');
      else if (cmd.includes('fechar') || cmd.includes('feche')) window.setHandState('FECHAR');
      else showToast('Comando inválido. Diga "ABRIR" ou "FECHAR".');
    };
    recognition.onend = () => micBtn.classList.remove('listening');
  } else if (micBtn) {
    micBtn.disabled = true;
  }
});

// ============================================================
// TEMA CANVAS
// ============================================================
function checkTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const dark = document.getElementById('bg-canvas-dark');
  const light = document.getElementById('bg-canvas-light');
  if (dark) dark.style.display = isLight ? 'none' : 'block';
  if (light) light.style.display = isLight ? 'block' : 'none';
}
const themeObserver = new MutationObserver(() => checkTheme());
themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
checkTheme();

// ============================================================
// BOTÃO DE AJUDA
// ============================================================
const helpBtn = document.getElementById('helpBtn');
const helpModal = document.getElementById('helpModal');
const helpClose = document.getElementById('helpModalClose');
const helpForm = document.getElementById('helpForm');
const helpFeedback = document.getElementById('helpFeedback');
const helpSubmitBtn = document.getElementById('helpSubmitBtn');
const EMAIL_SUPORTE = 'lfns@aluno.ifnmg.edu.br';

helpBtn?.addEventListener('click', () => {
  helpModal.classList.add('open');
  helpFeedback.style.display = 'none';
  helpFeedback.className = '';
});

helpClose?.addEventListener('click', () => helpModal.classList.remove('open'));

helpModal?.addEventListener('click', (e) => {
  if (e.target === helpModal) helpModal.classList.remove('open');
});

helpForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('helpName').value.trim();
  const email = document.getElementById('helpEmail').value.trim();
  const message = document.getElementById('helpMessage').value.trim();

  if (!name || !email || !message) {
    helpFeedback.textContent = 'Por favor, preencha todos os campos.';
    helpFeedback.className = 'error';
    helpFeedback.style.display = 'block';
    return;
  }

  helpSubmitBtn.disabled = true;
  helpSubmitBtn.textContent = 'Enviando...';
  helpFeedback.style.display = 'none';

  try {
    const data = {
      _subject: '📩 Nova mensagem do site - Mão Robótica',
      _captcha: 'false',
      _template: 'table',
      Nome: name,
      Email: email,
      Mensagem: message
    };

    const response = await fetch(`https://formsubmit.co/ajax/${EMAIL_SUPORTE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      helpFeedback.textContent = '✅ Mensagem enviada com sucesso!';
      helpFeedback.className = 'success';
      helpFeedback.style.display = 'block';
      helpForm.reset();
      setTimeout(() => helpModal.classList.remove('open'), 3000);
    } else {
      throw new Error('Erro no envio');
    }
  } catch (error) {
    helpFeedback.textContent = '❌ Erro ao enviar mensagem. Tente novamente mais tarde.';
    helpFeedback.className = 'error';
    helpFeedback.style.display = 'block';
  } finally {
    helpSubmitBtn.disabled = false;
    helpSubmitBtn.textContent = 'Enviar Mensagem';
  }
});

// ============================================================
// INDICADOR DO MENU
// ============================================================
const sidebarIndicator = document.getElementById('sidebarIndicator');
if (sidebarIndicator) {
  sidebarIndicator.addEventListener('click', () => {
    document.getElementById('hoverSidebar')?.classList.toggle('visible');
  });
}

console.log('✅ Aplicação carregada.');

/* ============================================================
   MICROINTERAÇÕES PREMIUM
   ============================================================ */
(function () {
  const bar = document.createElement('div');
  bar.id = 'scrollProgressBar';
  document.body.appendChild(bar);
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = pct + '%';
  }, { passive: true });

  const revealTargets = document.querySelectorAll('.team-card, .gallery-item, .academic-card, .pipe-step, .anatomy-card');
  revealTargets.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(el => io.observe(el));

  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(600px) rotateX(${-y * 10}deg) rotateY(${x * 10}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(600px) rotateX(0) rotateY(0)';
      });
    });
  }

  const parallaxEl = document.querySelector('[data-parallax]');
  if (parallaxEl) {
    window.addEventListener('scroll', () => {
      const y = Math.min(window.scrollY * 0.08, 40);
      parallaxEl.style.setProperty('--parallax-y', y);
    }, { passive: true });
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.gallery-item').forEach(item => {
        const show = filter === 'all' || item.dataset.category === filter;
        item.classList.toggle('filtered-out', !show);
      });
    });
  });
})();

/* ============================================================
   FUNDO ANIMADO NATURAL
   ============================================================ */
(function initAnimatedBackground() {
  const canvas = document.getElementById('animated-bg');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let width = 0, height = 0, orbs = [], time = 0, lastTimestamp = 0, isPaused = false;

  const palettes = {
    light: [[255,205,140],[190,240,210],[190,220,255],[255,235,195],[200,245,220],[230,220,255]],
    dark: [[40,90,150],[60,110,180],[30,70,130],[80,140,210],[25,55,110]]
  };

  class Orb {
    constructor(index) {
      this.index = index;
      this.colorIndex = index % 5;
      this.reset();
      const initial = this._targetColor();
      this.r = initial[0]; this.g = initial[1]; this.b = initial[2];
    }
    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.baseRadius = 180 + Math.random() * 320;
      this.radius = this.baseRadius;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = (Math.random() - 0.5) * 0.25;
      this.phaseX = Math.random() * Math.PI * 2;
      this.phaseY = Math.random() * Math.PI * 2;
      this.phaseBreath = Math.random() * Math.PI * 2;
      this.phaseOpacity = Math.random() * Math.PI * 2;
      this.driftSpeedX = 0.00018 + Math.random() * 0.00015;
      this.driftSpeedY = 0.00014 + Math.random() * 0.00018;
      this.breathSpeed = 0.00022 + Math.random() * 0.00028;
      this.opacitySpeed = 0.00018 + Math.random() * 0.00022;
      this.baseOpacity = 0.22 + Math.random() * 0.18;
    }
    _targetColor() {
      const theme = document.documentElement.getAttribute('data-theme');
      const palette = theme === 'dark' ? palettes.dark : palettes.light;
      return palette[this.colorIndex % palette.length];
    }
    update() {
      this.x += this.vx + Math.sin(time * this.driftSpeedX + this.phaseX) * 0.12;
      this.y += this.vy + Math.cos(time * this.driftSpeedY + this.phaseY) * 0.12;
      const pad = this.radius;
      if (this.x < -pad) this.x = width + pad;
      if (this.x > width + pad) this.x = -pad;
      if (this.y < -pad) this.y = height + pad;
      if (this.y > height + pad) this.y = -pad;
      this.radius = this.baseRadius * (Math.sin(time * this.breathSpeed + this.phaseBreath) * 0.10 + 1);
      const target = this._targetColor();
      this.r += (target[0] - this.r) * 0.04;
      this.g += (target[1] - this.g) * 0.04;
      this.b += (target[2] - this.b) * 0.04;
      this.opacity = this.baseOpacity * (0.75 + 0.25 * Math.sin(time * this.opacitySpeed + this.phaseOpacity));
    }
    draw(ctx) {
      const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
      const r = Math.round(this.r), g = Math.round(this.g), b = Math.round(this.b);
      grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${this.opacity})`);
      grad.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.65})`);
      grad.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${this.opacity * 0.25})`);
      grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
  function init() {
    const count = window.innerWidth < 768 ? 6 : 9;
    orbs = [];
    for (let i = 0; i < count; i++) orbs.push(new Orb(i));
  }
  function animate(timestamp) {
    if (isPaused) { lastTimestamp = 0; requestAnimationFrame(animate); return; }
    const dt = lastTimestamp ? timestamp - lastTimestamp : 16;
    lastTimestamp = timestamp;
    time += dt;
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < orbs.length; i++) { orbs[i].update(); orbs[i].draw(ctx); }
    requestAnimationFrame(animate);
  }

  document.addEventListener('visibilitychange', () => { isPaused = document.hidden; });
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => { resize(); init(); }, 250);
  });
  resize(); init(); requestAnimationFrame(animate);
})();