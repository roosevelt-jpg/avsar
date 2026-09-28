# Session handoff - Avsar platform

Newest entry first. Each entry carries date, time and the authoring account.

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
