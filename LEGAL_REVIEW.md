# Revisão jurídica e operacional — 22/10/2026

Os documentos implementados em `/termos-de-uso` e `/politica-de-privacidade` refletem o código local. Não constituem parecer de advogado nem certificação da configuração de produção.

## Evidências consideradas

- `src/features/auth`: Google OAuth, sessão persistente, sem escopos adicionais de Gmail/Drive.
- `src/features/finance`: lançamentos manuais, recorrências e parcelas, datas de vencimento/pagamento, exportação CSV filtrada, demonstração local sem importação automática.
- `src/services`, `src/context`, `src/hooks` e `vite.config.ts`: conexão Supabase, tema local, PWA e cache de arquivos; ausência de cache de respostas financeiras e de integrações publicitárias no código.
- `supabase/migrations`: perfil com nome/e-mail/avatar, políticas por proprietário, auditoria com valor/status/identificadores e rotina de retenção de 90 dias. Isso não confirma que todas as migrações estejam aplicadas em produção.
- `README.md` e `vercel.json`: hospedagem Vercel, demonstração pública, gratuidade e licença MIT do código.
- Identidade, endereço e e-mail informados pelo responsável nesta conversa. CPF não publicado por minimização; avaliar necessidade jurídica de identificação adicional conforme a operação.

## Providências antes de publicar como documentos definitivos

1. Advogado deve revisar enquadramento da operação, capacidade/idade, fundamentos legais, legítimo interesse, responsabilidade e identificação suficiente do controlador.
2. Confirmar regiões reais de Supabase/Vercel/Google, países, suboperadores, contratos e mecanismo válido de transferência internacional (LGPD e Resolução ANPD 19/2024). Não foi presumida contratação de cláusulas específicas nem hospedagem exclusiva no Brasil.
3. Validar migrações e rotina de 90 dias em produção. Essa auditoria não substitui registros de acesso; avaliar separadamente aplicabilidade do art. 15 do Marco Civil, inclusive finalidade econômica e constituição jurídica da operação.
4. Documentar retenção de logs técnicos, backups e mensagens de atendimento, e procedimento para exclusão de conta/perfil/séries/transações/auditoria/cópias. O projeto não tem exclusão de conta pela interface; sair ou revogar Google não apaga dados. Não realizar exclusões em produção sem pedido verificado.
5. Monitorar o e-mail informado e estabelecer atendimento a titulares, confirmação de identidade proporcional, prazos e resposta a incidentes. A política não cria esses processos por si só.
6. A janela de login apresenta termos e ciência da política antes do OAuth, sem consentimento genérico. Não há registro persistente de aceite por versão; avaliar implantação se necessária à prova da contratação. Não foi criado histórico fictício para contas existentes.
7. Mudanças materiais futuras exigem comunicação real no aplicativo; manter cópia das versões anteriores e datas de vigência. Não substituir silenciosamente condições aplicáveis.

## Fontes oficiais consultadas

- LGPD: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- CDC: https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- Marco Civil: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm
- ANPD: https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados
