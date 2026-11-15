/* Jogo da Cobrinha — lógica PURA, sem DOM e sem canvas.
 * No navegador: window.Snake  ·  nos testes: require("./jogo.js")
 *
 * A interface (app.js) só desenha o estado que esta lógica produz e envia
 * comandos (definirDirecao, passo). O RNG é injetável para testes
 * determinísticos.
 */
(function (escopo) {
  "use strict";

  const COLUNAS_PADRAO = 20;
  const LINHAS_PADRAO = 20;

  const DIRECOES = {
    cima: { x: 0, y: -1 },
    baixo: { x: 0, y: 1 },
    esquerda: { x: -1, y: 0 },
    direita: { x: 1, y: 0 },
  };
  const OPOSTA = { cima: "baixo", baixo: "cima", esquerda: "direita", direita: "esquerda" };

  function ocupada(estado, x, y) {
    return estado.cobrinha.some((c) => c.x === x && c.y === y);
  }

  /** primeira posição livre segundo o RNG — null se o tabuleiro encheu */
  function posicaoAleatoriaLivre(estado, aleatorio) {
    const livres = [];
    for (let y = 0; y < estado.linhas; y++) {
      for (let x = 0; x < estado.colunas; x++) {
        if (!ocupada(estado, x, y)) livres.push({ x, y });
      }
    }
    if (livres.length === 0) return null;
    return livres[Math.floor(aleatorio() * livres.length) % livres.length];
  }

  function criarJogo(opcoes = {}) {
    const colunas = opcoes.colunas || COLUNAS_PADRAO;
    const linhas = opcoes.linhas || LINHAS_PADRAO;
    const aleatorio = opcoes.aleatorio || Math.random;
    const cx = Math.floor(colunas / 2);
    const cy = Math.floor(linhas / 2);
    const estado = {
      colunas,
      linhas,
      aleatorio,
      cobrinha: [
        { x: cx, y: cy },
        { x: cx - 1, y: cy },
        { x: cx - 2, y: cy },
      ],
      direcao: "direita",
      filaDirecao: [],
      comida: null,
      pontos: 0,
      status: "jogando", // "jogando" | "fim" | "vitoria"
    };
    estado.comida = posicaoAleatoriaLivre(estado, aleatorio);
    return estado;
  }

  /**
   * Agenda uma virada. Regras:
   *  - não aceita reversão de 180° (morte instantânea injusta);
   *  - não aceita repetir a direção já em uso;
   *  - fila com no máximo 2 viradas (permite curvas rápidas entre 2 ticks).
   */
  function definirDirecao(estado, nome) {
    if (estado.status !== "jogando" || !DIRECOES[nome]) return false;
    const emUso = estado.filaDirecao.length
      ? estado.filaDirecao[estado.filaDirecao.length - 1]
      : estado.direcao;
    if (nome === emUso || nome === OPOSTA[emUso]) return false;
    if (estado.filaDirecao.length >= 2) return false;
    estado.filaDirecao.push(nome);
    return true;
  }

  /** avança um passo do jogo (1 tick) */
  function passo(estado) {
    if (estado.status !== "jogando") return estado;

    if (estado.filaDirecao.length) {
      estado.direcao = estado.filaDirecao.shift();
    }
    const d = DIRECOES[estado.direcao];
    const cabeca = estado.cobrinha[0];
    const nx = cabeca.x + d.x;
    const ny = cabeca.y + d.y;

    // parede mata
    if (nx < 0 || ny < 0 || nx >= estado.colunas || ny >= estado.linhas) {
      estado.status = "fim";
      return estado;
    }

    const comeu = estado.comida !== null && nx === estado.comida.x && ny === estado.comida.y;

    // corpo: se não comer, a cauda sai NESTE passo → a célula dela fica livre
    const corpo = comeu ? estado.cobrinha : estado.cobrinha.slice(0, -1);
    if (corpo.some((c) => c.x === nx && c.y === ny)) {
      estado.status = "fim";
      return estado;
    }

    estado.cobrinha.unshift({ x: nx, y: ny });
    if (comeu) {
      estado.pontos += 1;
      estado.comida = posicaoAleatoriaLivre(estado, estado.aleatorio);
      if (estado.comida === null) estado.status = "vitoria"; // encheu o tabuleiro!
    } else {
      estado.cobrinha.pop();
    }
    return estado;
  }

  const api = {
    criarJogo,
    passo,
    definirDirecao,
    posicaoAleatoriaLivre,
    DIRECOES,
    COLUNAS_PADRAO,
    LINHAS_PADRAO,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    escopo.Snake = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
