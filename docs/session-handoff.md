# Session handoff - Avsar platform

Newest entry first. Each entry carries date, time and the authoring account.

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
