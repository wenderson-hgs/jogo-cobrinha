/* Jogo da Cobrinha — interface: canvas, teclado, D-pad e recorde local.
 * Toda a regra do jogo vive em jogo.js (lógica pura).
 */
(function () {
  "use strict";

  const { criarJogo, passo, definirDirecao } = window.Snake;

  const CELULA = 24;
  const COLUNAS = 20;
  const LINHAS = 20;

  const canvas = document.getElementById("tela");
  const ctx = canvas.getContext("2d");
  canvas.width = COLUNAS * CELULA;
  canvas.height = LINHAS * CELULA;

  const elPontos = document.getElementById("pontos");
  const elRecorde = document.getElementById("recorde");
  const overlay = document.getElementById("overlay");
  const tituloOverlay = document.getElementById("overlay-titulo");
  const textoOverlay = document.getElementById("overlay-texto");
  const botaoReiniciar = document.getElementById("botao-reiniciar");

  const CHAVE_RECORDE = "cobrinha:recorde";
  let recorde = Number(localStorage.getItem(CHAVE_RECORDE)) || 0;
  elRecorde.textContent = recorde;

  let estado = null;
  let iniciado = false;
  let pausado = false;
  let cronometro = null;

  /* ---------- ciclo ---------- */

  function novoJogo() {
    estado = criarJogo({ colunas: COLUNAS, linhas: LINHAS });
    iniciado = false;
    pausado = false;
    elPontos.textContent = "0";
    mostrarOverlay("🐍 Jogo da Cobrinha", "Use as setas, WASD ou os botões para começar", "Jogar");
    desenhar();
    agendar();
  }

  function agendar() {
    clearTimeout(cronometro);
    if (!estado || estado.status !== "jogando") return;
    cronometro = setTimeout(tique, Math.max(60, 150 - estado.pontos * 3));
  }

  function tique() {
    cronometro = null;
    if (!estado || estado.status !== "jogando") return;
    if (iniciado && !pausado) {
      passo(estado);
      if (estado.status !== "jogando") {
        fimDeJogo();
        return;
      }
      elPontos.textContent = estado.pontos;
      desenhar();
    }
    agendar();
  }

  function fimDeJogo() {
    let titulo = "💥 Fim de jogo!";
    if (estado.status === "vitoria") titulo = "🏆 Você encheu o tabuleiro!";
    let texto = `Você fez ${estado.pontos} ponto(s).`;
    if (estado.pontos > recorde) {
      recorde = estado.pontos;
      localStorage.setItem(CHAVE_RECORDE, String(recorde));
      elRecorde.textContent = recorde;
      texto += " 🎉 Novo recorde!";
    }
    texto += ` Recorde: ${recorde}.`;
    mostrarOverlay(titulo, texto, "Jogar de novo");
    desenhar();
  }

  /* ---------- desenho ---------- */

  function retanguloArredondado(x, y, s) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, 6);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, s, s);
    }
  }

  function desenhar() {
    ctx.fillStyle = "#f7f6fc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // grade sutil
    ctx.strokeStyle = "rgba(30, 27, 75, 0.06)";
    ctx.lineWidth = 1;
    for (let i = 1; i < COLUNAS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELULA, 0);
      ctx.lineTo(i * CELULA, canvas.height);
      ctx.stroke();
    }
    for (let j = 1; j < LINHAS; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * CELULA);
      ctx.lineTo(canvas.width, j * CELULA);
      ctx.stroke();
    }

    // maçã
    if (estado.comida) {
      const cx = estado.comida.x * CELULA + CELULA / 2;
      const cy = estado.comida.y * CELULA + CELULA / 2;
      ctx.fillStyle = "#dc2626";
      ctx.beginPath();
      ctx.arc(cx, cy, CELULA * 0.34, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#16a34a";
      ctx.fillRect(cx - 2, cy - CELULA * 0.48, 4, 6);
    }

    // cobrinha (cabeça escura, corpo com rastro)
    estado.cobrinha.forEach((c, i) => {
      ctx.fillStyle = i === 0 ? "#4c1d95" : `rgba(124, 58, 237, ${Math.max(0.35, 1 - i * 0.045)})`;
      retanguloArredondado(c.x * CELULA + 2, c.y * CELULA + 2, CELULA - 4);
    });

    // olhos da cabeça, olhando na direção do movimento
    const d = { cima: { x: 0, y: -1 }, baixo: { x: 0, y: 1 }, esquerda: { x: -1, y: 0 }, direita: { x: 1, y: 0 } }[estado.direcao];
    const p = { x: d.y, y: -d.x }; // perpendicular
    const hx = estado.cobrinha[0].x * CELULA + CELULA / 2;
    const hy = estado.cobrinha[0].y * CELULA + CELULA / 2;
    ctx.fillStyle = "#fff";
    [
      [hx + d.x * 4 + p.x * 4, hy + d.y * 4 + p.y * 4],
      [hx + d.x * 4 - p.x * 4, hy + d.y * 4 - p.y * 4],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /* ---------- overlay ---------- */

  function mostrarOverlay(titulo, texto, botao) {
    tituloOverlay.textContent = titulo;
    textoOverlay.textContent = texto;
    botaoReiniciar.textContent = botao || "OK";
    overlay.classList.remove("oculto");
  }
  function esconderOverlay() {
    overlay.classList.add("oculto");
  }

  botaoReiniciar.addEventListener("click", () => {
    if (estado && estado.status !== "jogando") {
      novoJogo();
      return;
    }
    if (!iniciado) {
      iniciado = true;
      esconderOverlay();
    }
  });

  /* ---------- controles ---------- */

  function comandar(dir) {
    if (!estado || estado.status !== "jogando") return;
    if (!iniciado) {
      iniciado = true;
      esconderOverlay();
    }
    definirDirecao(estado, dir);
  }

  const MAPA_TECLAS = {
    ArrowUp: "cima", ArrowDown: "baixo", ArrowLeft: "esquerda", ArrowRight: "direita",
    w: "cima", W: "cima", s: "baixo", S: "baixo", a: "esquerda", A: "esquerda", d: "direita", D: "direita",
  };

  document.addEventListener("keydown", (e) => {
    const dir = MAPA_TECLAS[e.key];
    if (dir) {
      e.preventDefault();
      comandar(dir);
      return;
    }
    if (e.key === " " || e.key === "p" || e.key === "P") {
      e.preventDefault();
      if (!estado || estado.status !== "jogando" || !iniciado) return;
      pausado = !pausado;
      if (pausado) mostrarOverlay("⏸ Pausado", "Aperte espaço para continuar", "");
      else esconderOverlay();
    }
  });

  document.querySelectorAll("[data-dir]").forEach((b) =>
    b.addEventListener("click", () => comandar(b.dataset.dir)),
  );

  novoJogo();
})();
