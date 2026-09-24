// ============================================================
// PERFIL.JS — Lógica completa da página de perfil
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  signOut,
  deleteUser
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCxxzzYuIgCGhP2hKcb0RqSt8daaxobXtw",
  authDomain: "projeto-login-10-11.firebaseapp.com",
  projectId: "projeto-login-10-11",
  storageBucket: "projeto-login-10-11.firebasestorage.app",
  messagingSenderId: "256789148847",
  appId: "1:256789148847:web:f5f1ca404b12d83f72d05a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let userProfile = {};

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
const rootEl = document.documentElement;
const savedTheme = localStorage.getItem('sim_theme_v5');
if (savedTheme) rootEl.setAttribute('data-theme', savedTheme);

document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
  const next = rootEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  rootEl.setAttribute('data-theme', next);
  localStorage.setItem('sim_theme_v5', next);
  const prefTheme = document.getElementById('prefTheme');
  if (prefTheme) prefTheme.checked = next === 'dark';
});

// ============================================================
// MODAL DE CONFIRMAÇÃO GENÉRICO
// ============================================================
const confirmModal = document.getElementById('confirmModal');
let confirmCallback = null;

function showConfirm(options) {
  document.getElementById('confirmTitle').textContent = options.title || 'Confirmar';
  document.getElementById('confirmMessage').textContent = options.message || 'Tem certeza?';
  
  const icon = document.getElementById('confirmIcon');
  icon.className = 'confirm-icon' + (options.danger ? ' danger' : '');
  
  const okBtn = document.getElementById('confirmOk');
  okBtn.textContent = options.okText || 'Confirmar';
  okBtn.className = 'btn ' + (options.danger ? 'btn-danger' : 'btn-primary');
  
  document.getElementById('confirmCancel').textContent = options.cancelText || 'Cancelar';
  
  confirmCallback = options.onConfirm;
  confirmModal.classList.add('open');
}

document.getElementById('confirmCancel')?.addEventListener('click', () => {
  confirmModal.classList.remove('open');
  confirmCallback = null;
});
document.getElementById('confirmOk')?.addEventListener('click', () => {
  if (typeof confirmCallback === 'function') confirmCallback();
  confirmModal.classList.remove('open');
  confirmCallback = null;
});
confirmModal?.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    confirmModal.classList.remove('open');
    confirmCallback = null;
  }
});

// ============================================================
// TOGGLE DE SENHA
// ============================================================
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

// ============================================================
// UTILITÁRIOS
// ============================================================
function formatDate(date) {
  if (!date) return '—';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleDateString('pt-BR', { 
    day: '2-digit', month: 'short', year: 'numeric' 
  });
}
function formatDateTime(date) {
  if (!date) return '—';
  const d = date.toDate ? date.toDate() : new Date(date);
  return d.toLocaleString('pt-BR', { 
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getInitial(name, email) {
  if (name && name.trim()) return name.trim().charAt(0).toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return 'U';
}

// ============================================================
// CARREGAR PERFIL
// ============================================================
async function loadUserProfile(user) {
  try {
    const userDocRef = doc(db, 'usuarios', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      userProfile = userDoc.data();
    } else {
      // Cria doc inicial
      userProfile = {
        displayName: user.displayName || user.email.split('@')[0],
        createdAt: serverTimestamp(),
        bio: '',
        stats: { compras: 0, simulacoes: 0 },
        preferences: { notifications: true, shareStats: false },
        activity: []
      };
      await setDoc(userDocRef, userProfile);
    }
    
    return userProfile;
  } catch (err) {
    console.warn('Erro ao carregar perfil do Firestore:', err);
    return {
      displayName: user.displayName || user.email.split('@')[0],
      bio: '',
      stats: { compras: 0, simulacoes: 0 }
    };
  }
}

// ============================================================
// RENDERIZAR PERFIL
// ============================================================
function renderProfile(user, profile) {
  const displayName = profile.displayName || user.displayName || user.email.split('@')[0];
  const initial = getInitial(displayName, user.email);
  
  // Nome e email
  document.getElementById('perfilNome').textContent = displayName;
  document.getElementById('perfilEmail').textContent = user.email;
  document.getElementById('avatarInitial').textContent = initial;
  document.getElementById('inputNome').value = displayName;
  document.getElementById('inputEmailReadonly').value = user.email;
  document.getElementById('inputBio').value = profile.bio || '';
  document.getElementById('bioCount').textContent = (profile.bio || '').length;
  
  // Foto de perfil
  const savedPhoto = localStorage.getItem('userPhoto_' + user.uid);
  if (savedPhoto) {
    const avatar = document.getElementById('perfilAvatar');
    avatar.innerHTML = `<img src="${savedPhoto}" alt="Foto de perfil" />`;
  }
  
  // Badges
  const badgeVer = document.getElementById('badgeVerification');
  const badgeVerText = document.getElementById('badgeVerificationText');
  if (user.emailVerified) {
    badgeVer.className = 'badge-verification verified';
    badgeVerText.textContent = 'E-mail verificado';
  } else {
    badgeVer.className = 'badge-verification unverified';
    badgeVerText.textContent = 'E-mail não verificado';
  }
  
  // Data de criação
  const createdAt = profile.createdAt || user.metadata.creationTime;
  document.getElementById('membroDesde').textContent = formatDate(createdAt);
  document.getElementById('secCreatedAt').textContent = formatDate(createdAt);
  document.getElementById('secLastLogin').textContent = formatDateTime(user.metadata.lastSignInTime);
  document.getElementById('secEmailVerified').textContent = user.emailVerified ? '✅ Sim' : '⚠️ Não';
  document.getElementById('secEmailVerified').className = 'security-value ' + (user.emailVerified ? 'verified' : 'unverified');
  
  // Botão reenviar verificação
  if (!user.emailVerified) {
    document.getElementById('btnReenviarVerificacao').style.display = 'block';
  }
  
  // Stats
  const stats = profile.stats || { compras: 0, simulacoes: 0 };
  document.getElementById('statCompras').textContent = stats.compras || 0;
  document.getElementById('statSimulacoes').textContent = stats.simulacoes || 0;
  
  // Nível (baseado em compras)
  let nivel = 'Bronze';
  if (stats.compras >= 5) nivel = 'Ouro';
  else if (stats.compras >= 2) nivel = 'Prata';
  document.getElementById('statNivel').textContent = nivel;
  
  // Preferências
  const prefs = profile.preferences || {};
  document.getElementById('prefTheme').checked = rootEl.getAttribute('data-theme') === 'dark';
  document.getElementById('prefNotif').checked = prefs.notifications !== false;
  document.getElementById('prefStats').checked = prefs.shareStats === true;
  
  // Atividade
  renderActivity(profile.activity || []);
}

function renderActivity(activities) {
  const container = document.getElementById('activityTimeline');
  if (!activities.length) return;
  
  container.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-icon">${a.icon || '📌'}</div>
      <div class="activity-body">
        <div class="activity-title">${a.title}</div>
        <div class="activity-time">${formatDateTime(a.timestamp)}</div>
      </div>
    </div>
  `).join('');
}

// ============================================================
// ADICIONAR ATIVIDADE
// ============================================================
async function addActivity(user, title, icon = '📌') {
  if (!user) return;
  try {
    const userRef = doc(db, 'usuarios', user.uid);
    const docSnap = await getDoc(userRef);
    let activities = docSnap.exists() ? (docSnap.data().activity || []) : [];
    
    activities.unshift({
      title,
      icon,
      timestamp: new Date().toISOString()
    });
    
    // Mantém as 20 mais recentes
    activities = activities.slice(0, 20);
    
    await setDoc(userRef, { activity: activities }, { merge: true });
    userProfile.activity = activities;
    renderActivity(activities);
  } catch (err) {
    console.warn('Erro ao salvar atividade:', err);
  }
}

// ============================================================
// TABS
// ============================================================
document.querySelectorAll('.perfil-tab-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.perfil-tab-btn[data-tab]').forEach(b => 
      b.classList.toggle('active', b === btn)
    );
    document.querySelectorAll('.perfil-panel').forEach(p => 
      p.classList.toggle('active', p.dataset.panel === tab)
    );
  });
});

// ============================================================
// SALVAR DADOS PESSOAIS
// ============================================================
document.getElementById('formDados')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  
  const btn = document.getElementById('btnSalvarDados');
  const alert = document.getElementById('alertDados');
  const novoNome = document.getElementById('inputNome').value.trim();
  const novaBio = document.getElementById('inputBio').value.trim();
  
  alert.classList.add('hidden');
  
  if (!novoNome || novoNome.length < 3) {
    alert.innerText = 'Nome deve ter pelo menos 3 caracteres.';
    alert.className = 'auth-alert error';
    alert.classList.remove('hidden');
    return;
  }
  
  btn.classList.add('loading');
  btn.disabled = true;
  
  try {
    // Atualiza no Firebase Auth
    await updateProfile(currentUser, { displayName: novoNome });
    
    // Atualiza no Firestore
    const userRef = doc(db, 'usuarios', currentUser.uid);
    await setDoc(userRef, {
      displayName: novoNome,
      bio: novaBio,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    userProfile.displayName = novoNome;
    userProfile.bio = novaBio;
    
    // Atualiza UI
    document.getElementById('perfilNome').textContent = novoNome;
    document.getElementById('avatarInitial').textContent = getInitial(novoNome, currentUser.email);
    
    alert.innerText = '✅ Dados atualizados com sucesso!';
    alert.className = 'auth-alert success';
    alert.classList.remove('hidden');
    showToast('Perfil atualizado!');
    
    await addActivity(currentUser, 'Dados do perfil atualizados', '✏️');
    
  } catch (err) {
    console.error(err);
    alert.innerText = 'Erro ao salvar: ' + err.message;
    alert.className = 'auth-alert error';
    alert.classList.remove('hidden');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

// Contador de bio
document.getElementById('inputBio')?.addEventListener('input', (e) => {
  document.getElementById('bioCount').textContent = e.target.value.length;
});

// ============================================================
// UPLOAD DE FOTO DE PERFIL (base64 em localStorage)
// ============================================================
document.getElementById('avatarUpload')?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || !currentUser) return;
  
  if (!file.type.startsWith('image/')) {
    showToast('Por favor, selecione uma imagem.');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    showToast('Imagem muito grande (máx. 5MB).');
    return;
  }
  
  // Redimensiona a imagem
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 300;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      // Crop centralizado
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.85);
      
      try {
        localStorage.setItem('userPhoto_' + currentUser.uid, base64);
        document.getElementById('perfilAvatar').innerHTML = `<img src="${base64}" alt="Foto de perfil" />`;
        showToast('Foto de perfil atualizada!');
        addActivity(currentUser, 'Foto de perfil alterada', '📸');
      } catch (err) {
        showToast('Erro ao salvar foto. Tente uma imagem menor.');
      }
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// ============================================================
// ALTERAR SENHA
// ============================================================
document.getElementById('formSenha')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser) return;
  
  const btn = document.getElementById('btnAlterarSenha');
  const alert = document.getElementById('alertSenha');
  const senhaAtual = document.getElementById('senhaAtual').value;
  const senhaNova = document.getElementById('senhaNova').value;
  const senhaConfirmar = document.getElementById('senhaConfirmar').value;
  
  alert.classList.add('hidden');
  
  if (senhaNova.length < 6) {
    alert.innerText = 'A nova senha deve ter pelo menos 6 caracteres.';
    alert.className = 'auth-alert error';
    alert.classList.remove('hidden');
    return;
  }
  if (senhaNova !== senhaConfirmar) {
    alert.innerText = 'As senhas não coincidem.';
    alert.className = 'auth-alert error';
    alert.classList.remove('hidden');
    return;
  }
  if (senhaAtual === senhaNova) {
    alert.innerText = 'A nova senha deve ser diferente da atual.';
    alert.className = 'auth-alert error';
    alert.classList.remove('hidden');
    return;
  }
  
  btn.classList.add('loading');
  btn.disabled = true;
  
  try {
    // Reautentica para segurança
    const credential = EmailAuthProvider.credential(currentUser.email, senhaAtual);
    await reauthenticateWithCredential(currentUser, credential);
    
    // Atualiza senha
    await updatePassword(currentUser, senhaNova);
    
    alert.innerText = '✅ Senha alterada com sucesso!';
    alert.className = 'auth-alert success';
    alert.classList.remove('hidden');
    showToast('Senha atualizada!');
    
    document.getElementById('formSenha').reset();
    await addActivity(currentUser, 'Senha da conta alterada', '🔐');
    
  } catch (err) {
    console.error(err);
    let msg = 'Erro ao alterar senha.';
    if (err.code === 'auth/wrong-password') msg = 'Senha atual incorreta.';
    else if (err.code === 'auth/weak-password') msg = 'Nova senha muito fraca.';
    else if (err.code === 'auth/requires-recent-login') msg = 'Faça login novamente e tente outra vez.';
    
    alert.innerText = msg;
    alert.className = 'auth-alert error';
    alert.classList.remove('hidden');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});

// Força da nova senha
document.getElementById('senhaNova')?.addEventListener('input', function() {
  const bar = document.getElementById('novaSenhaStrength');
  const val = this.value;
  let score = 0;
  if (val.length >= 6) score++;
  if (val.match(/[A-Z]/)) score++;
  if (val.match(/[0-9]/)) score++;
  if (val.match(/[^A-Za-z0-9]/)) score++;
  
  bar.className = 'password-strength';
  if (val.length === 0) bar.style.width = '0';
  else if (score <= 1) bar.classList.add('weak');
  else if (score === 2 || score === 3) bar.classList.add('medium');
  else bar.classList.add('strong');
});

// ============================================================
// REENVIAR VERIFICAÇÃO
// ============================================================
document.getElementById('btnReenviarVerificacao')?.addEventListener('click', async () => {
  if (!currentUser) return;
  try {
    await sendEmailVerification(currentUser);
    showToast('E-mail de verificação reenviado!');
    await addActivity(currentUser, 'E-mail de verificação reenviado', '📧');
  } catch (err) {
    showToast('Erro ao reenviar. Aguarde alguns minutos.');
  }
});

// ============================================================
// PREFERÊNCIAS
// ============================================================
document.getElementById('prefTheme')?.addEventListener('change', (e) => {
  const next = e.target.checked ? 'dark' : 'light';
  rootEl.setAttribute('data-theme', next);
  localStorage.setItem('sim_theme_v5', next);
});

document.getElementById('prefNotif')?.addEventListener('change', async (e) => {
  if (!currentUser) return;
  await setDoc(doc(db, 'usuarios', currentUser.uid), {
    preferences: { ...(userProfile.preferences || {}), notifications: e.target.checked }
  }, { merge: true });
  showToast('Preferências salvas!');
});

document.getElementById('prefStats')?.addEventListener('change', async (e) => {
  if (!currentUser) return;
  await setDoc(doc(db, 'usuarios', currentUser.uid), {
    preferences: { ...(userProfile.preferences || {}), shareStats: e.target.checked }
  }, { merge: true });
  showToast('Preferências salvas!');
});

// ============================================================
// LOGOUT COM CONFIRMAÇÃO
// ============================================================
function handleLogout() {
  showConfirm({
    title: 'Confirmar saída',
    message: 'Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar o conteúdo.',
    okText: 'Sim, sair',
    cancelText: 'Cancelar',
    danger: true,
    onConfirm: async () => {
      try {
        await signOut(auth);
        showToast('Você saiu da conta.');
        setTimeout(() => window.location.href = 'index.html', 800);
      } catch (err) {
        showToast('Erro ao sair. Tente novamente.');
      }
    }
  });
}

document.getElementById('btnLogoutSidebar')?.addEventListener('click', handleLogout);

// ============================================================
// EXCLUIR CONTA
// ============================================================
document.getElementById('btnDeleteAccount')?.addEventListener('click', () => {
  showConfirm({
    title: 'Excluir conta permanentemente',
    message: '⚠️ Esta ação é IRREVERSÍVEL. Todos os seus dados, histórico e informações serão permanentemente excluídos. Deseja continuar?',
    okText: 'Sim, excluir',
    cancelText: 'Cancelar',
    danger: true,
    onConfirm: async () => {
      // Segunda confirmação
      setTimeout(() => {
        const prompt = window.prompt('Digite "EXCLUIR" (em maiúsculas) para confirmar:');
        if (prompt === 'EXCLUIR') {
          performDeleteAccount();
        } else if (prompt !== null) {
          showToast('Exclusão cancelada.');
        }
      }, 300);
    }
  });
});

async function performDeleteAccount() {
  if (!currentUser) return;
  try {
    // Remove dados locais
    localStorage.removeItem('userPhoto_' + currentUser.uid);
    
    // Remove do Firestore
    try {
      await setDoc(doc(db, 'usuarios', currentUser.uid), {}, { merge: false });
    } catch(e) {}
    
    // Remove do Auth
    await deleteUser(currentUser);
    
    showToast('Conta excluída. Redirecionando...');
    setTimeout(() => window.location.href = 'index.html', 1500);
  } catch (err) {
    console.error(err);
    if (err.code === 'auth/requires-recent-login') {
      showToast('Faça login novamente e tente excluir a conta.');
    } else {
      showToast('Erro ao excluir conta. Tente novamente.');
    }
  }
}

// ============================================================
// AUTENTICAÇÃO — Verificação inicial
// ============================================================
onAuthStateChanged(auth, async (user) => {
  const loading = document.getElementById('loadingScreen');
  const content = document.getElementById('perfilContent');
  
  if (!user) {
    // Não logado → redireciona
    window.location.href = 'index.html';
    return;
  }
  
  currentUser = user;
  const profile = await loadUserProfile(user);
  userProfile = profile;
  
  renderProfile(user, profile);
  
  loading.classList.add('hidden');
  content.classList.remove('hidden');
  
  // Registra visita
  await addActivity(user, 'Acessou a página de perfil', '👤');
  
  console.log('✅ Perfil carregado para:', user.email);
});