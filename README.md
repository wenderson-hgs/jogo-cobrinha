# 🐍 Jogo da Cobrinha

Clássico **Snake** em `<canvas>`, com **lógica pura isolada e testada**,
recorde salvo no navegador, controles por teclado **e D-pad na tela para
celular**. Zero dependências — abre o `index.html` e joga.

![Node](https://img.shields.io/badge/node-%E2%89%A518-brightgreen)
![deps](https://img.shields.io/badge/depend%C3%AAncias-0-blueviolet)
![licença](https://img.shields.io/badge/licen%C3%A7a-MIT-yellow)

## 🎮 Como jogar

| Ação | Controle |
|------|----------|
| Mover | **Setas** ou **W A S D** (ou os botões ▲◀▼▶ da tela) |
| Pausar | **Espaço** ou **P** |
| Recomeçar | botão do overlay |

A cobrinha **acelera a cada maçã** (150 ms → mínimo 60 ms por passo).
Bater na parede ou no próprio corpo encerra; quem cobrir o tabuleiro inteiro
recebe a tela de **vitória**. O recorde fica salvo no `localStorage`.

## ✨ Detalhes de implementação

- **Lógica 100% pura em `jogo.js`** — sem DOM, sem canvas; a interface só
  desenha o estado e envia comandos. Isso permite testar o jogo inteiro no
  Node, sem navegador.
- **RNG injetável** — a posição da maçã vem de uma função de aleatoriedade
  passável como parâmetro, deixando os testes **determinísticos**.
- **Fila de direções (máx. 2)** — permite curvas rápidas entre dois ticks,
  mas **bloqueia reversão de 180°** (morte injusta ao apertar duas teclas no
  mesmo instante).
- **Regra clássica de cauda**: entrar na célula onde a cauda está é
  permitido, porque ela sai no mesmo passo — exceto quando a cobra come e
  cresce no tick.
- **Vitória real**: se a cobra encher o tabuleiro, `posicaoAleatoriaLivre`
  devolve `null` e o jogo termina em 🏆 em vez de quebrar.

## 🧪 Testes

```bash
npm test
```

Cobre: estado inicial, movimento, fila de direções, reversão bloqueada,
parede, colisão com o corpo, exceção da cauda, maçã (+ponto/crescimento),
vitória, "nada muda após o fim" e determinismo do RNG.

## 🗂 Estrutura

```
jogo-cobrinha/
├── index.html    # página única (canvas + HUD + D-pad)
├── style.css     # paleta branco + roxo + azul-noite
├── app.js        # interface: render, teclado, D-pad, recorde, loop
├── jogo.js       # lógica PURA: criarJogo, passo, definirDirecao
└── test.mjs      # testes da lógica (npm test)
```

## 🎯 O que este projeto demonstra

- **Separação total entre regra e visual** (estado headless + renderizador)
- **Testabilidade por design**: injeção de dependência (RNG), estados
  montados à mão nos testes
- **Detalhes que separam jogo bom de joguinho**: fila de inputs, regra da
  cauda, pausa, recorde persistente, tela de vitória
- **Zero dependências**, roda offline

## 🧭 Próximos passos possíveis

- Obstáculos por nível / modo "mundo infinito" (bordas que teleportam)
- Dois jogadores no mesmo teclado
- Sons via Web Audio API

## Licença

MIT — Wenderson
