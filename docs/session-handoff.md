# Session handoff - S&A Recruitment platform

Newest entry first. Each entry carries date, time and the authoring account.

---

## Bloco 45 - 08 Oct 2026, abilio.diz@smithandadams.com

**Fecho das pendencias do pivot.**

### Foto do Dubai

`dubai-skyline-sunset-time-united-arab-emirates.jpg` (3000x4500, 8,6 MB) ->
`public/dubai-skyline-800.jpg` (131 KB) e `-1200.jpg` (269 KB), corte 4:5, q80
progressivo 4:2:0, mais LQIP inline. Cortada **a partir do topo e nao do
centro**: o fundo do enquadramento e a grade de uma varanda, e o que torna a
foto inequivocamente Dubai sao as torres e o Burj.

Ocupa o lugar que a foto de Lisboa deixou vago na seccao "What a selected
candidate receives". Verificado a carregar e a enquadrar.

### Cartao de partilha redesenhado

`public/brand/og.png` refeito com a hierarquia nova: o **slogan como titulo**,
"Work in the UAE." como linha de apoio, e o dominio no rodape. O anterior ainda
dizia "Work in Portugal".

### Confirmado / decidido pelo Abilio

- **Traducoes hindi e arabe aprovadas.** Deixa de estar pendente leitura por
  nativo.
- **Os 138 itens do assessment ficam a cair para ingles em arabe**, por decisao.
  Nao e falta: e escolha.
- **Migracao 0013 confirmada corrida** - `item_stats` responde 200.

### Migracoes

**Todas corridas.** 0013 confirmada por mim (`item_stats` responde 200); a 0012
confirmada pelo Abilio, que nao da para verificar de fora porque o PostgREST nao
expoe a definicao da funcao e `start_assessment_attempt` falha da mesma maneira
nas duas versoes quando chamada sem sessao.

---

## Bloco 44 - 08 Oct 2026, abilio.diz@smithandadams.com

**Video de fundo no hero, por tras de uma cortina terracota.**

### A montagem

Tres clipes do Abilio, cortados e ligados com ffmpeg:

- obra (trabalhadores em armadura de ferro), 3,2s -> 8,7s
- cozinha (empratamento), 1,2s -> 6,2s
- sala (empregada com bandeja), 1,8s -> 7,3s

Crossfades de 0,7s entre eles. **720p e nao 1080p**: esta por tras de uma camada
de cor, o detalhe perde-se de qualquer maneira, e corta metade dos bytes. Sem
audio, que num fundo nunca toca e so pesa. CRF 27, `+faststart`.

Resultado: **14,6s, 2,9 MB**. Poster de 126 KB.

### A cortina

Duas camadas, nao uma. Um preenchimento liso do acento apagava a filmagem; a
filmagem sem lavagem por baixo de tipo branco fica ilegivel no primeiro
fotograma claro.

- `bg-accent opacity-90 mix-blend-multiply` -> duotone terracota que mantem as
  formas do clipe
- gradiente `from-ink/55 via-ink/30 to-ink/75` por cima -> contraste estavel seja
  qual for a exposicao

A seccao do hero passou a `bg-ink text-paper`, e o tipo todo foi recolorido. **O
logo do grupo voltou a versao branca** - a versao em tinta tinha sido feita para
quando o hero era papel. **O slogan deixou de ser `text-accent-deep`**, que
desaparecia dentro da sua propria cor de fundo.

### Quando o video nao carrega

`HeroBackdrop` e client component com `useSyncExternalStore`. O snapshot do
servidor diz "retem", por isso o HTML servido traz **o poster e zero tags
`<video>`** (verificado com curl) e nao ha hipotese de mismatch de hidratacao.

Tres motivos para reter, qualquer um chega:

- `prefers-reduced-motion`
- `navigator.connection.saveData`
- `effectiveType` 2g ou slow-2g

O terceiro e deliberado: 3 MB de decoracao num telemovel com dados medidos, num
mercado onde os dados se compram as centenas de megabytes, e um custo cobrado
exactamente a pessoa para quem a pagina existe.

### Verificado

Desktop 1200 e telemovel 390: video a tocar, em loop, sem som, inline, texto
legivel, sem overflow horizontal. HTML servido sem `<video>`.

### Nota

Os tres clipes sao stock com rostos identificaveis. Estao como ambiente por tras
de uma cortina, nunca apresentados como candidatos nossos nem como colocacoes -
que e a distincao que o comentario das fotos ja fazia. Confirmar a licenca de
uso comercial dos tres antes de producao.

---

## Bloco 43 - 08 Oct 2026, abilio.diz@smithandadams.com

**Pivot: India -> Portugal passou a mundo -> Emirados. E arabe como 3.o idioma.**

### Dinheiro

AED em vez de INR. `ASSESSMENT_FEE` agora `eur: 25, aedPerEur: 4` -> **AED 99**.
IVA dos Emirados **5%** dentro do total, em vez de GST indiano 18%. `paise` ->
`fils`, `formatInr` -> `formatAed`, `GST_RATE` -> `VAT_RATE`, token `{inr}` ->
`{price}`. As colunas da BD (`amount_paise`, `gst_paise`) ficaram com o nome
antigo: nao houve pagamentos, mas renomear exigia migracao e ja ha duas por
correr.

### Portugal fora

79 ocorrencias em 20 ficheiros. Tres nao eram so palavras:

- **Foto dos telhados de Lisboa apagada.** Estava legendada como a cidade do
  emprego, o que num site dos Emirados e falso. **Falta uma foto do Dubai.**
- **Foto da cozinha ficou** (mostra trabalho e nao um lugar) mas o ficheiro foi
  renomeado: `/lisbon-kitchen-` no codigo-fonte e uma afirmacao sobre o destino
  que qualquer um le.
- **Dois itens do assessment ficaram errados** com a mudanca: um pedia as horas
  de conducao da UE e outro a tensao de Portugal. O primeiro passou a perguntar
  para que serve o limite, o segundo pergunta pelos Emirados. E o item de perfil
  sobre aprender portugues pergunta agora por arabe.

### Telefone

Indicativo de pais com **245 paises**, construido a partir do
`libphonenumber-js` e do `Intl.DisplayNames` - uma lista de 250 paises escrita a
mao tem erros, e os erros caem nos candidatos dos sitios que ninguem verificou.
A mesma biblioteca valida no formulario e no servidor. Guardado em **E.164**, e
o `identityHash` passou a ser do numero inteiro: antes era so da parte nacional,
e com candidatos de 200 paises isso e uma colisao a espera de acontecer.
Telefone da empresa: **+971 58 568 0441**.

Verificado contra a app: numero dos Emirados guarda `+971583116678`, invalido da
422, indiano continua a passar.

### Hero

Centrado, **sem video** (era um minuto de India e Portugal; volta quando houver
uma versao que bata certo), slogan em destaque em terracota por cima do titulo,
subheadline novo.

**Nao escrevi "N1 recruitment agency in UAE".** E alegacao de superioridade
factual, nao verificavel, e ainda nao colocaram ninguem. Ficou
`Hiring for the UAE, from anywhere in the world.` a espera de decisao.

### Arabe

`locales = ['en','hi','ar']`. Dicionario completo em `lib/i18n/ar.ts` (~425
strings, MSA, digitos ocidentais). O tipo `Dictionary` recusa um dicionario
parcial, de proposito: pagina meio traduzida e pior do que pagina atrasada.

- `localeDirection` e `dir` no wrapper do locale -> RTL herda para tudo
- Noto Sans Arabic encadeado no `--font-sans` **e** no `--font-mono` (JetBrains
  nao tem glifos arabes, e as etiquetas pequenas levam arabe)
- **Wordmark fixado em `dir="ltr"`**: o flex invertia e lia-se "Recruitment S&A".
  Um nome de empresa nao e uma frase, nao traduz e nao inverte
- `formatAed` embrulhado em isolados Unicode (U+2066/U+2069), senao o algoritmo
  bidi troca "AED 99" dentro de frases arabes
- Select de indicativo e campo de telefone tambem `dir="ltr"`

Verificado em `/ar` e `/ar/signup`: RTL correcto, 245 paises, resumo do pedido a
dar AED 94 + AED 5 IVA = AED 99, sem overflow horizontal.

### Por fazer

- **Os 138 itens do assessment nao tem arabe.** Caem para ingles, que funciona e
  nao rebenta, mas um candidato que escolheu arabe faz o teste em ingles.
- **O arabe precisa de leitura por nativo** antes de ir para a frente de alguem.
  Esta completo e cuidado; nao e o mesmo que estar verificado.
- Cartao OG ainda diz "Work in Portugal" - e imagem, tem de ser redesenhada.
- Falta foto do Dubai para o lugar dos telhados de Lisboa.
- `cashfree.ts` tira `^\+91` do telefone; so afecta esse adaptador, que nao esta
  configurado.

### Avisos dados ao Abilio

A lei dos Emirados (Decreto-Lei Federal 33/2021, art. 6) proibe uma agencia de
recrutamento de cobrar ao trabalhador, e exige licenca MOHRE para actividade de
mediacao. Posicionar como plataforma de recrutamento, para empregos nos
Emirados, a partir de uma entidade dos Emirados, cobrando ao candidato, e a
configuracao que a lei visa. A saida sugerida foi posicionar como plataforma de
**avaliacao e documentacao de carreira**, que e o que o `merchant-description.md`
ja diz que se vende pelos 25 euros.

---

## Bloco 42 - 07 Oct 2026, 11:20, abilio.diz@smithandadams.com

**Topo da landing reorganizado, em dois passos.**

Ordem agora:

1. selo `India -> Portugal · Applications open`
2. **tagline** `A recruitment agency under the Smith & Adams brand`, linha propria
   a toda a largura
3. titulo + paragrafo a esquerda, **video a direita**
4. faixa laranja `Applications are open.` + botao
5. `Positions we are hiring for`

Antes era uma coluna unica centrada (selo, titulo, paragrafo, video, selector) e
a grelha de vagas so aparecia depois dos passos, do preco, do funil e dos
documentos. A faixa laranja fechava a pagina.

Razoes: texto centrado longo le-se mal; o video ficava abaixo da dobra num
portatil, e e a unica coisa que explica o produto em menos de um minuto; quem
acaba de ver o filme esta tao pronto a candidatar-se como alguma vez estara, e
obriga-lo a descer cinco seccoes para achar o botao desperdica isso.

- O video e **segundo no markup**, por isso no telemovel a promessa vem primeiro
- A tagline saiu da faixa laranja (senao aparecia duas vezes a 300px)
- O selector de vaga e as letras pequenas desceram para baixo da grelha: ficavam
  dois selectores de vaga encostados

### Armadilha apanhada

`IntroVideo` dentro de um wrapper com `justify-self-end` colapsava: shrink-to-fit
deixa o `w-full` do figure sem nada contra o que resolver e o filme renderizava a
um terco da coluna. Agora e filho directo da grelha.

### Nota

O selo diz "Applications open" e a faixa laranja diz "Applications are open." - a
mesma mensagem duas vezes no mesmo ecra. Sugerido ao Abilio cortar o selo para so
`India -> Portugal`; por decidir.

---

## Bloco 41 - 07 Oct 2026, 10:30, abilio.diz@smithandadams.com

**Assessment "exímio e pro": bug crítico, hindi, baralhar opções, calibração.**

### Primeiro, o bug que eu tinha introduzido no Bloco 40

Escopei o banco por vaga mas **nao escopei a pontuacao**. Um item com
`positions` falha o teste `positions === undefined || positions.includes(pos)`
sempre que nao se passa posicao, por isso **todos os itens especificos da vaga
saiam do pool e nunca eram corrigidos**.

Medido, nao suposto: um chef que errou os 12 itens de chef **tirava 100** em
competencias, porque so contavam os 4 itens partilhados com o empregado de mesa,
e o relatorio mostrava 3 eixos em vez de 6. As perguntas eram feitas e deitadas
fora. Corrigido: a posicao vai da linha do candidato ate ao `score()`.

### Hindi (decisao do Abilio)

Os **138** itens nao-ingleses tem agora lado hindi: competencias, experiencia e
perfil. A seccao de ingles fica deliberadamente por traduzir - e a unica onde a
lingua e o construto.

`bank/hi.ts`, indexado por id e nao inline: um falante de hindi revê tudo de uma
sentada, e os itens ingleses continuam a ser a fonte de verdade. **As opcoes
mantem a ordem inglesa**, porque `correct` indexa um unico array e serve as duas
linguas; uma traducao com numero de opcoes diferente e descartada com erro em
vez de servida. IT mantem os termos tecnicos em ingles (pull request, LEFT JOIN,
regression testing), que e o registo real.

### Baralhar opcoes

Ordem fixa e como um teste nao supervisionado vaza: a resposta viaja como "e
sempre a B". A permutacao deriva de (tentativa, item), nao e guardada, sobrevive
a reload e resume, e e recalculada onde for preciso ler a resposta. O browser
responde na ordem que viu; a rota recalcula e guarda a numeracao do banco, para
que um mapeamento vindo do cliente nao possa reescrever o que a pessoa escolheu.
**Itens ordinais nunca sao baralhados** - a posicao e o significado.

### Calibracao

`0013_item_calibration.sql` **POR CORRER**. Tabela `item_stats`, leitura staff,
escrita so service role.

- `lib/assessment/calibration.ts`: p-value e discriminacao (ponto-bisserial
  contra o **resto** da seccao, nao contra o total - correlacionar com um total
  que inclui o proprio item infla tudo, e infla mais os piores itens)
- `/api/assessment/calibrate`: staff ou `CRON_SECRET`, so tentativas submetidas
- `score()` aceita pesos opcionais; abaixo de 30 respostas tudo pesa 1
- Pesos limitados a [0.25, 1.25]; item com discriminacao negativa e **limitado,
  nao removido** - remover esconderia uma chave errada
- `/admin/items`: tabela completa, e no topo os itens a rever com a razao

Simulacao de 120 candidatos: item com chave invertida deu -0.87 e foi sinalizado
como "answer key is probably wrong"; item que 97,5% acertam deu discriminacao
0.02 e foi sinalizado; itens normais entre 0.43 e 0.76.

### Migracoes por correr

**0012** (pagar depois do assessment) e **0013** (calibracao).

---

## Bloco 40 - 07 Oct 2026, 09:40, abilio.diz@smithandadams.com

**Perguntas por vaga e nao por sector.** O Abilio fez o assessment de chef e as
perguntas eram genericas. Eram pior do que genericas: eram de limpeza de
quartos de hotel.

### O que estava mal

Os `itemSector` juntavam trabalhos diferentes. Oito das doze vagas partilhavam
banco com outra profissao:

- chef + fb-service -> `hospitality`
- electrician + plumber -> `maintenance`
- welder + construction-worker -> `construction`
- driver + logistics -> `drivers`

E o banco de hospitality nao tinha sequer conteudo de restauracao: dos 12 itens,
8 eram governanta de hotel (ordem de arrumar um quarto ocupado, lencol manchado,
o que verificar da porta ao sair). Nao ha posicao de governanta em hospitality -
o `cleaner` esta em `cleaning`. O conteudo estava simplesmente no sitio errado.

### O que se fez

O modelo de item ja tinha o campo `positions`; so o IT o usava. Agora:

- `bank/food-beverage.ts`: CHEF (12) e FB_SERVICE (10)
- `bank/trades.ts`: ELECTRICIAN, PLUMBER, WELDER, CONSTRUCTION_WORKER (8 cada)
- `bank/logistics.ts`: DRIVER (7) e LOGISTICS (8)
- Os 6 itens de governanta foram para o banco de `cleaning`; 2 sairam (um
  duplicava um item de cleaning, o outro era telefone de recepcao)
- 10 itens de sector removidos por serem duplicados mais fracos dos novos

Cobertura: todas as 12 vagas com 8 a 16 itens e 3 a 8 eixos de relatorio.

### Porque e sobretudo conhecimento tecnico

Sackett, Zhang, Berry & Lievens (2022) corrigiu uma sobrecorreccao antiga de
restricao de amplitude nas meta-analises de selecao. Nas estimativas revistas,
testes de conhecimento tecnico preveem desempenho a .40 e work samples a .33; so
a entrevista estruturada fica acima, a .42 - e essa, neste produto, e a chamada
de avaliacao, nao este teste. Temperaturas e regras de alergenios seguem pratica
UE, porque o emprego e em Portugal; onde o numero varia entre paises, o item
pergunta o principio.

### Fica por fazer

- **Tudo esta em ingles, itens tecnicos incluidos.** Um bom cozinheiro com
  ingles fraco pontua mal na seccao de competencias por uma razao que nada tem a
  ver com cozinhar, que e o contrario do que uma seccao de ingles separada
  serve. Traduzir os itens de competencias e a maior melhoria de validade que
  resta.
- `property-manager` (8 itens, 3 eixos) e as duas vagas de IT (2 eixos) sao
  agora as mais magras. Um relatorio com 2 eixos e pouco para o que se cobra.
- Nenhum destes conjuntos foi revisto por quem faz o trabalho. Continuam nao
  calibrados.

---

## Bloco 39 - 07 Oct 2026, 09:10, abilio.diz@smithandadams.com

**Taxa de colocacao retirada do site, por instrucao do Abilio.**

`PLACEMENT_FEE.disclosed = false`. `visibleToCandidates` passou a ser
`payer === 'candidate' && disclosed`, por isso as quatro superficies que ja
liam essa flag (landing, SignupFlow, UnlockReport, e agora os termos) apagam-se
sozinhas. Novo `PLACEMENT_FEE_UNDISCLOSED` exportado para quem precisa de saber
que se esta a cobrar algo que nao foi divulgado.

- **Consentimento.** A checkbox nomeava os €1.000. A caixa e o registo do que
  alguem aceitou, por isso nao pode nomear um valor que o site nao mostra:
  variante `consentNoPlacement` em EN e HI. `CONSENT_VERSION` -> `v4-2026-10`.
- **Termos.** Tres estados agora. Com `payer = employer` dizem-no. Divulgada,
  o valor e a condicao vem por inteiro. Retirada, a seccao diz o que e verdade
  sobre a taxa de avaliacao e para: nao pode afirmar que a taxa de avaliacao e
  o unico valor cobrado, que seria falso.
- **Dicionario.** As strings sao postas a vazio no `getDictionary`. O
  dicionario inteiro e serializado para os client components, por isso deixa-las
  la publicava a frase no codigo-fonte de todas as paginas sem nenhum elemento a
  mostrar. Escondido no markup e escondido do leitor nao e a mesma coisa.

### O checkout recusa

`/api/payments/checkout` devolve **503 `disclosure_incomplete`** enquanto
`payer = candidate` e `disclosed = false`, antes mesmo de ler a sessao, porque
e uma propriedade da configuracao e nao de quem chama.

Porque: a taxa de avaliacao e o que induz o pagamento, e cobra-la a quem nao foi
informado de que se seguem €1.000 e omissao de um termo material. A nota que ja
estava no `PLACEMENT_FEE` e explicita sobre o porque de ser este o termo que
pesa: esta acima do tecto do Emigration Act indiano (₹20.000) e e a forma que os
quadros anti-trafico leem como indicador de servidao por divida.

Hoje nao custa nada: nao ha provider configurado e nao se move dinheiro. Esta la
para que, no dia em que houver, o estado escondido nao se torne um estado em que
alguem paga sem decisao de ninguem. Fecha de duas maneiras, ambas honestas:
`disclosed = true`, ou `payer = 'employer'`, que e o modelo que o mercado
portugues ja usa e o que a propria nota do ficheiro recomenda.

### Verificado

`/en`, `/en/terms`, `/en/signup` e os tres equivalentes em HI: limpos, incluindo
o payload serializado. Checkout devolve 503.

---

## Bloco 38 - 07 Oct 2026, 08:50, abilio.diz@smithandadams.com

**O site esta publicado em https://recruitment.smithandadams.com**

### Dominio

Adicionado ao projecto pelo endpoint `POST /v10/projects/{id}/domains`. O
`vercel domains add` do CLI devolve 403 `domain_not_owned`, porque
`smithandadams.com` vive noutra conta Vercel (a do site-smith); o endpoint ao
nivel do projecto aceita e devolve o desafio de verificacao.

DNS na GoDaddy (ns67/ns68.domaincontrol.com), postos pelo Abilio:

- TXT `_vercel.smithandadams.com` = `vc-domain-verify=recruitment.smithandadams.com,7c161edbfeaa289b5f38`
- CNAME `recruitment` -> `068c414715856280.vercel-dns-017.com`

Verificado, certificado emitido. `/` faz 307 para `/en`, `/en` da 200.
Redirect URLs do Supabase actualizados pelo Abilio.

### Alinhado com o dominio

- `metadataBase` dizia `avsar-platform-bay.vercel.app`. Era contra esse valor
  que resolvia cada canonical e cada cartao Open Graph.
- `alternates: { canonical: './' }`, resolvido por rota, senao todas as paginas
  diziam ser a home.
- `app/robots.ts`: **bloqueia tudo**. Abrir e `ALLOW_INDEXING=true` na Vercel,
  sem redeploy. Razao unica que resta: quem chegar de uma pesquisa acaba o
  assessment e bate num checkout que nao consegue cobrar ate a EximPe aprovar.
- `app/sitemap.ts`: landing, pricing e as seis legais, EN e HI. Nada que seja um
  passo de um percurso em vez de um destino, e nada do `/b`.

### Legais aprovadas

O Abilio confirmou. O `DraftNotice` ja nao era usado por pagina nenhuma desde
que as selection rules foram publicadas como finais a 6 Out - componente morto,
apagado. A nota do indice `/dev` ainda dizia "all marked DRAFT, all need
review"; corrigida.

### Cartao de partilha

`public/brand/og.png`, 1200x630, desenhado com Pillow a partir da geometria do
proprio simbolo (mesma bezier, mesmos circulos) sobre ink, com headline,
slogan e dominio. Estatico e nao gerado por pedido: um cartao para o site todo
e nada que corra mal no momento em que alguem decide se abre o link. Este link
viaja por WhatsApp mais do que por qualquer outra coisa.

Confirmado em producao: `og:url` por rota, `og:image` absoluto, PNG a dar 200.

### Por fazer

- `og:locale` por idioma. Ha um cartao so, em ingles.
- Nenhuma pagina legal mostra data de entrada em vigor ao leitor. O
  `CONSENT_VERSION` guarda o que cada candidato aceitou, mas quem le a pagina
  nao ve de quando e. Em termos aprovados, convem.

---

## Bloco 37 - 06 Oct 2026, 17:50, abilio.diz@smithandadams.com

**Lembretes com marca, em dois idiomas, e uma pre-visualizacao que nao envia.**

### Copy do lembrete estava errada desde que o pagamento mudou

O ramo "half" dizia *"you filled in your profile but have not completed the
₹2.299 assessment fee yet"*. Isso era verdade quando se pagava a meio do funil.
Desde que a taxa passou para o fim, quem tem perfil feito nao deve dinheiro
nenhum: falta-lhe **o assessment**. O email estava a pedir pagamento a quem nao
tinha nada a pagar, e a mandar para `/signup` em vez de `/assessment`.

Reescrito como `Stage = 'profile' | 'assessment'`:

- `profile`: abriu conta e parou -> "Your application is waiting" -> `/signup`
- `assessment`: perfil feito -> "One step left", 20 a 30 minutos, **"you pay
  nothing until you have completed it"** -> `/assessment`

### Mais

- Lembretes passam pelo `renderEmail`. `EmailLayout` ganhou `unsubscribe`, que
  sai no rodape, que e onde quem procura a saida a procura.
- **Lembretes passaram a ter hindi.** Iam sempre em ingles, mesmo com
  `row.locale = 'hi'`: a locale so era usada no URL. Agora a copy toda e EN/HI.
- Copy e composicao movidas para `lib/email/reminder.ts` (`renderReminder`),
  porque um ficheiro de route no Next so pode exportar handlers. A route do cron
  so orquestra.
- `lib/email/verification.ts` ganhou um `compose()` interno e um
  `verificationPreview()`.

### `/dev/email`, so em desenvolvimento

`?template=verification|reminder&locale=en|hi&stage=profile|assessment`. Faz
404 em producao, como o indice de ecras ao lado. Ver um email deixou de exigir
registar uma conta descartavel, esperar pelo provider e ler o HTML de volta na
API da Resend - o que e lento, deixa linhas para apagar, e nao e coisa que se
faca contra uma lista de candidatos reais so para ver um lembrete. Listado no
`/dev`.

### Verificado

`tsc`, `eslint --max-warnings=0`, `next build` limpos. As quatro variantes dao
200; lidas as de EN e HI no browser, cabecalho, botao, rodape e unsubscribe
corretos. Nenhum email enviado, nenhuma linha escrita.

---

## Bloco 36 - 06 Oct 2026, 17:35, abilio.diz@smithandadams.com

**Email de verificacao com marca.**

- `lib/email/template.ts`: a casca em que qualquer mensagem transaccional entra.
  Tabelas, estilos todos inline, nada que dependa de uma stylesheet sobreviver
  ao Gmail. Banda ink no topo com a marca, corpo em branco, botao terracota
  (tabela com bgcolor, senao colapsa no Outlook), link em texto por baixo,
  rodape com entidade legal e email de suporte.
- `Message` ganhou `html?`. Resend e SES passam-no; o `text` continua sempre
  presente e nao e um stub - e o que um cliente so-texto, um leitor de ecra em
  modo plano e os filtros de spam leem de facto.
- `public/brand/email-mark.png`: a marca desenhada com Pillow (circulo cheio,
  arco pontilhado amostrado por comprimento de arco, anel aberto), 3x com
  supersample 12x, sobre fundo ink. Nao ha rasterizador de SVG nesta maquina.

Duas restricoes de proposito:

- **Sem web font.** Os clientes ou retiram o link ou ignoram a face, e uma
  mensagem que cai para fallback de forma desigual fica pior do que uma que
  nunca tentou. A tipografia do site nao viaja; a cor e o espacamento sim.
- **Uma imagem so, e a mensagem le-se toda sem ela.** Imagens vem bloqueadas
  por omissao em muitas caixas, por isso o nome e texto vivo ao lado da marca e
  nao parte do desenho.

Copy EN e HI com preheader, heading, paragrafos, label do botao, nota de
fallback e fecho.

### Verificado

Registo real -> Resend `delivered` -> HTML puxado de volta da API da Resend e
visto a 820px e a 390px: sem scroll horizontal, imagem carrega, botao e rodape
corretos. Conta de teste apagada.

### Por fazer

O email de lembrete (`cron/signup-reminders`) ainda vai em texto. A casca ja
aceita `unsubscribeUrl` ao nivel do mailer, falta so passar o corpo pelo
`renderEmail`.

---

## Bloco 35 - 06 Oct 2026, 17:20, abilio.diz@smithandadams.com

**O email de confirmacao nunca saiu. Diagnostico e correccao.**

### Causa

`/auth/v1/settings` do projecto diz `mailer_autoconfirm = true`, ou seja
"Confirm email" esta **desligado** no dashboard. Com isso o `signUp` nao envia
nada: confirma o utilizador no instante da criacao. Confere com a auth.users -
a conta de teste de hoje tem `confirmation_sent_at = null` e
`email_confirmed_at` igual ao `created_at`.

O botao de reenvio chamava `signInWithOtp`, que entrega o envio ao mailer do
Supabase. Em 100 registos do log da Resend, a recuar ate 30 Set, **nao ha um
unico email de auth**. Ou seja o SMTP custom do Supabase nao esta a apontar
para a Resend, e o que estava a ser usado era o sender interno: 2 mensagens por
hora para o projecto inteiro e entrega so a membros da equipa Supabase. Por
isso um candidato no Gmail nao recebia nada e nao havia bounce nenhum para ver.

A Resend em si estava boa: dominio `mail.smithandadams.com` verificado,
`sending: enabled`, e os emails de leads entregam.

### Correccao

`lib/email/verification.ts` novo. Cunha o token com a service role
(`admin.auth.admin.generateLink`, que **nao envia**) e manda a mensagem pelo
mailer que ja existe, o mesmo da Resend. Fica um provider, um log, e sem
dependencia de um toggle que alguem muda noutro separador. `mailer_autoconfirm`
pode ficar ligado - alias convem, porque e o que da sessao imediata no signUp.

Usado em `/api/auth/register` e `/api/auth/resend-verification`, os dois sitios
que usavam `signInWithOtp`.

**O link vai no nosso dominio, nao no `action_link` da Supabase.** O
`action_link` aponta para o dominio do projecto e o redirect dele traz a sessao
no *fragmento* da URL, que uma route de servidor nao consegue ler: o callback
nao encontrava code nenhum, tratava a visita como anonima e mandava assinar,
sem provar nada. Entao o `/auth/callback` passou a aceitar `token_hash` e a
resolve-lo com `verifyOtp`. Bonus: o candidato ve o dominio onde se registou e
nao um subdominio de projecto, o que e a diferenca entre um link nosso e um
link que parece phishing.

Copy EN e HI dentro do modulo de email e nao no dicionario, para nao ir para o
cliente.

### Verificado ponta a ponta (dev server contra a Supabase de producao)

1. Registo -> `verificationSent: true`
2. Resend: assunto "Confirm your email address", `last_event: delivered`
3. Link seguido -> 307 para `/en/signup?resume=profile`, cookie de sessao posto
4. `candidates.email_verified_at` carimbado

Contas de teste (`abilio.diz+verify...`, `abilio.diz+link...`) apagadas depois,
linhas de candidates e auth users.

### A tratar

**Click tracking da Resend esta ligado** em `mail.smithandadams.com`. Reescreve
os links, e um token de uso unico morre se um scanner de email o pre-carregar.
Baixo risco no Gmail, real em caixas corporativas. O certo e um subdominio
separado para transaccional (ex. `auth.smithandadams.com`) com tracking
desligado; desligar no dominio actual tira as metricas das campanhas de leads.
Decisao do Abilio.

---

## Bloco 34 - 06 Oct 2026, 16:55, abilio.diz@smithandadams.com

**Filme institucional no hero**, entre o `heroSub` e o `PositionSelector`.

Fonte: `WhatsApp Video 2026-10-06 at 16.39.33.mp4`, 1920x1080, 53s, **101 MB**
a 15 Mbps. Transcodificado com ffmpeg para 1280x720 h264 CRF 23 preset slow,
`+faststart`, AAC 96k: **5,2 MB**. Poster do frame 1,6s (cartao de abertura
India - telemovel - Portugal, que por acaso e o motivo do simbolo) a 1600px,
31 KB.

- `public/video/intro.mp4`, `public/video/intro-poster.jpg`
- `components/candidate/IntroVideo.tsx`: poster + botao, o `<video>` so entra
  no DOM ao clique. Um `<video>` no markup comeca a buscar antes de alguem
  dizer que quer ver, e o publico desta pagina esta em dados moveis na India:
  o que carrega com a pagina sao 31 KB.
- Nunca toca sozinho - e uma pessoa a falar. O clique e o gesto que autoriza o
  browser a tocar com som.
- Botao de play em papel e nao em terracota: o filme abre sobre uma ilustracao
  terracota e o botao com a cor da marca lia-se como parte do desenho.
- `videoLabel` e `videoPlay` no dicionario, EN e HI.

### Em falta

Legendas. Nao ha `.vtt` e nao se inventa transcricao: fica como lacuna de
acessibilidade e tambem comercial, porque muita gente ve sem som. Assim que
houver transcricao, `<track kind="captions">` no `<video>`.

### Verificado

`tsc`, `eslint --max-warnings=0`, `next build` limpos. No browser: clique toca
(currentTime a andar, 1280x720, 53,44s), sem overflow horizontal.

---

## Bloco 33 - 06 Oct 2026, 16:40, abilio.diz@smithandadams.com

**O "How it works" refeito, e o bug que o estava a partir.**

### O bug (era isto que fazia a seccao parecer estragada)

`useInView` arrancava com `useState(() => motionIsUnwanted())`. No servidor nao
ha `window`, por isso dava `true` (visivel); no browser dava `false` (escondido).
Hidratacao com className e style diferentes do HTML servido: React reportava o
mismatch e **mantinha os atributos do servidor**, por isso blocos inteiros
ficavam presos no estado pre-animacao. Era o "1 Issue" vermelho no overlay.

Agora `useState(false)` nos dois lados. O reduced-motion ja estava resolvido so
em CSS (`motion-safe:`), por isso nao precisa de ser decidido em JS. Fallback
sem `IntersectionObserver` passou a ser um `requestAnimationFrame` (um
`setState` sincrono no corpo do efeito e erro de lint do React Compiler).

Rede de seguranca: `<noscript><style>[data-reveal]{opacity:1}</style></noscript>`
no layout, para quem tem JS desligado nao receber a pagina em branco.

`RouteLine.tsx` apagado - o arco gigante ja tinha saido da pagina e ninguem mais
o usava.

### Composicao

- Uma unica medida para a seccao toda: `mx-auto max-w-[880px]` a envolver
  titulo, lead, walkthrough e nota. Antes o titulo comecava na goteira da pagina
  e o walkthrough estava centrado por baixo: duas margens esquerdas diferentes.
- Passos deixaram de ser `text-right`/`flex-row-reverse`. A calha pontilhada
  passou para o lado de dentro, entre o telemovel e o texto, por isso a rota do
  simbolo liga mesmo as duas colunas em vez de correr na borda da pagina. Texto
  alinhado a esquerda: paragrafo com margem direita irregular era metade do
  problema de leitura.
- Painel por tras do passo aberto (`bg-white/[0.045]` + hairline). Da estrutura a
  coluna sem virar cartao.
- Wash terracota por tras do telemovel, senao assenta no fundo em vez de estar a
  frente dele.
- Contador `01 / 06` por baixo do aparelho: os ecras mudam sozinhos e sem
  contagem parecia aleatorio.
- A calha vive agora numa coluna `stretch` com o padding no texto ao lado, por
  isso a linha encontra a do passo seguinte exactamente. Com o padding no botao
  partia-se em cada passo.
- `items-center` em vez de `items-start` + sticky: a lista e mais curta que o
  telemovel, o sticky nao fazia nada.

### Outro

- Foto de Lisboa ganhou `pb-[clamp(40px,6cqi,80px)]`. Estava colada a banda
  escura do "How it works".

### Verificado

`tsc`, `eslint --max-warnings=0`, `next build` limpos. Browser a 1100px e a
390px: sem overflow horizontal, telemovel e passos alinhados na mesma medida,
painel do passo activo com folga das margens no telemovel.

---

## Bloco 32 - 06 Oct 2026, 18:10, abilio.diz@smithandadams.com

**Movimento e interactividade na landing**, tudo derivado do simbolo.

- `components/motion/`: `useInView` (observer, le o
  `prefers-reduced-motion` no primeiro render e nao num efeito, senao agenda um
  segundo render por elemento na mesma tick), `Reveal` (8px e 420ms, discreto),
  e `RouteLine`, que e a rota pontilhada do logo desenhada a largura da seccao
  com dashoffset, ponto terracota de um lado e anel do outro.
- **`PhoneWalkthrough`** no "How it works": telemovel a esquerda (sticky no
  desktop), seis passos alinhados a direita, cada um com o ecra real que produz.
  Auto-avanca de 5,2s **e para assim que o leitor escolhe um passo**. As imagens
  sao capturas reais em 390x844 dsf3, exportadas a 780 de largura.
- **`PositionGrid`**: cada posicao ganhou resumo de uma linha no mosaico e um
  `<dialog>` nativo com descricao e "o que os empregadores procuram". Copy em
  `lib/data/position-copy.ts`, EN e HI, escrita a partir das operacoes reais do
  grupo (300+ apartamentos geridos, cafes, obra de renovacao).

**Copy morta com preco errado removida.** O `/b` tinha passos do fluxo antigo
com ₹1,999, e o `signup.pay` era o botao de checkout que ja nao existe. O preco
real vem de `activePrice()` ha muito; isto eram strings orfas.

Capturas em `scratchpad/shoot/mobile.mjs`. Quando o fluxo mudar, os ecras ficam
desactualizados, o que e a falha certa: um mockup que nao pode ficar
desactualizado e um mockup que nunca foi verdade.

Limpeza: contas de demonstracao apagadas, `.env.development.local` removido.

## Bloco 31 - 06 Oct 2026, 16:15, abilio.diz@smithandadams.com

**Branding novo adoptado**, de `brand_handoff_sa_recruitment`.

- `Wordmark.tsx` reescrito: simbolo novo (ponto terracota = India, anel ink =
  Europa, rota pontilhada entre os dois) mais "S&A" a bold e "Recruitment" em
  peso menor. **A API ficou igual** (href, suffix, tone, accent), por isso os 11
  sitios que o usam nao mudaram: ja diziam fundo escuro e lado empregador, que
  sao exactamente os dois eixos que o simbolo novo precisa.
- SVGs em `public/brand/`, com o bloco C2PA removido: eram 8KB de base64 por
  ficheiro em assets servidos a cada pagina. Os originais na pasta de handoff
  mantem o deles.
- `app-icon-180/192/512.png` rasterizados do SVG. Favicon, apple-touch e
  `manifest.webmanifest` ligados no `layout.tsx`.
- Prefixo dos recibos `AV-` -> `SA-`. Os recibos ja emitidos **ficam** com o
  antigo: um recibo e o registo do que foi enviado a alguem.

Ja estava certo e nao precisou de nada: Schibsted Grotesk com 500 e 700 carrega
pelo `next/font`, titulo e copy ja eram S&A, paleta ja era a do brief.

**Dois pontos do brief nao seguidos, de proposito:**

1. O brief pede rodape `© 2026 S&A Recruitment · Lisbon · New Delhi`. Mantive
   `a Smith & Adams company`, porque o Abilio pediu depois disso que o rodape
   reforcasse a associacao a marca-mae. O brief e anterior a essa decisao.
2. `IDENTITY_HASH_SALT` continua `avsar-dev-salt` e o cookie continua
   `avsar_locale`. O salt **nao pode** mudar: rodar orfana todos os hashes de
   deteccao de duplicados. O cookie podia, mas renomea-lo so apaga a preferencia
   de lingua de quem ja a tinha.

Dominio `sa-recruitment.com` do brief: nao mexi, como o proprio brief pede.

## Bloco 30 - 06 Oct 2026, 14:50, abilio.diz@smithandadams.com

**A taxa passou para depois do assessment.** Decisao do Abilio. Registar, perfil
e assessment sao gratuitos; a taxa desbloqueia relatorio, career pack, CV e o
lugar na talent pool.

- `0012_pay_after_assessment.sql` (**por correr**): o
  `start_assessment_attempt()` deixa de exigir `payment_status = 'paid'`. Exige
  candidato, por isso o assessment nao fica aberto a internet.
- `canReach`: assessment e dashboard passam a ser a mesma verificacao.
  `hasPaid()` novo, e e a barreira do `cv.pdf` (402), do `/api/career-pack`
  (402, verificado antes de gastar modelo) e do `report.pdf` (ja la estava).
- `/api/payments/checkout` novo, so para a taxa. Recusa com 409 se o assessment
  nao estiver completo: sem isso dava para cobrar por um relatorio que nunca vai
  existir, que e a unica falha deste fluxo que tira dinheiro e nao da nada.
- `/api/signup` deixou de criar checkout; so grava perfil.
- `UnlockReport` no dashboard, acima do relatorio, so quando
  `status.awaitingPayment`.
- SignupFlow passou a dois passos e termina no assessment. **O consentimento
  subiu** para o fim da inscricao: a divulgacao tem de acontecer antes de
  alguem gastar noventa minutos, nao num checkout que agora vem depois.
- Politica de reembolsos reescrita (contradizia-se), termos actualizados,
  `CONSENT_VERSION` = `v3-2026-10`.

**Foto real no lugar do placeholder do heroi**: `Hygge_V2_Web-63`, cozinha em
Lisboa, dada pelo Abilio. Nenhuma cara visivel, o que resolve os direitos de
imagem. Recortada para banda, 1400/2400 q80 4:2:0, com LQIP inline.

**Rodape**: ficou so o logo do Smith & Adams Group; o wordmark da S&A
Recruitment saiu, por pedido do Abilio.

## Bloco 29 - 06 Oct 2026, 13:20, abilio.diz@smithandadams.com

**Entidade legal de volta a SMTADM REAL ESTATE L.L.C**, por decisao do Abilio.
O EximPe retira a razao que tinha levado a entidade portuguesa: a autorizacao
PA-CB de importacao cobra em UPI e liquida para fora seja qual for o pais do
merchant, por isso a limitacao do Stripe (sem UPI a partir dos Emirados) deixou
de decidir.

`ENTITY`: licenca 1174293, morada da licenca (Al Quoz), jurisdicao Dubai,
`registrationLabel: 'Trade licence'`. O telefone **fica portugues** de proposito:
e o numero que o candidato liga e e atendido em Lisboa por quem o coloca em
Portugal. A morada registada diz onde a empresa esta; sao factos diferentes.

Registado no comentario da constante: **tres moradas em tres documentos**
(licenca = Al Quoz; certificado fiscal e extracto bancario = Hor Al Anz, Deira).
Por reconciliar.

**Selection rules publicadas como versao final.** O `DraftNotice` saiu, e nao
resta nenhum no produto. Importava porque e a pagina ligada da checkbox de
consentimento: pedir a alguem que confirme ter lido um documento que se
declarava por rever enfraquecia o unico registo que prova que as condicoes
foram mostradas.

**`CONSENT_VERSION`** passou a constante em `brand.ts`, `v2-2026-10`, com o
historico das versoes no comentario. Estava escrita a mao no `/api/signup`. Os
candidatos existentes ficam com `v1-2026-09`, que e o correcto: foi o que
aceitaram.

`docs/merchant-description.md` actualizado para a SMTADM, com tabela de dados
societarios para os formularios de KYC. `docs/stripe-onboarding.md` marcado como
superseded, mas guardado: o facto das business locations do UPI continua a ser
o que toda a gente volta a derivar.

## Bloco 28 - 06 Oct 2026, 12:30, abilio.diz@smithandadams.com

**EximPe implementado** como quarto adaptador, a partir da documentacao v3
deles (lida, nao inventada). `PAYMENT_PROVIDER=eximpe` activa-o.

- `src/lib/payments/eximpe.ts`: create order, status, webhook com V2 (timestamp
  assinado, janela de 5 min) e V1 como alternativa. Assina com a *encryption
  key*, nao com o secret da API.
- `src/lib/payments/eximpe-client.ts`: SDK fixado na 1.4.0 **com o hash SRI**,
  para um CDN comprometido nao poder servir outro script a uma pagina que esta
  prestes a cobrar.
- Quatro armadilhas da API deles tratadas e documentadas em `docs/payments.md`:
  montantes em rupias e nao paise; `reference_id` recusa underscores;
  `X-API-Version` obrigatorio com 401 que mente a dizer que sao as credenciais;
  `type_of_goods: service` para nao exigir codigo HS.
- `providerMode()` passou a ler `EXIMPE_ENV` ou `CASHFREE_ENV` conforme o
  provedor activo, em vez de uma unica variavel que poria um deles no host
  errado.

**Logo da Smith & Adams no rodape.** Versao branca gerada a partir do
`site-smith/logo.png` (preto sobre transparente), recortada a margem e exportada
a 320 e 640 para `public/`. Renderiza a 160 de largura, ligada a
smithandadams.com.

Por configurar quando a conta for aprovada: as quatro chaves EXIMPE_*, o
`PAYMENT_PROVIDER=eximpe`, o URL do webhook no dashboard deles, e o whitelist
dos IPs.

## Bloco 27 - 04 Oct 2026, 12:40, abilio.diz@smithandadams.com

**Voice intro implementado.** Gravacao de 45s no perfil, ao lado do CV,
**nao pontuada** e rotulada como nao pontuada. Decisao: nao construir prova de
oralidade avaliada automaticamente.

Razoes, registadas em `docs/assessment.md` e no cabecalho da migracao: avaliar
uma transcricao mede o que a parte escrita ja mede; avaliar o audio custa por
candidato e continua a nao ser certificavel (`english_certified` e coluna
gerada, `english_source <> 'internal'`); e o reconhecimento de fala tem taxas de
erro mais altas para ingles com sotaque indiano, o que num sistema de
recrutamento penalizaria exactamente quem o produto serve.

- `0011_voice_intro.sql` (**por correr**): tabela `candidate_voice_intros`,
  bucket `voice-intros` com o caminho como fronteira de autorizacao (mesma regra
  dos CVs), RLS para proprio/staff/employer, e `has_voice_intro` na vista
  `talent_pool`. O toggle de visibilidade tambem silencia a gravacao.
- `POST/DELETE /api/profile/voice` e `GET /api/profile/voice/[candidateId]`.
  A linha e lida com o cliente da sessao (RLS decide), o ficheiro com service
  role porque o bucket e privado e um signed URL sobreviveria a sessao.
- `VoiceIntro.tsx`: nada sobe ate ao Save, para uma gravacao falhada nao custar
  dados nem vergonha. Android webm/opus, iOS mp4. Corte automatico aos 45s.
- `VoicePlayer.tsx` na coluna VOICE da pool: o `<audio>` so e criado ao clicar,
  para 25 resultados nao abrirem 25 ligacoes.
- A seccao de ingles deixou de anunciar "speaking". Passou a "Reading and
  grammar", EN e HI.

Por testar com microfone real (nao da para automatizar headless).

## Bloco 26 - 02 Oct 2026, 11:10, abilio.diz@smithandadams.com

**Imagens: via gratuita esgotada, 4 de 12 conseguidas.**

Fontes tentadas, por ordem: Wikimedia Commons CC0/PD (devolve sobretudo
arquivo e objectos sobre fundo branco: para "canalizador" da chaves inglesas,
para "construcao" da um quadro do Munch); Commons restrita a fotos do Unsplash
doadas como CC0 (muito melhor, mas cobertura rala); Openverse (funciona sem
chave e tem contagens altas, mas quase tudo falha o tamanho minimo ou o fetch
directo).

Verificadas a olho e **boas**, em `scratchpad/img/cand/`:
`chef-2`, `constr-2`, `fb-1`, `weld-3`, mais `lisbon-1` (electrico de Lisboa).

**Sem nada utilizavel**: property management, cleaner, driver, logistics,
electrician, plumber, data analyst, QA tester, e alojamento.

Nao foi colocada nenhuma no repo: uma grelha de 12 com 4 fotos e 8 riscas fica
pior do que 12 riscas. Decisao pendente do Abilio: chave da Pexels ou Unsplash
(gratuita, imediata) e eu fecho as 12 numa passagem.

Ressalva a dizer uma vez: a licenca cobre a fotografia, nao a pessoa
fotografada. Foto de pessoa identificavel num anuncio de recrutamento sugere
associacao ao servico, e nem Unsplash nem CC0 dao direitos de imagem.

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
