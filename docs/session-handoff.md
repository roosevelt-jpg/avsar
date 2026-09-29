# Session handoff - Avsar platform

Newest entry first. Each entry carries date, time and the authoring account.

---

## Bloco 7 - 2026-09-29 - abilio.diz@smithandadams.com (Claude Opus 5)

### Produção ligada ao Supabase

Variáveis empurradas para o Vercel a partir do `.env.local` com
`scripts/push-env.sh`. Sete em produção: URL, anon, service role, salt,
PAYMENT_PROVIDER, CV_MODEL, COHORT_ID. Stripe e Anthropic ficaram de fora por
estarem vazias localmente.

**Produção e desenvolvimento partilham a mesma base de dados.** Não há projeto
Supabase de pré-produção. Qualquer inscrição feita no site público entra na
mesma tabela onde se testa.

### ALLOW_SIMULATED_PAYMENTS

Com Supabase ligado e Stripe não, o candidato ficava em `pending` para sempre e
era expulso da avaliação, que exige `paid`. A flag deixa passar, mas é opt-in
explícito e não consequência de faltar uma chave: assim, uma secret do Stripe
que caia num deployment a sério nunca distribui avaliações grátis em silêncio.
Rastreável por `payments.status = 'simulated'`.

Está a `true` em produção só para a demonstração. **Tirar antes de cobrar a
alguém a sério.**

### Estado

Produção: https://avsar-platform-bay.vercel.app - /en, /en/signin, /admin e
/en/pricing todos a responder 200.

---

## Bloco 6 - 2026-09-29 - abilio.diz@smithandadams.com (Claude Opus 5)

### Geração do relatório

Fecha o buraco em que o candidato pagava, fazia a avaliação e o dashboard lhe
dizia para sempre que a relatório não estava pronta. Era a única parte onde o
que a aplicação fazia e o que as páginas legais prometem não coincidiam.

- Percurso pelas quatro secções: skills → experience → english → profile.
  Sem `?section=`, a página retoma na primeira que ainda não foi submetida.
- `POST /api/assessment/submit` fecha a secção pela RPC, e quando todas
  estiverem dentro pontua e escreve em `reports`.
- Pontuação no servidor com a service role. `reports` não tem policy de escrita
  desde a 0001, por isso a base recusaria de qualquer forma - é cinto e
  suspensórios numa coisa que decide se alguém tem emprego.
- `0004_reports.sql`: `refresh_candidate_percentile()` para quem acaba agora, e
  `refresh_cohort_percentiles()` para re-ordenar a cohort toda ao fecho. Ambas
  service-role. O percentil de quem acaba cedo fica desactualizado à medida que
  outros são pontuados; daí a segunda função.

### Correcção de desenho

`dash.breakdownLabels` era uma lista fixa de cinco eixos de hospitality no
dicionário. Um motorista não tem "housekeeping standards". Os eixos passam a
vir do banco de itens e são guardados em `reports.breakdown` como
`[{label, score}]`; o dashboard desenha a partir daí. Chave removida do
dicionário para ninguém lhe voltar a pegar.

### Por correr

`supabase/migrations/0004_reports.sql` - dado ao Abílio no chat.

### Estado

- `tsc`, `eslint`, `next build` limpos

---

## Bloco 5 - 2026-09-29 - abilio.diz@smithandadams.com (Claude Opus 5)

### Plataforma unificada

Pedido do Abílio: um só sítio, um só login, encaminhamento por papel, para poder
mostrar de ponta a ponta da landing ao dashboard. Três papéis confirmados:
Candidato, Empregador, Admin (staff).

- `/[locale]/signin` é agora a única entrada. `/admin/signin` só redirecciona,
  para links antigos não partirem.
- Os dois mecanismos (password e código) estão na mesma página, em vez de a
  página pedir o email e escolher. Escolher revelaria se um endereço é de staff
  antes de alguém provar quem é, o que faz do login um directório de quem lá
  trabalha.
- `/auth/route` decide o destino no servidor, a partir da sessão. O formulário
  nunca diz para onde quer ir. Um `next` explícito só é respeitado se for
  same-origin E o papel o permitir.
- `getViewer()` verifica staff → empregador → candidato, do mais privilegiado
  para o menos, para uma conta que seja as duas coisas cair sempre no mesmo
  sítio.
- `AccountMenu` partilhado em todos os cabeçalhos: mudar de superfície deixa de
  parecer sair do produto.
- `/admin` aberto a staff e a empregadores. A coluna de revisão de CV e os
  separadores de cohorts e placements só aparecem a staff. RLS confirma: nenhuma
  policy dá `cv_assessments` a um empregador.

### Para testar o papel de empregador

Não há registo de empregadores (são criados por staff). Criar o utilizador em
Authentication → Users e depois ligar com o SQL que está na resposta do chat.

### Estado

- `tsc`, `eslint`, `next build` limpos

---

## Bloco 4 - 2026-09-29 10:30 WEST - abilio.diz@smithandadams.com (Claude Opus 5)

### Ambiente local a funcionar

Supabase ligado, login de staff a funcionar. Projeto Supabase do Avsar:
`wxuucmvlvotagwptarbd` (NÃO confundir com `ytpunwmowptmiaddxixb`, que é o
hygge-checkin). Migrations 0001, 0002 e 0003 corridas. Staff user criado.

Usadas as chaves **legacy** (JWT, `eyJhbGci...`), não as novas
`sb_publishable_`/`sb_secret_`. Funcionam. Nunca clicar em "Disable JWT-based
API keys" no painel, que desliga exactamente estas.

### Bug corrigido: proxy no sítio errado

O `middleware.ts` estava na raiz do projeto. Com pasta `src/`, o Next
**ignora-o em silêncio**: sem erro, sem aviso. A auth parecia funcionar porque
login e redirect não dependem dele; só quando o token expirasse, uma hora
depois, é que o candidato era atirado para fora a meio da avaliação, com o
`expires_at` da tentativa a continuar a correr.

Movido para `src/proxy.ts` e renomeado de `middleware` para `proxy`, que é a
convenção do Next 16. Confirmado em execução: os tempos de cada pedido passaram
a mostrar `proxy.ts: Nms`.

### Quase-incidente

O Abílio esteve a copiar chaves de API com o seletor do Supabase no
`hygge-checkin`. Se as migrations tivessem corrido lá, o Hygge de produção
ficava com as tabelas do Avsar e com um trigger em `auth.users` a disparar em
cada registo. Não aconteceu. Fica a nota: **confirmar sempre o projeto no
seletor do topo antes de correr SQL ou copiar chaves.**

Risco associado que continua a existir: a 0001 tem
`create or replace function touch_updated_at()`, nome genérico o suficiente
para colidir com outros projetos se alguma vez for corrida no sítio errado.

### Próximo buraco funcional

Nada escreve em `reports`. O candidato paga, faz a avaliação, e o dashboard
diz-lhe sempre "a tua relatório ainda não está pronta" - que é exactamente
aquilo por que ele pagou e que as páginas legais prometem. É o próximo passo.

Depois: bucket `cvs` no Storage + ecrã de upload, variáveis no Vercel,
webhook do Stripe para produção.

---

## Bloco 3 - 2026-09-29 - abilio.diz@smithandadams.com (Claude Opus 5)

### Autenticação implementada

Era o bloqueio de tudo. Detalhe em `docs/auth.md`.

- `middleware.ts` + `src/lib/supabase/middleware.ts` - refresh da sessão em cada
  pedido. Server Components não podem escrever cookies, por isso é o único sítio
  onde os cookies de auth são escritos.
- `src/lib/auth.ts` - `getSessionCandidate`, `requireCandidate`,
  `getSessionStaff`, `requireStaff`.
- `/[locale]/signin` - candidato, OTP para o email registado.
  `shouldCreateUser: false`: quem nunca se inscreveu não pode criar conta a
  pedir um código.
- `/admin/signin` - staff, email + password.
- `/auth/signout` - POST only.

Email e não SMS porque SMS na Índia exige registo DLT na TRAI e provedor
contratado. O caminho do telefone está documentado e são três alterações.

### Ligações a dados reais

- Dashboard lê o candidato da sessão e o `reports` dele. Sem relatório mostra
  "ainda não está pronta" em vez de um score falso.
- Avaliação cria a tentativa por `start_assessment_attempt()`. O sector vem do
  registo do candidato, não da query string. Candidato não pago é reencaminhado
  para o checkout.
- `/admin` e `/admin/review` exigem `requireStaff()` quando há Supabase.

### Dois buracos de segurança fechados na 0003

1. `attempts_self_all` da 0001 permitia `for all`, ou seja o candidato inseria a
   própria tentativa e escolhia o próprio `expires_at`. Um temporizador que o
   candidato define não é um temporizador. Agora só leitura + RPC security
   definer.
2. `cv_decisions_insert_staff` da 0002 só verificava `reviewer = auth.uid()`.
   Qualquer utilizador autenticado podia registar uma decisão sobre qualquer
   avaliação. Agora exige também `is_staff()`.

### Migrations

0001, 0002 e 0003 todas corridas com sucesso pelo Abílio. Staff user criado.

### Por fazer

1. Bucket `cvs` no Supabase Storage + ecrã de upload de CV. A API
   `/api/cv/assess` assume o ficheiro já em storage.
2. Variáveis no Vercel: `./scripts/push-env.sh` (a secret key exposta no chat
   foi rodada).
3. Webhook do Stripe para o URL de produção.
4. Geração do relatório: não há nada que escreva em `reports`, por isso o
   dashboard mostra sempre "não pronta" com dados reais.
5. Recuperação de conta para candidato sem acesso ao email.
6. Deployment Protection no Vercel enquanto não houver revisão jurídica.

### Estado

- `npx tsc --noEmit` limpo
- `npx eslint .` limpo
- `npx next build` limpo, 38 páginas
- Não testado em browser

---

## Bloco 2 - 2026-09-28 12:00-12:55 WEST - abilio.diz@smithandadams.com (Claude Opus 5)

### Publicado

- GitHub privado: `abiliodiz-cell/avsar-platform`, ligado ao Vercel.
- Vercel produção: https://avsar-platform-bay.vercel.app
- Conta Vercel `abiliodiz-cell`. Autor dos commits = `abilio.diz@smithandadams.com`,
  que coincide com o email dessa conta (ver [[feedback_git_author_suzan_vercel]]).

### Next.js 16

O Vercel recusa deployar 15.5.x: o advisory aberto do Next só tem correcção na
16. Subido para 16.3.6. Consequências tratadas:
- removida a chave `eslint` do next.config.ts (não existe na 16)
- eslint-config-next 16 é flat config nativa; removido @eslint/eslintrc
- duas regras novas do React Compiler (`react-hooks/purity`,
  `react-hooks/immutability`) corrigidas na origem, não silenciadas:
  escrita do cookie → `src/lib/i18n/locale-cookie.ts`,
  leitura de `Date.now` → `src/lib/clock.ts`
- o build falhou primeiro com Turbopack a não resolver `next/font/google`.
  Era `node_modules` obsoleto do upgrade in-place, não o código. Reinstalação
  limpa resolveu.
- `npm audit` passou a 0 vulnerabilidades

### Avaliação de CVs por AI

Pedido do Abílio a meio do bloco. Implementado em `src/lib/cv/`.

Dois passes deliberadamente separados:
1. `extract.ts` vê o documento todo, inclui identidade, não pontua nada.
2. `rate.ts` vê só o que `redact.ts` deixa passar, e pontua contra a rubrica.

`toRatingInput()` é uma **allowlist**, não denylist: acrescentar um campo ao
schema de extracção não o faz chegar silenciosamente ao modelo que pontua.

Controlos (detalhe em `docs/ai-rating.md`):
- identidade em tabela separada `cv_protected_attributes`, sem policy nenhuma
- cada score exige evidência; sem evidência a UI diz "unsupported"
- pesos recalculados do nosso lado (`weightedOverall`), não vêm do modelo
- decisão é humana: `cv_review_decisions`, reviewer vem da sessão
- razão obrigatória em override, no Zod E em check constraint
- model + prompt_version + rubric_version + document_hash em cada avaliação
- candidato pode ver o raciocínio (policy `cv_assessments_self`)
- empregadores NÃO vêem o score de AI (nenhuma policy lho dá)
- `cv_outcome_monitor` para vigiar disparate impact

Porquê tanto rigor: AI Act classifica avaliação de candidatos em recrutamento
como alto risco (Anexo III), e o Art. 22 do RGPD proíbe decisão puramente
automatizada com efeito significativo.

Batch API em `src/lib/cv/batch.ts` para volume de cohort: metade do preço.

### Novos ecrãs

- `/dev` - índice de todos os ecrãs, **só em desenvolvimento**, 404 em produção.
  O handoff proíbe a barra de navegação do protótipo, por isso é página separada.
- `/admin/review/[id]` - revisão de CV com evidência e decisão humana.
  `/admin/review/sample` mostra um exemplo trabalhado sem precisar de API key.

### Migrations

- `0001_init.sql` - schema base (o Abílio já correu num projeto Supabase novo)
- `0002_cv_ai.sql` - **por correr**: cv_documents, cv_assessments,
  cv_protected_attributes, cv_review_decisions, cv_outcome_monitor

### Incidente

12:50 - o Abílio colou uma secret key do Supabase (`sb_secret_...`) no chat.
Avisado para a rodar. Não foi escrita em ficheiro nenhum nem commitada.
`scripts/push-env.sh` existe exactamente para evitar isto: lê de `.env.local` e
empurra para o Vercel sem os valores passarem pela conversa.

### Por fazer

1. Correr `0002_cv_ai.sql` no Supabase.
2. Rodar a secret key exposta, preencher `.env.local`, correr
   `./scripts/push-env.sh`.
3. Bucket de storage `cvs` no Supabase + fluxo de upload do CV (ainda não existe
   ecrã de upload; a API `/api/cv/assess` assume o ficheiro já em storage).
4. Auth. Continua a ser o bloqueio de tudo: RLS está escrita contra
   `auth.uid()` mas não há sign-in. Candidato por OTP WhatsApp/SMS.
5. Calibração da rubrica: 100 CVs, dois recrutadores, comparar com o modelo.
6. Deployment Protection no Vercel enquanto a revisão jurídica não estiver feita.

### Estado

- `npx tsc --noEmit` limpo
- `npx eslint .` limpo
- `npx next build` limpo
- `npm audit` 0 vulnerabilidades
- Não testado em browser

---

## Bloco 1 - 2026-09-28 11:00-11:58 WEST - abilio.diz@smithandadams.com (Claude Opus 5)

### O que foi feito

Plataforma criada de raiz em `~/Code/avsar-platform` a partir do handoff de
design em `~/Desktop/design_handoff_avsar_platform`. Next.js 15 (App Router) +
TypeScript strict + Tailwind v4 + Supabase.

Os 7 ecrãs da Direcção A estão implementados, mais a Direcção B como variante
isolada. `tsc`, `eslint` e `next build` passam limpos. 32 páginas geradas.

**Implementado**
- Tokens da Direcção A em `src/app/globals.css` (@theme), Direcção B scoped em
  `[data-variant="b"]`.
- Dicionário i18n EN/HI em `src/lib/i18n/dictionary.ts`. Copy da landing
  reproduzida verbatim do protótipo; Hindi estendido a signup, assessment,
  dashboard e FAQ conforme o handoff pedia.
- Landing candidato, landing empregador, signup 3 passos + sucesso, assessment,
  dashboard, pricing + FAQ, admin talent search.
- Páginas legais (selection-rules, refund-policy, privacy, contact) porque o
  disclosure das probabilidades aponta para elas. Marcadas DRAFT.
- Schema completo com RLS em `supabase/migrations/0001_init.sql`.

**Mudanças a meio do bloco (pedido do Abílio)**
- Pagamentos passaram de Razorpay para **Stripe** como rail por omissão.
- Entidade fica registada no **Dubai**.
- Criada abstracção `src/lib/payments/` com adaptadores Stripe e Razorpay atrás
  da mesma interface. `PAYMENT_PROVIDER` escolhe.

### Decisões que precisam de confirmação

1. **UPI.** Uma conta Stripe do Dubai não consegue cobrar UPI nem net banking:
   são instrumentos domésticos indianos e só existem em contas Stripe
   registadas na Índia. Os radios de UPI e net banking aparecem desactivados
   quando o rail activo é Stripe. Ver `docs/payments.md` para as três opções.
2. **Entidade indiana.** O Emigration Act exige agente de recrutamento
   registado para recrutar na Índia para emprego no estrangeiro. Uma entidade
   dos Emirados não pode ter esse registo.
3. **Entidade portuguesa.** O pedido de autorização de trabalho via IEFP é
   feito pelo empregador português.
4. **GST/OIDAR.** Fornecedor estrangeiro de serviço digital a consumidor indiano
   é responsável por 18% de GST na Índia e tem de se registar.
5. **AI Act.** Sistemas de IA em recrutamento e selecção são alto risco na UE.
   O schema já regista decisões e mantém revisão humana; falta a documentação
   formal se houver triagem automática.

### Próximo passo sugerido

Auth. Tudo o resto depende dela: as políticas RLS estão escritas contra
`auth.uid()` mas não há fluxo de sign-in. Candidato deve entrar por OTP em
WhatsApp ou SMS no número de telemóvel, o que também o verifica.

Depois: verificação de identidade (IDfy/HyperVerge/Signzy), teste de inglês
externo, geração do PDF do relatório.

### Estado

- `npx tsc --noEmit` limpo
- `npx eslint .` limpo
- `npx next build` limpo, 32 páginas, First Load JS 102-109 kB
- Não testado em browser (por preferência do Abílio: poupar créditos)
- Sem git init ainda
