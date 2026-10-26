# Simulado v2 — o que mudou

## Para o leitor (retenção)
- **Desafio do dia**: 5 questões iguais para todos, renova a cada dia. Mantém a *sequência de dias*.
- **Nível, XP e conquistas** (8), salvos no navegador (localStorage, sem login).
- **Revisar meus erros**: fila das questões erradas; acertar tira da fila.
- **Modo prova** (cronômetro, navegação livre, marcar para revisar, gabarito só no fim) e **modo treino** (comentário imediato).
- **Resultado**: nota, desempenho por matéria, "o que revisar primeiro", gabarito comentado com artigo/regra, compartilhar.
- E-mail deixou de ser barreira: pedido só no final e opcional.
- Atalhos de teclado (A–E, C/E, Enter, setas, F).

## Conteúdo
- 5 bancas (Cebraspe, FGV, FCC, Vunesp, IBFC), 120 questões, cada uma com assunto, nível e fundamento.
- **Cebraspe em Certo/Errado** (formato real) com nota líquida (acertos − erros).
- Questões originais no estilo da banca. Removidos "ano/cargo" inventados da v1; corrigidas questões com gabarito/explicação errados.
- Seção **Provas oficiais**: portais das bancas + acervos gratuitos de provas e gabaritos.
- IA virou opcional (+5 questões inéditas, identificadas); gerador agora respeita Certo/Errado e 5 alternativas.

## Arquivos
Novos: app/simulado/{layout.js,simulado.css}, lib/{quiz-sources.js,simulado-store.js}, tests/{quiz-bank,quiz-generator}.test.js
Alterados: app/simulado/page.js, lib/quiz-bank.js, lib/quiz-generator.js, app/privacidade/page.js (cita o progresso local)

## Para ampliar o banco
Edite `lib/quiz-bank.js` (helpers `mc()` e `ce()`). `npm test` valida gabaritos, alternativas repetidas e formato.
