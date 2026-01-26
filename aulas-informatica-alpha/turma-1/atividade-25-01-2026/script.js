// ================== CONFIG ==================
const TIME_LIMIT_SECONDS = 60 * 60; // 60 minutos

// Chaves do localStorage (mude se quiser reaproveitar para outras atividades)
const ATTEMPT_KEY = "alfa_arquivos_pastas_attempt_v1";
const START_KEY   = "alfa_arquivos_pastas_start_ts_v1";
const NAME_KEY    = "alfa_arquivos_pastas_student_v1";

// Cole aqui a URL do Web App (depois de publicar o Apps Script)
const SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbyna1Q2IjB0JGukwax_X4h6ougKPBBE2ApR1QjMYHe2AZsYV4TTTC4j9T5EwkjSJr0k/exec";

// Senha do professor para liberar nova tentativa neste dispositivo
const TEACHER_PASSWORD = "troque-esta-senha";

// ================== QUESTÕES (10) ==================
const QUESTIONS = [
  {
    text: "Qual das extensões abaixo é definida como um executável (programa/instalador)?",
    options: { A: ".pdf", B: ".docx", C: ".exe", D: ".mp4" },
    correct: "C",
    hint: "Procure a extensão que 'faz algo' ou instala algo no computador.",
    explain: "Arquivos .exe são executáveis (programas/instaladores) e podem instalar, executar ou modificar coisas no Windows."
  },
  {
    text: "O que é um arquivo, de forma simples?",
    options: {
      A: "Um local para guardar outros arquivos",
      B: "Qualquer coisa que contém informação (texto, foto, vídeo, música ou programa)",
      C: "A tela inicial do Windows",
      D: "Um tipo de internet"
    },
    correct: "B",
    hint: "Pense em coisas como texto, foto, vídeo… tudo isso é arquivo.",
    explain: "Arquivo é qualquer coisa que contém informação (texto, foto, vídeo, música, programa)."
  },
  {
    text: "O que é uma pasta?",
    options: {
      A: "Um arquivo de texto do Word",
      B: "Um antivírus",
      C: "Um local para guardar arquivos ou outras pastas",
      D: "Um tipo de vídeo"
    },
    correct: "C",
    hint: "Pasta funciona como um “lugar/casa” onde você guarda coisas.",
    explain: "Pasta é um local para guardar arquivos ou outras pastas."
  },
  {
    text: "Qual tipo de arquivo é um 'documento pronto', fechado e normalmente não feito para editar?",
    options: { A: "PDF", B: "DOCX", C: "JPG/PNG", D: "MP4" },
    correct: "A",
    hint: "É o formato que você geralmente abre para ler e imprimir.",
    explain: "PDF é um documento pronto/fechado: você abre e lê; não é feito para editar como o DOCX."
  },
  {
    text: "Qual formato é um documento editável do Word?",
    options: { A: "MP4", B: "DOCX", C: "PDF", D: "PNG" },
    correct: "B",
    hint: "É como um caderno em branco no computador.",
    explain: "DOCX é documento editável do Word: dá para escrever, corrigir, mudar fonte e inserir imagens."
  },
  {
    text: "O Explorador de Arquivos é importante porque nele você consegue…",
    options: {
      A: "Somente assistir vídeos",
      B: "Somente acessar a internet",
      C: "Criar, renomear, mover, copiar, apagar e recuperar arquivos",
      D: "Apenas instalar jogos"
    },
    correct: "C",
    hint: "É o lugar onde você organiza sua vida no PC.",
    explain: "No Explorador você cria pastas, renomeia, move, copia, apaga, recupera na lixeira e encontra arquivos."
  },
  {
    text: "Ao renomear um arquivo, qual cuidado é essencial?",
    options: {
      A: "Sempre trocar a extensão (.pdf, .docx, etc.)",
      B: "Nunca colocar nome, só números",
      C: "Não apagar o final (a extensão), para o Windows reconhecer o tipo",
      D: "Renomear só dentro do Word"
    },
    correct: "C",
    hint: "A extensão funciona como o “RG” do arquivo.",
    explain: "Se você apagar a extensão, o Windows pode não reconhecer o tipo e o arquivo pode não abrir corretamente."
  },
  {
    text: "Qual atalho é usado para COPIAR e COLAR (modo profissional)?",
    options: {
      A: "Ctrl + X e Ctrl + V",
      B: "Ctrl + C e Ctrl + V",
      C: "Alt + F4",
      D: "Ctrl + Z e Ctrl + Y"
    },
    correct: "B",
    hint: "Copiar = duplicar, depois colar no destino.",
    explain: "Copiar: Ctrl + C. Colar: Ctrl + V."
  },
  {
    text: "Qual alternativa descreve corretamente a diferença entre COPIAR e MOVER?",
    options: {
      A: "Copiar tira do lugar antigo; mover cria duplicata",
      B: "Copiar cria duplicata; mover troca o arquivo de lugar (sai do local antigo)",
      C: "Copiar apaga o arquivo; mover envia para lixeira",
      D: "Não existe diferença"
    },
    correct: "B",
    hint: "Pense: duplicata vs trocar de lugar.",
    explain: "Copiar mantém o original e cria uma cópia; mover (recortar) tira do local antigo e coloca em outro."
  },
  {
    text: "Qual afirmação sobre a Lixeira está correta?",
    options: {
      A: "Delete apaga sem chance de recuperar",
      B: "Shift + Delete apaga com chance de recuperar na Lixeira",
      C: "Delete normalmente envia para a Lixeira; Shift + Delete apaga sem chance",
      D: "A Lixeira não serve para restaurar arquivos"
    },
    correct: "C",
    hint: "Uma opção dá “segunda chance”, a outra não.",
    explain: "Delete manda para a Lixeira (pode restaurar). Shift + Delete apaga sem chance (não vai para a Lixeira)."
  },
];

// ================== NÍVEL ==================
function levelFromScore(score, total){
  const pct = (score / total) * 100;
  if(pct <= 40) return "Iniciante";
  if(pct <= 75) return "Intermediário";
  return "Avançado";
}

// ================== HELPERS ==================
function $(id){ return document.getElementById(id); }

function formatTime(totalSeconds){
  const m = String(Math.floor(totalSeconds/60)).padStart(2,"0");
  const s = String(totalSeconds%60).padStart(2,"0");
  return `${m}:${s}`;
}

function lockAttempt(){ localStorage.setItem(ATTEMPT_KEY, "1"); }
function isLocked(){ return localStorage.getItem(ATTEMPT_KEY) === "1"; }
function setStatus(msg){ $("status").textContent = msg; }

function getRemainingSeconds(){
  const start = Number(localStorage.getItem(START_KEY));
  if(!start) return TIME_LIMIT_SECONDS;
  const elapsed = Math.floor((Date.now() - start) / 1000);
  return Math.max(0, TIME_LIMIT_SECONDS - elapsed);
}

// ================== ELEMENTOS ==================
const startCard = $("startCard");
const lockBox = $("lockBox");
const loginBox = $("loginBox");
const startBtn = $("startBtn");
const studentNameInput = $("studentName");

const topBar = $("topBar");
const who = $("who");
const timeSpan = $("time");

const quizCard = $("quizCard");
const qNumber = $("qNumber");
const qText = $("qText");
const optionsBox = $("options");

const feedback = $("feedback");
const fbTitle = $("fbTitle");
const fbText = $("fbText");

const hintBtn = $("hintBtn");
const hintBox = $("hintBox");
const hintText = $("hintText");

const prevBtn = $("prevBtn");
const nextBtn = $("nextBtn");
const progress = $("progress");

const submitRow = $("submitRow");
const sendBtn = $("sendBtn");

const resultCard = $("resultCard");
const resultText = $("resultText");
const resultDetails = $("resultDetails");

// ================== ESTADO ==================
let timerInterval = null;
let studentName = "";
let current = 0;

// Guarda respostas do aluno: { index: "A"|"B"|"C"|"D" }
const answers = {}; // ex: answers[0]="C"

// ================== BLOQUEIO (1 tentativa) ==================
if(isLocked()){
  lockBox.classList.remove("hide");
  loginBox.classList.add("hide");
} else {
  // Se recarregou e já tinha iniciado
  const existingStart = localStorage.getItem(START_KEY);
  const existingName  = localStorage.getItem(NAME_KEY);
  if(existingStart && existingName){
    studentName = existingName;
    begin();
  }
}

// ================== INICIAR ==================
startBtn.addEventListener("click", () => {
  const name = studentNameInput.value.trim();
  if(name.length < 5){
    alert("Digite seu nome completo (mínimo 5 caracteres).");
    return;
  }
  studentName = name;
  localStorage.setItem(NAME_KEY, studentName);
  localStorage.setItem(START_KEY, String(Date.now()));
  begin();
});

function begin(){
  startCard.classList.add("hide");
  topBar.classList.remove("hide");
  quizCard.classList.remove("hide");

  who.textContent = studentName;

  // estado inicial do botão enviar
  sendBtn.disabled = true;

  render();
  tick();
  timerInterval = setInterval(tick, 1000);
}

function tick(){
  const remain = getRemainingSeconds();
  timeSpan.textContent = formatTime(remain);

  if(remain <= 0){
    clearInterval(timerInterval);
    setStatus("⛔ Tempo esgotado. O envio foi bloqueado.");
    sendBtn.disabled = true;
    nextBtn.disabled = true;
    lockAttempt();
  }
}

// ================== VISIBILIDADE DO PRÓXIMO (REGRA DA Q10) ==================
function updateNextVisibility(total){
  const isLast = current === total - 1;

  // Na questão 10 (última), o botão "Próximo" some
  if(isLast){
    nextBtn.classList.add("hide");
  } else {
    nextBtn.classList.remove("hide");
  }
}

// ================== RENDER ==================
function render(){
  const total = QUESTIONS.length;
  const q = QUESTIONS[current];

  qNumber.textContent = `${current + 1}.`;
  qText.textContent = q.text;
  progress.textContent = `Questão ${current + 1} de ${total}`;

  // dica fechada por padrão
  hintBox.classList.add("hide");
  hintBtn.querySelector("span").textContent = "Mostrar dica";
  hintText.textContent = q.hint;

  // feedback escondido até responder
  feedback.classList.add("hide");
  feedback.classList.remove("ok","bad");

  // montar opções
  optionsBox.innerHTML = "";
  const chosen = answers[current]; // pode ser undefined

  Object.entries(q.options).forEach(([key, label]) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "optBtn";
    btn.inner
