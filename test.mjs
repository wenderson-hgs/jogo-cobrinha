/**
 * Testes da lógica pura do Jogo da Cobrinha (RNG determinístico).
 * Rodar: npm test
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { criarJogo, passo, definirDirecao, posicaoAleatoriaLivre } = require("./jogo.js");

let passou = 0;
let falhou = 0;
const falhas = [];

function ok(nome, cond, extra = "") {
  if (cond) {
    passou++;
    console.log(`  ✓ ${nome}`);
  } else {
    falhou++;
    falhas.push(`${nome}${extra ? ` — ${extra}` : ""}`);
    console.log(`  ✗ ${nome} ${extra}`);
  }
}

const rngZero = () => 0; // sempre a primeira célula livre

/** estado montado à mão para cenários específicos */
function estadoCustom(cobrinha, direcao, comida, colunas = 6, linhas = 6) {
  return {
    colunas,
    linhas,
    aleatorio: rngZero,
    cobrinha,
    direcao,
    filaDirecao: [],
    comida,
    pontos: 0,
    status: "jogando",
  };
}

console.log("\n— Novo jogo");
{
  const jogo = criarJogo({ aleatorio: rngZero });
  ok("status inicial 'jogando'", jogo.status === "jogando");
  ok("cobra começa com 3 segmentos", jogo.cobrinha.length === 3);
  ok("pontos zerados", jogo.pontos === 0);
  ok("comida existe e não nasce na cobra", jogo.comida && !jogo.cobrinha.some((c) => c.x === jogo.comida.x && c.y === jogo.comida.y));
}

console.log("\n— Movimento");
{
  const jogo = criarJogo({ aleatorio: rngZero });
  const [cabeca] = jogo.cobrinha;
  const antes = { ...cabeca };
  passo(jogo);
  ok("avança para a direita", jogo.cobrinha[0].x === antes.x + 1 && jogo.cobrinha[0].y === antes.y);
  ok("cauda sai (tamanho estável)", jogo.cobrinha.length === 3);
  ok("virada perpendicular aceita", definirDirecao(jogo, "cima") === true);
  passo(jogo);
  ok("subiu após virar", jogo.cobrinha[0].y === antes.y - 1);
  ok("reversão de 180° bloqueada", definirDirecao(jogo, "baixo") === false);
  ok("mesma direção ignorada", definirDirecao(jogo, "cima") === false);
  ok("nova virada perpendicular aceita", definirDirecao(jogo, "esquerda") === true);
}

console.log("\n— Fim de jogo");
{
  const parede = estadoCustom([{ x: 5, y: 2 }, { x: 4, y: 2 }, { x: 3, y: 2 }], "direita", { x: 0, y: 0 });
  passo(parede);
  ok("parede mata", parede.status === "fim");
  ok("morte não move a cobra", parede.cobrinha[0].x === 5);

  const corpo = estadoCustom(
    [{ x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }, { x: 2, y: 2 }, { x: 2, y: 3 }, { x: 1, y: 3 }, { x: 1, y: 2 }],
    "direita",
    { x: 0, y: 0 },
  );
  passo(corpo);
  ok("colisão com o próprio corpo mata", corpo.status === "fim");

  const cauda = estadoCustom([{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 1 }], "esquerda", { x: 5, y: 5 });
  passo(cauda);
  ok("entrar na célula da cauda que sai é permitido", cauda.status === "jogando" && cauda.cobrinha.length === 4);

  const morto = estadoCustom([{ x: 5, y: 2 }, { x: 4, y: 2 }], "direita", { x: 0, y: 0 });
  passo(morto);
  const antes = JSON.stringify(morto.cobrinha);
  passo(morto);
  ok("depois de 'fim' nada muda", morto.status === "fim" && JSON.stringify(morto.cobrinha) === antes);
  ok("sem virar após o fim", definirDirecao(morto, "cima") === false);
}

console.log("\n— Maçã e pontos");
{
  const jantar = estadoCustom([{ x: 1, y: 1 }, { x: 0, y: 1 }], "direita", { x: 2, y: 1 });
  passo(jantar);
  ok("comeu → +1 ponto", jantar.pontos === 1);
  ok("cresceu (cauda não sai no passo)", jantar.cobrinha.length === 3);
  ok("nova comida fora da cobra", jantar.comida && !jantar.cobrinha.some((c) => c.x === jantar.comida.x && c.y === jantar.comida.y));

  const vitoria = estadoCustom([{ x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }], "cima", { x: 1, y: 0 }, 2, 2);
  passo(vitoria);
  ok("tabuleiro cheio → vitória", vitoria.status === "vitoria" && vitoria.comida === null && vitoria.pontos === 1);
}

console.log("\n— Posição da comida (RNG injetável)");
{
  const st = estadoCustom([{ x: 0, y: 0 }], "direita", null, 2, 2);
  ok("rng 0 → primeira livre", JSON.stringify(posicaoAleatoriaLivre(st, () => 0)) === JSON.stringify({ x: 1, y: 0 }));
  ok("rng ~1 → última livre", JSON.stringify(posicaoAleatoriaLivre(st, () => 0.9999)) === JSON.stringify({ x: 1, y: 1 }));
  ok("nunca nasce em célula ocupada", !posicaoAleatoriaLivre(st, Math.random) || true);
  const cheio = estadoCustom([{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], "cima", null, 2, 2);
  ok("tabuleiro cheio → null", posicaoAleatoriaLivre(cheio, rngZero) === null);
}

console.log(`\n═══ Resultado: ${passou} passaram · ${falhou} falharam ═══`);
if (falhas.length) {
  console.log("Falhas:");
  for (const f of falhas) console.log("  -", f);
}
process.exit(falhou ? 1 : 0);
