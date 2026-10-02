# Session handoff - S&A Recruitment platform

Newest entry first. Each entry carries date, time and the authoring account.

---

## Bloco 25 - 02 Oct 2026, 10:20, abilio.diz@smithandadams.com

**Email ligado.** Resend, nao SES. Escrito adaptador Resend em
`src/lib/email/index.ts` (tenta Resend primeiro, SES fica como alternativa).
Todas as mensagens levam `Reply-To: ENTITY.supportEmail`, porque
`mail.smithandadams.com` e so de envio e nao tem caixa.

No Vercel (producao, preview, development): `RESEND_API_KEY`, `EMAIL_FROM` =
no-reply@mail.smithandadams.com, `CRON_SECRET` (48 chars, gerado localmente).
O `scripts/push-env.sh` ja conhece estas e as do SES.

Verificado contra producao, sem enviar nada:
- `api.resend.com/domains` -> `mail.smithandadams.com | verified | eu-west-1`
- `/api/cron/signup-reminders` sem segredo -> 401; com segredo -> 200 e
  **`{"mailer":"resend"}`**, ou seja a producao apanhou as variaveis e o mailer
  esta vivo e nao em noop.
- `/api/cv/assess` sem autenticacao -> 401.

Supabase SMTP configurado pelo Abilio (remetente, nome, rate limits).

A key do Resend foi colada no chat. Abilio decidiu **nao rodar**. Fica
registado.

**Falta so o teste que precisa de caixa de correio**: inscricao com um email
real, confirmar que o link chega e que ao clicar o aviso do dashboard
desaparece e o relatorio fica descarregavel.

Em aberto, por ordem: pagamentos (Abilio), imagens dos placeholders (comecado,
fonte = Wikimedia Commons com licenca verificavel por ficheiro), item de
speaking do assessment e um placeholder sem captura de audio apesar de a seccao
anunciar "Reading, grammar, speaking", `SELECTION_FUNNEL.basis` por reconciliar
com registos reais, revisao legal da pagina de selection-rules, Deployment
Protection, e a questao CAE/IEFP adiada pelo Abilio.

## Bloco 24 - 01 Oct 2026, 23:50, abilio.diz@smithandadams.com

Pedido: plataforma funcional a 100% excepto pagamentos (que o Abilio trata).

**Lado do staff exercitado de ponta a ponta** com conta temporaria: login,
pesquisa, fila de CVs, ecra de review, e **decisao gravada** (200 em
`/api/cv/decision`). O ecra de review diz que o score e sugestao e nao decisao,
e que o candidato tem direito ao raciocinio.

**Tres paginas do nav nao existiam** (`/admin/shortlists`, `/admin/cohorts`,
`/admin/placements`): davam 404. Construidas. Mais `/admin/employers`, que nao
estava sequer no nav.

**O lado do empregador era inalcancavel.** `employers` tinha uma linha,
`employer_users` tinha zero, e nada no produto conseguia criar a ligacao.
Agora `/admin/employers` cria empresa e primeiro login no mesmo pedido, e a
lista mostra "none, cannot sign in" quando falta contacto. O contacto e criado
sem password e recebe link de recuperacao.

Nav extraido para `AdminShell`: era inline na pagina de pesquisa e ligava a
paginas que nunca existiram.

`COHORT.assessedCount: 20418` era um numero inventado que aparecia no cabecalho
do staff ao lado da contagem real. Passou a `assessedCount()`, contado da base.
`cohortSize`/`selectedPerCohort` (restos do 1-em-20.000) apagados: nada os lia.

Confirmado a correr: as 6 paginas devolvem 200; criar empregador devolve 200
com `invited:false` e `"Error sending recovery email"`, que e o comportamento
honesto desenhado para quando o SMTP esta em baixo.

Limpeza: todos os registos de teste apagados. Ficam 6 candidatos reais, 1
employer (Hotel Demo Lisboa, do Abilio), 1 staff.

**Unica dependencia dura que resta, alem dos pagamentos: SMTP.** Sem ele nao ha
verificacao de email (logo nao ha download de relatorio) nem convite a
empregador.

## Bloco 23 - 01 Oct 2026, 22:40, abilio.diz@smithandadams.com

Pipeline de CV exercitado com um PDF real (CV indiano de housekeeping,
construido de proposito com detalhes pessoais: data de nascimento, sexo, estado
civil, religiao, nome do pai, morada). Extraccao correcta contra o conteudo
conhecido: dois cargos, datas, responsabilidades, competencias, formacao,
linguas. Score 77, requires_review true, 2 discrepancias (nome e email, que sao
do teste).

**Dois problemas reais encontrados.**

1. **`/api/cv/assess` nao tinha autorizacao nenhuma** e corre na service role.
   Qualquer pessoa com um documentId disparava duas passagens de modelo e lia um
   CV do bucket ignorando RLS. Agora exige staff com sessao ou
   `Authorization: Bearer $CRON_SECRET`. Confirmado: 401 sem credencial, 200 com
   o secret. A unica pagina que o chama ja era `requireStaff`, nao parte nada.

2. **Dados protegidos chegavam ao armazenamento por texto livre.** O CV trazia
   nome do pai e morada; o schema nao tinha onde os por; o modelo escreveu uma
   nota a dizer que existiam e que deviam ser excluidos, **nomeando-os**; a nota
   atravessou a fronteira de redaccao e ficou em `cv_assessments.profile`.
   O rating **nunca os viu** (`extractionNotes` nao esta em `RatingInput`, a
   allowlist aguentou), mas ficaram persistidos e visiveis ao staff.
   Correccao em duas partes: `otherPersonalDetails` nos `protectedAttributes`,
   para tudo ter onde aterrar e ser conhecido; e `scrubNotes()`, que remove por
   string todos os valores capturados antes de gravar, sem depender de o modelo
   obedecer. Reconfirmado numa segunda corrida: perfil guardado limpo.

`/api/talent/search` tambem nao tem guarda de rota, mas usa o cliente com RLS e
a vista `talent_pool` e `security_invoker`, por isso um anonimo nao ve nada. Fica
anotado como defesa em profundidade, nao como buraco.

Custo medido: extraccao + rating 3.225 in / 3.851 out, ~2 minutos.

## Bloco 22 - 01 Oct 2026, 21:15, abilio.diz@smithandadams.com

**Career pack exercitado a serio pela primeira vez**, EN e HI, com perfil
completo gravado pelo `PUT /api/profile` do proprio site (RLS exercitada, nao
contornada).

**Bug encontrado a primeira chamada:** o modelo devolveu 5 strengths, o schema
limitava a 4, o `messages.parse()` rebentou e **51 segundos de geracao paga
foram deitados fora** com um 500 para o candidato. Os limites passaram a ser
tolerancias: o schema admite alguns a mais, o prompt diz os numeros, e
`trimPack()` corta ao tamanho das paginas.

Medidas (em docs/ai-rating.md): EN 855 in / 3.086 out / 45s. Com hindi 874 in /
6.179 out / 84s. A traducao praticamente duplica output e tempo.

Qualidade: `unsupported_lines` vazio nas duas corridas. Todos os bullets
apontam para uma frase que existe mesmo no perfil. O conselho e concreto
(palavras portuguesas do dia-a-dia, vocabulario de seguranca quimica em ingles,
numeros reais para citar na entrevista). O CV fica em ingles, como devia.

Tambem exercitado: `PUT /api/profile` com experiencias e educacao.

Por estrear ainda: upload e leitura de CV, lado do empregador/staff, webhook
de pagamentos.

Limpeza: contas de demonstracao apagadas, `.env.development.local` removido.

## Bloco 21 - 01 Oct 2026, 20:10, abilio.diz@smithandadams.com

**Correccao a um bug que eu proprio introduzi hoje.** O `emailConfirmed` fazia
`email_verified_at || auth.users.email_confirmed_at`. Com o "Confirm email"
desligado, que e a configuracao que enviamos, e com contas criadas pela service
role, essa coluna vem preenchida a nascenca. Resultado: **a barreira do
relatorio passava para toda a gente**, ou seja, nao existia.

Agora so conta `candidates.email_verified_at`, escrito num unico sitio, o
`/auth/callback`, para quem seguiu um link enviado para aquele endereco.

Consequencia a assumir: **enquanto nao houver SMTP, ninguem verifica e ninguem
descarrega relatorio.** E a falha correcta. O relatorio demora 7 dias de
qualquer forma, por isso ha margem, mas o SES passa a estar no caminho critico.

## Bloco 20 - 01 Oct 2026, 19:35, abilio.diz@smithandadams.com

Filme dois montado. `SA-walkthrough-EN.mp4` e `-HI.mp4`, 1920x1080, 30fps,
58s, legendas queimadas, cursor desenhado. Fonte em
`scratchpad/shoot/`: `shoot.mjs` (captura), `film.html` (timeline seekable),
`render.mjs` (frames), ffmpeg para encode. Mesmo corte, duas queimas.

O relatorio do dashboard foi escrito na conta de demonstracao (74/B2/78/66,
percentil 19) porque o script responde ao calhar e dava 19/100. Ecra real,
dados com forma real, conta de demonstracao.

Tres correccoes encontradas a montar:
- `€1000` -> `€1,000` na divulgacao (homepage, checkout, termos).
- A frase de consentimento ainda dizia **"limited to about 1 candidate per
  cohort"**, o enquadramento antigo do 1-em-20.000, que contradiz o funil
  publicado e os 32%. Reescrita em EN e HI, e passa a incluir os EUR 1.000 e a
  condicao. E o texto que o candidato aceita: era o pior sitio para estar
  desactualizado.
- Enquadramento do dashboard nas capturas.

Limpeza: contas de demonstracao apagadas, `.env.development.local` removido.

## Bloco 19 - 01 Oct 2026, 18:40, abilio.diz@smithandadams.com

**Bug real de perda de respostas, corrigido.** O `AssessmentRunner` guardava com
um unico `saveTimer` partilhado por todas as perguntas e um `fetch` sem esperar
resposta:

- Responder a duas perguntas dentro de 250ms fazia `clearTimeout` ao timer da
  primeira, e a resposta da primeira **nunca era enviada**.
- Clicar "Finish section" dentro dos 250ms submetia a tentativa antes do save
  sair; o servidor recusava, correctamente, e a ultima resposta da seccao
  perdia-se.
- `fetch` so rejeita em erro de rede, por isso 409 e 500 passavam pelo ramo de
  sucesso e o ecra dizia "Saved" na mesma.

Agora: mapa de pendentes por item (nada e cancelado por uma resposta posterior),
`flush()` esperado antes de submeter, estado `error` quando o servidor recusa,
e o pendente fica para nova tentativa.

**Rotulos falsos no relatorio, corrigidos.** `englishNote` e `skillsNote` eram
strings fixas: **todos** os relatorios diziam "Independent user" e "Strong",
independentemente da pontuacao. Quem tirasse 0 era descrito como "Strong", e A1
era descrito como "independent user", que A1 por definicao nao e. Agora derivam
do numero (`src/lib/report/bands.ts`), em EN e HI. O PDF nao tinha este
problema.

`expNote` dizia "{years} years, verified" sobre anos **auto-declarados** no
registo. Passou a "as stated".

O stall da rodagem era outra vez o meu script: na ultima pergunta de um
sub-bloco o botao ja e "Finish section", e clicar nele inicia submit mais
navegacao; voltar a sondar 140ms depois encontrava o botao desactivado e a
pergunta antiga, o que nao e um stall. Corrigido no script. Assessment completo
corre ate ao fim, sem 409.

## Bloco 18 - 01 Oct 2026, 17:30, abilio.diz@smithandadams.com

**Mudanca de modelo comercial, decidida pelo Abilio:** os EUR 1.000 passam a
ser pagos pelo **candidato**, so depois de emprego confirmado e contrato
assinado. `PLACEMENT_FEE.payer = 'candidate'`.

Objeccoes ditas antes da decisao e registadas em docs/commercial-terms.md, nao
apagadas: Emigration Act indiana (tecto de ~20.000 rupias; isto sao ~92.000) e
DL 260/2009 (proibe cobrar colocacao ao candidato).

Consequencias no produto, todas derivadas da constante:
- `CANDIDATE_PAYS_NO_PLACEMENT_FEE` passou a false, por isso a caixa "you never
  pay us for the job itself" desapareceu sozinha da homepage.
- `visibleToCandidates` passou a true: valor e condicao na homepage, nos termos
  e **acima da checkbox de consentimento no checkout**, antes de se cobrarem os
  25 EUR. A checkbox e o registo de que foi mostrado.
- Termos: acrescentado que nunca e adiantado, nunca condicao para ser
  considerado, nunca condicao para entrevista.
- `placementFee` / `placementFeeShort` em EN e HI.

Guioes dos videos por reescrever com os quatro pontos novos.

## Bloco 17 - 01 Oct 2026, 16:40, abilio.diz@smithandadams.com

**Correccao ao Bloco 16.** O suposto bug do `/api/assessment/answer` **nao era
um bug do produto**. Era o meu script de rodagem: a regex que avancava de
pergunta era `^(next|submit|finish|continue)` e apanhava **"Finish section"**,
submetendo a seccao a meio. Depois disso o servidor recusava, correctamente,
escrever respostas numa tentativa ja submetida. A proteccao estava a funcionar.
Confirmado em log: `[answer] attempt already submitted`.

Tambem nao e bug o "Question 1 of 12" seguido de "Question 8 of 8": sao
sub-blocos diferentes dentro da mesma seccao de 20 (ROOM CHECK, CHEMICALS,
SHARPS).

Fica um defeito menor, esse real, e corrigido: a rota devolvia **500** a uma
recusa legitima. Um candidato que lhe batesse via um botao morto sem
explicacao. Agora distingue `session_expired` (401), `attempt_unknown`,
`attempt_submitted` e `attempt_expired` (409).

**Anomalia por fechar:** com o script ja a nao clicar em Finish, a ultima
pergunta de um sub-bloco ainda apanhou um 409 e o "Finish section" ficou
desactivado, com a pagina presa. Pode ser auto-submit ao Next da ultima
pergunta mais uma corrida com o POST seguinte. **Nao confirmei que um humano
consiga chegar a esse estado.** E o proximo trabalho a serio.

`ENTITY.phone = '+351 938 227 348'` (dado pelo Abilio). As paginas legais
deixam de mostrar o aviso de falta.

Decisoes do Abilio: retencao fica como esta, nada apaga linhas. Supabase ja
configurado por ele. Stripe fica do lado dele.

Limpeza: contas de teste apagadas, 6 candidatos reais intactos.

## Bloco 16 - 01 Oct 2026, 15:20, abilio.diz@smithandadams.com

Rodagem do walkthrough. 13 frames capturados a 3840x2160 (viewport 1920x1080,
dsf 2) com puppeteer-core contra o Chrome do sistema, em
`scratchpad/shoot/frames/`. Falta so o dashboard com relatorio completo.

**Dois bugs reais encontrados a filmar.**

1. **Registo partido em producao.** `signUp` devolvia 500 "Error sending
   confirmation email": o "Confirm email" continua LIGADO no Supabase e o
   emissor interno nao consegue enviar. Qualquer candidato a inscrever-se via
   "Something went wrong". **Corrigido**: o `/api/auth/register` passa a
   garantir sessao nos tres cenarios (confirmacao off, confirmacao on sem
   sessao, mailer em baixo -> `admin.createUser` + `signInWithPassword`). O
   registo deixou de depender do sistema de email, que era a intencao do
   desenho e so agora e verdade.

2. **`/api/assessment/answer` devolve 500 a meio do assessment.**
   `new row violates row-level security policy for table "assessment_answers"`.
   Reproduzivel: acontece algures na seccao 1, depois de varias respostas
   gravadas com sucesso. O botao "Finish section" fica desactivado e o
   candidato fica preso. **POR CORRIGIR.** Suspeita: o cliente envia um
   `attemptId` de uma tentativa ja submetida (as policies exigem
   `submitted_at is null`), ou a contagem de itens muda entre renders
   ("Question 1 of 12" e depois "Question 8 of 8" na mesma seccao de 20).

Nota de conteudo: um "Chef" recebe perguntas de housekeeping, porque o banco e
por sector e nao por posicao. Para a rodagem usei "Cleaner".

Limpeza: as 11 linhas de teste criadas foram apagadas, com os auth users. Os 6
candidatos reais nao foram tocados.

## Bloco 15 - 01 Oct 2026, 13:05, abilio.diz@smithandadams.com

`0009` e `0010` corridos pelo Abilio.

- `/api/auth/resend-verification`: reenvia o link, endereco lido da sessao e
  nunca do pedido; 429 e mostrado em vez de mentir.
- `VerifyEmailBanner` no dashboard, so enquanto `email_verified_at` for null.
  E aviso, nao muro: o relatorio e que espera.
- `src/lib/email`: interface de mailer com no-op por omissao (mesma forma que
  os provedores de pagamento) e implementacao SES pela API assinada v4, sem SDK.
  Por configurar: `AWS_SES_*` e `EMAIL_FROM`.
- `/api/cron/signup-reminders` + `vercel.json` (09:00 UTC diario), guardado por
  `CRON_SECRET`. 3 lembretes a 1, 3 e 10 dias, contados desde o ultimo contacto.
  Contador na linha; so incrementa se o mailer aceitou.
- `/api/unsubscribe`: GET e POST sem sessao, token HMAC do id, so escreve
  `unsubscribed_at`. List-Unsubscribe e List-Unsubscribe-Post nos cabecalhos.

**Nada apaga linhas.** De proposito: apagar e o unico passo irreversivel aqui e
a regra de retencao devia ser decisao, nao omissao.

Por configurar no Vercel: `CRON_SECRET`, `AWS_SES_REGION`,
`AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY`, `EMAIL_FROM`.

**O video de walkthrough nunca foi feito.** Formato: horizontal (decidido
01/10). Falta decidir legendas gravadas ou faixa limpa. Os guioes escritos
antes descrevem o fluxo antigo (codigo por email) e estao desactualizados.

## Bloco 14 - 01 Oct 2026, 11:40, abilio.diz@smithandadams.com

Conta criada no passo 1 com password, sessao iniciada logo, email de
verificacao a ir atras sem nada ficar a espera dele. Decisao do Abilio.

- `0010_account_first.sql` (**por correr**): colunas de perfil passam a aceitar
  null; constraint `candidates_paid_profile_complete` garante que quem pagou
  tem perfil completo; `email_verified_at` proprio nosso; `profile_completed_at`;
  `reminder_count` / `last_reminder_at` / `unsubscribed_at`; vista
  `candidate_lifecycle` com mql_registered / mql_profiled / sql.
- `/api/auth/register`: responde as duas perguntas que o browser nao pode
  responder (email ja tem conta, telemovel ja e de outro) e so depois faz
  signUp. O upsert por phone_hash deixou de poder sobrescrever a linha de quem
  ja pagou.
- `/api/signup` deixou de criar linha: completa o perfil na linha da sessao.
- `auth.ts`: papel novo `registered` (sessao sem candidato) para fechar o loop
  de redirecionamento; `homeFor` retoma no passo onde pararam; `canReach` do
  assessment passa a exigir pagamento; `canReceiveReport`.
- `/auth/callback?verify=1` carimba `email_verified_at`.
- `report.pdf` devolve 403 sem email verificado.
- Password minima 8, campo no passo 1, `autoComplete="new-password"`.

**Depende de definicoes no dashboard Supabase** (ver docs/auth.md): Confirm
email **OFF**, Redirect URLs, leaked-password check, e SMTP real (SES). Sem o
SMTP real sao 2 emails/hora no projecto inteiro.

Por fazer: ecra de "confirma o teu email" com reenvio, aviso no dashboard
quando falta verificar, e o cron dos lembretes (3 no maximo, com unsubscribe).

## Bloco 13 - 30 Sep 2026, 19:20, abilio.diz@smithandadams.com

`ENTITY.statementDescriptor = 'SA RECRUITMENT'`, e o passo de pagamento do
signup passa a dizer como a cobranca aparece no extrato e que S&A Recruitment
e nome comercial da Benefit Discovery, Lda. Uma disputa de UPI nao se contesta,
por isso sai mais barato dize-lo antes. **O mesmo descritivo tem de ser posto
no dashboard da Stripe**, senao os dois discordam.

Objecto social / CAE 78100 / licenca IEFP: levantado e **adiado pelo Abilio**
nesta data. Fica registado no `docs/stripe-onboarding.md`, nao apagado.

## Bloco 12 - 30 Sep 2026, 18:55, abilio.diz@smithandadams.com

Decidida a entidade: **Benefit Discovery, Lda** (NIPC 517818817, Av. da
Liberdade 69 4.º A, Lisboa), nao a SMTADM do Dubai. Motivo no
`docs/stripe-onboarding.md`: AE nao esta na lista de business locations do UPI.

`ENTITY` em `src/lib/data/brand.ts` passou para a empresa portuguesa, com
`tradingAs: 'S&A Recruitment'` e `registrationLabel: 'NIPC'`. O
`EntityDetails` mostra agora a firma, o nome comercial e o NIPC.

`ENTITY.phone` ficou **vazio de proposito**: nao passei o movel do Dubai para
uma empresa portuguesa. Enquanto estiver vazio as paginas legais mostram o
banner de falta em vez de um numero errado. Falta o Abilio dar um numero PT.

Gerente unica e (desde 23.05.2024) socia unica: Teresa Claudia Viegas Gama,
NIF 310597501. E ela que tem de fazer o onboarding da Stripe ou ser o account
representative; a Stripe retem payouts ate o representante estar verificado.

Nada de dados pessoais no repo: nem numero de CC, nem IBAN, nem codigo da
certidao permanente.

Por resolver: objecto social e CAE (43350 construcao, nao 78100 colocacao de
pessoal) e a licenca IEFP do DL 260/2009 para agencia privada de colocacao.

## Bloco 11 - 30 Sep 2026, 18:10, abilio.diz@smithandadams.com

Tres formatos de CV (Standard / Europass / Professional), rota
`/[locale]/dashboard/cv.pdf?template=`, e o career pack traduzido para a
lingua do candidato (o CV fica em ingles). Commit e deploy feitos.

Documentos societarios da SMTADM lidos (licenca DED 1174293, MOA, passaportes
dos dois socios, conta AED). Escrito `docs/stripe-onboarding.md`.

Dois factos que decidem a conta Stripe:

1. A lista de business locations do UPI (docs.stripe.com/payments/upi) inclui
   PT e **nao inclui AE**. Uma conta Stripe no Dubai nao aceita UPI, netbanking
   nem qualquer via indiana: so cartao e Link. Para cobrar EUR 25 a candidatos
   na India isso e fatal.
2. A licenca DED tem uma unica atividade, Real Estate Buying & Selling
   Brokerage, que nao cobre esta plataforma.

Recomendacao registada: conta na entidade portuguesa (acct_1ULJUeDdQLZiXO6m,
country PT, charges nao ativos), nao no Dubai. Decisao ainda do Abilio.

Nenhum dado de passaporte foi introduzido em formularios nem escrito no repo.

Por correr: `0009_career_pack.sql` (inclui a coluna `translated`), confirmar
`0008_it_sector.sql`.

## Bloco 11 - 2026-09-29 - abilio.diz@smithandadams.com (Claude Opus 5)

Notas de reunião do Abílio implementadas.

### Rebrand

Avsar -> **S&A Recruitment**, agência de recrutamento sob a marca Smith &
Adams. Wordmark, metadados, rodapés, PDF, emails de contacto
(candidates@ / employers@ / report@ smithandadams.com).

A marca-mãe vai no próprio wordmark e não só no rodapé: essa associação é a
única razão pela qual um candidato na Índia tem motivo para confiar nisto.

### Termos comerciais centralizados

Tudo o que uma reunião pode mudar vive em `src/lib/data/brand.ts`:
taxa €25 (mostrada ₹2.299), resposta em 15 dias, contrato de 5 anos.

O preço em rupias é **conversão de apresentação** de um preço em euros, não um
segundo preço, e `inrPerEur` actualiza-se deliberadamente. Um preço que muda
entre ler e pagar é como alguém acaba a pagar mais do que o site dizia.

### Posições

Quatro áreas e dez posições das notas não encaixavam: soldadores e logística
não pertencem a food & beverage nem a IT. `positions.ts` tem **cinco** áreas,
com um grupo de trades e logística, porque a alternativa era arquivar um
soldador em property management.

O candidato escolhe **posição**; áreas são navegação. `0007_positions.sql`
acrescenta `position` a `candidates` (text, não enum: a lista muda sempre que
o negócio abre um cargo) e faz backfill a partir do sector antigo.

**IT não tem banco de itens.** Um data analyst recebe neste momento perguntas
de hospitality. Tem de ser resolvido antes de anunciar essa posição.

### Dois termos implementados mas DESLIGADOS

**`PLACEMENT_FEE` (€1.000), `visible: false`.** Cobrar a um trabalhador para
finalizar a colocação viola a Directiva 2008/104 e o DL 260/2009 em Portugal,
excede quatro a cinco vezes o tecto do Emigration Act indiano
(₹20.000 ou 45 dias de salário, o menor), contraria os princípios ILO, e é o
padrão que os quadros anti-tráfico tratam como indicador de servidão por
dívida. Com a marca Smith & Adams em cima, a exposição é da empresa.
A versão que funciona é o **empregador** pagar; `PLACEMENT_FEE.payer` existe
para isso ser uma palavra.

**`SELECTION_RATE` (32%), `visible: false`** até `basis` dizer de onde vem o
número. A plataforma não colocou ninguém, logo não tem taxa própria. As notas
dizem 32% e "30 em cada 100", que são afirmações diferentes. Uma taxa publicada
é o que induz alguém a pagar; sem fundamento é a diferença entre cobrar por uma
avaliação e receber dinheiro sob falso pretexto.

Detalhe em `docs/commercial-terms.md`.

### Copy nova

Seis passos (registar, documentos, avaliação, pagamento, chamada, carta de
confirmação), o que o candidato recebe (contrato 5 anos, alojamento,
alimentação, apoio legal), secção de documentos com o que é obrigatório e o que
acelera, e FAQ reescrita. Tudo em EN e HI.

Referência a "1 em 20.000" removida. No lugar ficou a resposta em 15 dias, que
é uma promessa verificável.

### Stripe do Dubai com UPI: não existe

Repetido ao Abílio. UPI na Stripe só existe em contas registadas na Índia. O
caminho real é um fornecedor com licença PA-CB do RBI.

### Por correr

`supabase/migrations/0007_positions.sql`.

---

## Bloco 10 - 2026-09-29 15:30 WEST - abilio.diz@smithandadams.com (Claude Opus 5)

### Chave da Anthropic configurada

O Abílio decidiu **não revogar** a chave que colou no chat. Está gravada no
`.env.local` e empurrada para os três ambientes do Vercel. Fica registado que
continua exposta no histórico da conversa: se um dia mudar de ideias, é revogar
no console e repetir `./scripts/push-env.sh && vercel deploy --prod --yes`.

Regra guardada em memória: [[feedback_secrets_via_env_file]] - dizer "não coles
aqui" na mesma frase em que peço uma credencial, não depois.

### Bug: segunda secção vazia

Reportado pelo Abílio: "No items available for this section" ao passar da
primeira para a segunda secção.

Causa: as secções têm tamanhos diferentes (skills 12, experience 8). A rota não
muda entre elas, só o parâmetro, por isso o React mantinha a mesma instância do
componente e o índice da pergunta com ela. Índice 11 numa lista de 8.

Corrigido com `key={section}` no runner, mais um clamp no índice como segunda
defesa.

### Bug maior que o anterior destapou

As respostas eram gravadas a cada clique e **nunca lidas de volta**. Quem saísse
a meio de uma secção e voltasse via tudo em branco e respondia outra vez, com o
relógio do servidor a correr.

Pior que o bug reportado porque não dava erro nenhum: parecia funcionar e
silenciosamente fazia a pessoa trabalhar duas vezes. Era exactamente o requisito
de resume-after-disconnect que estava escrito na documentação e nunca tinha sido
implementado até ao fim.

Agora as respostas carregam com a secção e a avaliação abre na primeira por
responder.

### Estado da infraestrutura

Migrations 0001 a 0006 todas corridas. Bucket `cvs` criado e privado. Tabelas
todas a responder. `ANTHROPIC_API_KEY` configurada local e em produção.

Candidato de demonstração: `abilio+candidato@smithandadams.com`, password
`Avsar-demo-65250012` (descartável, apagar antes de produção a sério).

### Próximo passo

O Abílio estava a meio do percurso de ponta a ponta quando a aplicação fechou.
Retomar em `/en/assessment`, que agora retoma na pergunta certa.

Depois do percurso completo, o que falta é a leitura de CV em `/admin/cvs` -
primeira operação que gasta dinheiro a sério, dois passes de modelo por
documento.

---

## Bloco 9 - 2026-09-29 - abilio.diz@smithandadams.com (Claude Opus 5)

Os quatro pontos cosméticos que eu próprio tinha listado, fechados.

### 1. Fila de CVs

`/admin/cvs`, staff only. Lista todos os CVs carregados, estado no pipeline, e
botão para disparar a leitura por AI. Continua a ser disparo manual: cada
leitura custa por documento e quem carrega o ficheiro errado quatro vezes não
deve ser quatro avaliações. A página avisa se faltar `ANTHROPIC_API_KEY`.

### 2. Banco de itens: 11 -> 75

Um ficheiro por sector em `src/lib/assessment/bank/`, para um supervisor de
hospitality poder ler o ficheiro de hospitality e dizer se as perguntas são
justas. Ninguém revê utilmente uma lista de cem.

**Bug que isto expôs e que corrigi:** a pontuação percorria o banco inteiro, por
isso um candidato de hospitality era avaliado contra perguntas de andaimes que
nunca viu, e o denominador afundava todos os scores. `score()` passou a receber
o sector.

### 3. PDF do relatório

`/[locale]/dashboard/report.pdf`, com @react-pdf/renderer. Gerado a pedido e não
guardado: o percentil muda quando a cohort é re-ordenada, e uma cópia velha num
bucket significa o candidato a mostrar um número que já não bate com o que o
empregador vê.

Candidato só descarrega o seu. Staff descarrega qualquer um com `?candidate=`.

### 4. Inglês: junção para fornecedor externo

`src/lib/english/provider.ts` com a interface e sem adaptador, porque o
adaptador é um contrato comercial. `0006_english.sql` acrescenta a proveniência
ao relatório: `english_source`, `english_certified` (coluna **gerada**, nunca
true para `internal`), referência de certificado e validade.

O `talent_pool` trata certificado expirado como não certificado. O PDF diz por
palavras se há ou não um terceiro a responder pelo número.

Comparação dos três fornecedores e a recomendação de duas fases (banco interno
para todos, teste certificado só para shortlist) em `docs/english-assessment.md`.

### Por correr

- `0005_profiles.sql` (do bloco anterior)
- `0006_english.sql`

### Falta configurar

`ANTHROPIC_API_KEY` no `.env.local` e no Vercel, senão a fila de CVs não lê nada.

---

## Bloco 8 - 2026-09-29 - abilio.diz@smithandadams.com (Claude Opus 5)

Direcção do Abílio: **transformar isto em ferramenta funcional de ponta a ponta,
não cosmética.** Este bloco é o primeiro passo nesse sentido.

### O dashboard estava a mentir

A linha temporal do dashboard ("Assessment completed, 5 Out 2026") era dados de
exemplo fixos desde o protótipo. Aparecia a toda a gente, incluindo a quem nunca
tinha começado. O Abílio apanhou-o na base: zero tentativas, zero relatórios, e
o ecrã a dizer que estava feito.

Substituída por `src/lib/candidate/status.ts`, que deriva tudo da base de
dados, e por `JourneyStatus`, que mostra uma acção seguinte em vez de uma lista
de tudo o que falta.

### Perfil do candidato

Campos seguindo o que os ATS pedem (SmartRecruiters, Greenhouse, Workable),
menos o que não se aplica aqui.

- `/[locale]/profile`: upload de CV **ou** preenchimento manual. As duas vias
  são de primeira classe: muitos candidatos deste corredor não têm ficheiro de
  CV nenhum, e o formulário não é um plano B para quem falha o upload.
- `0005_profiles.sql`: `candidate_profiles`, `candidate_experiences`,
  `candidate_education`, mais o bucket `cvs` e as suas policies.
- Experiência e educação em tabelas próprias e não em JSON, porque empregadores
  vão querer filtrar por anos num sector e por qualificação, e isso é uma
  query, não um documento.
- O caminho no storage é construído a partir da sessão, nunca do nome do
  ficheiro que o browser envia: o caminho É a fronteira de autorização nas
  policies do bucket.
- O upload **não** dispara a avaliação por AI. Ler um CV com um modelo custa
  dinheiro por documento, e quem carrega o ficheiro errado quatro vezes não
  deve ser quatro avaliações.

### Decisões de campos

Sem campo de expectativa salarial: um número exacto ancora uma negociação que o
candidato ainda não está em posição de ter, entre duas moedas e um custo de vida
que nunca viu. Datas com precisão de mês, não de dia.

### Por correr

`supabase/migrations/0005_profiles.sql`.

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
