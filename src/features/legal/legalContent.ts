export const LEGAL_VERSION = '2026-10-22';
export const LEGAL_CONTACT = 'jonas.nunees@gmail.com';
export const LEGAL_OPERATOR = 'Jonas Nunes de Oliveira';
export const LEGAL_ADDRESS = 'Rua Carlota Serpa, 382 — Baleia, São Pedro da Aldeia — RJ, Brasil';

interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
}
export interface LegalDocument {
  title: string;
  introduction: string;
  sections: LegalSection[];
}

export const terms: LegalDocument = {
  title: 'Termos de Uso',
  introduction:
    'Regras para usar o ContandoDinheiro, ferramenta gratuita de organização de finanças pessoais. Leia também a Política de Privacidade antes de entrar com Google ou inserir informações.',
  sections: [
    {
      id: 'responsavel',
      title: '1. Responsável e contato',
      paragraphs: [
        `O ContandoDinheiro é disponibilizado por ${LEGAL_OPERATOR}, pessoa física responsável pela operação do serviço. Endereço de contato: ${LEGAL_ADDRESS}. Atendimento: ${LEGAL_CONTACT}.`,
        'Estes termos se aplicam à aplicação web, à demonstração e à versão instalada no navegador (PWA). A licença MIT do código-fonte disciplina sua reutilização; ela não substitui estas regras de utilização do serviço hospedado.',
      ],
    },
    {
      id: 'servico',
      title: '2. O que o serviço faz',
      paragraphs: [
        'Você pode registrar receitas e despesas, vencimentos, pagamentos, categorias e formas de pagamento; organizar recorrências mensais e compras parceladas; consultar resumos e gráficos; e exportar a lista filtrada em CSV. Não há cobrança, assinatura ou solicitação de cartão de crédito nesta versão.',
        'O aplicativo não é banco, instituição de pagamento, corretora ou serviço de consultoria financeira, contábil, tributária ou de investimentos. Não movimenta dinheiro, executa Pix, quita boletos, contrata crédito ou acessa contas bancárias. Marcar um lançamento como pago ou recebido apenas altera seu registro no aplicativo.',
      ],
    },
    {
      id: 'acesso',
      title: '3. Conta e condições de acesso',
      paragraphs: [
        'O serviço é destinado a pessoas com 18 anos ou mais e capacidade para contratar. A conta é individual e utiliza autenticação Google. Não solicitamos a senha do Google em nossos formulários. A disponibilidade da conta depende também do acesso ao provedor de identidade.',
        'Antes de iniciar a autenticação, os termos e a política ficam disponíveis na janela de acesso. Ao escolher entrar, você concorda com estes termos e declara estar ciente da política. Essa ciência não constitui consentimento genérico para qualquer tratamento de dados.',
        'Proteja sua conta Google, mantenha seu dispositivo seguro e saia da sessão em equipamentos compartilhados. Comunique suspeitas de acesso indevido pelo canal de atendimento. O acesso aos dados da conta exige conexão à internet.',
      ],
    },
    {
      id: 'registros',
      title: '4. Registros, cálculos e decisões',
      paragraphs: [
        'Os resultados dependem da exatidão e atualização dos dados que você informa. Confira valores, datas, filtros e status antes de tomar decisões ou exportar informações. O aplicativo não verifica lançamentos com bancos nem comprova pagamentos.',
        'O vencimento determina o período dos resumos, gráficos e extrato; a data efetiva de pagamento é registrada separadamente. Os totais distinguem valores pagos ou recebidos de compromissos pendentes. Registros antigos podem não ter data de pagamento informada.',
        'Recorrências e parcelas geram registros de acompanhamento, sem débito automático ou aviso externo garantido. Alterações em séries podem afetar ocorrências futuras conforme a opção escolhida na interface. Confira a abrangência antes de confirmar. Os gráficos e indicadores não garantem economia, rentabilidade ou resultado financeiro.',
      ],
    },
    {
      id: 'demonstracao',
      title: '5. Demonstração, instalação e exportação',
      paragraphs: [
        'A demonstração utiliza exemplos fictícios e guarda suas alterações neste navegador, sem sincronização com a conta. Evite inserir dados reais nesse modo. Limpar dados do site, trocar de navegador ou perder o dispositivo pode eliminar os registros locais. Entrar com Google não importa automaticamente a demonstração.',
        'A instalação como PWA armazena arquivos da interface para facilitar o acesso. Isso não garante funcionamento offline da conta nem cópia de segurança de seus dados. A exportação CSV contém somente o recorte exibido pelos filtros; guarde e compartilhe os arquivos com cuidado, pois deixam de estar sob o controle de acesso do aplicativo.',
      ],
    },
    {
      id: 'uso',
      title: '6. Uso permitido e conteúdo',
      paragraphs: [
        'Utilize o serviço para organização lícita de suas finanças. Não tente acessar dados de outras pessoas, explorar vulnerabilidades, sobrecarregar o sistema, distribuir conteúdo malicioso, fraudar identidades ou contornar controles de segurança.',
        'Não registre senhas, números completos de cartões, códigos de segurança, credenciais bancárias ou informações sensíveis desnecessárias nas descrições. Não insira dados de terceiros sem fundamento legal. Você mantém os direitos sobre suas informações e autoriza seu processamento somente para as finalidades descritas na política.',
      ],
    },
    {
      id: 'disponibilidade',
      title: '7. Disponibilidade e responsabilidade',
      paragraphs: [
        'Podem ocorrer interrupções por manutenção, falhas técnicas, conexão ou indisponibilidade de fornecedores. Não há garantia de disponibilidade ininterrupta ou de recuperação de todo registro apagado. O responsável deve adotar medidas compatíveis com a natureza do serviço para prevenir e corrigir falhas.',
        'O usuário responde por seus próprios atos ilícitos e pelas decisões tomadas com os registros, na medida de sua responsabilidade. A apuração de danos considera a conduta, o nexo causal e a legislação aplicável. A gratuidade não exclui obrigações legais do responsável.',
        'Nenhuma cláusula afasta responsabilidade que não possa ser excluída por lei, inclusive por falhas de segurança ou do serviço imputáveis ao responsável. Permanecem preservados os direitos previstos na LGPD e no Código de Defesa do Consumidor, quando aplicável.',
      ],
    },
    {
      id: 'encerramento',
      title: '8. Suspensão e encerramento',
      paragraphs: [
        `Você pode deixar de usar o serviço a qualquer momento e solicitar exclusão de conta e dados pelo e-mail ${LEGAL_CONTACT}. Ainda não existe botão de exclusão de conta na interface. Excluir lançamentos, sair da sessão ou revogar o acesso no Google não equivale a excluir a conta. A retenção residual é explicada na política.`,
        'O acesso pode ser restringido na medida necessária para conter abuso, risco à segurança ou cumprir determinação legal. Quando viável e permitido, o usuário será informado do motivo e poderá pedir reavaliação pelo atendimento. Em encerramento planejado do serviço, será comunicado prazo razoável para exportação; situações emergenciais podem exigir atuação imediata.',
      ],
    },
    {
      id: 'alteracoes',
      title: '9. Alterações e legislação',
      paragraphs: [
        'A data e a versão identificam este documento. Mudanças relevantes nas condições de uso serão comunicadas no aplicativo antes de sua aplicação, com oportunidade de avaliação. Eventual recurso pago dependerá de informação e contratação próprias, sem cobrança automática baseada nestes termos.',
        'Aplica-se a legislação brasileira. Eventuais controvérsias serão submetidas ao juízo competente segundo a lei, preservados o foro do domicílio do consumidor e os demais direitos de acesso à Justiça. Você pode procurar o atendimento para tentar resolver dúvidas e conflitos, sem obrigação de renunciar a vias administrativas ou judiciais.',
      ],
    },
  ],
};

export const privacy: LegalDocument = {
  title: 'Política de Privacidade',
  introduction:
    'Como o ContandoDinheiro trata dados no acesso com Google, nos lançamentos financeiros e na demonstração local. Esta política descreve os recursos atuais da aplicação.',
  sections: [
    {
      id: 'controlador',
      title: '1. Quem decide sobre o tratamento',
      paragraphs: [
        `${LEGAL_OPERATOR}, pessoa física responsável pelo ContandoDinheiro, atua como controlador dos dados tratados para operar o aplicativo. Endereço de contato: ${LEGAL_ADDRESS}. Para privacidade, direitos e exclusão de conta, escreva para ${LEGAL_CONTACT}.`,
        'O canal é privado. Não publique dados financeiros, documentos, senhas ou pedidos contendo informações pessoais nas issues públicas do GitHub. Podemos pedir informações estritamente necessárias para verificar sua identidade e evitar entregar ou excluir dados de outra pessoa.',
      ],
    },
    {
      id: 'dados',
      title: '2. Dados tratados e origem',
      paragraphs: [
        'Conta Google: recebemos identificador de usuário, e-mail e, quando disponibilizados pelo provedor, nome e endereço da foto de perfil. O cadastro mantém também o provedor e datas de criação e atualização. A autenticação utiliza tokens de sessão. A integração implementada não solicita acesso ao Gmail, Drive, contatos ou contas bancárias.',
        'Registros financeiros: descrição, valor, receita ou despesa, categoria, forma de pagamento escolhida, vencimento, status, data efetiva de pagamento quando informada, identificadores e datas de registro. Séries incluem frequência, início, término, quantidade e organização das parcelas. São informações digitadas por você, sem importação bancária automática.',
        'Auditoria: a criação, edição ou exclusão de transações gera registros com identificador e e-mail do ator quando disponíveis, ação, data, identificadores da transação e proprietário, tipo, valor e status. Esses registros não são exibidos a outros usuários.',
        'Ao acessar o site ou autenticar, os fornecedores de infraestrutura podem processar endereço IP, horário, informações da requisição e do navegador e registros técnicos para entregar e proteger o serviço. Mensagens enviadas ao atendimento incluem seu e-mail e o conteúdo fornecido.',
        'Descrições livres podem revelar saúde, religião ou outros dados sensíveis. Não precisamos desses detalhes para organizar valores e datas: prefira descrições neutras e não envie documentos, credenciais ou dados de terceiros desnecessários.',
      ],
    },
    {
      id: 'finalidades',
      title: '3. Finalidades e fundamentos legais',
      paragraphs: [
        'Usamos os dados de conta e os lançamentos necessários para autenticar, vincular seus registros, salvar e consultar finanças, gerar séries, calcular indicadores e permitir exportações. O fundamento é a execução do serviço solicitado e os procedimentos relacionados à contratação (art. 7º, V, da LGPD). Sem os dados necessários, a conta e esses recursos não podem funcionar; a demonstração continua disponível sem login.',
        'Segurança, prevenção de abuso e auditoria atendem ao legítimo interesse de proteger o serviço e seus usuários, com necessidade, proporcionalidade e respeito aos direitos do titular. Obrigações legais, ordens válidas e defesa em processos podem exigir tratamento com fundamentos próprios. O atendimento utiliza o fundamento adequado ao pedido, inclusive cumprimento das obrigações relativas aos direitos do titular.',
        'A versão atual não integra ferramentas de publicidade comportamental, venda de dados, análise de crédito ou decisões automatizadas que produzam efeitos jurídicos sobre você. Os indicadores apenas resumem os registros. Qualquer uso futuro que exija consentimento terá solicitação específica e possibilidade de revogação.',
      ],
    },
    {
      id: 'navegador',
      title: '4. Armazenamento no navegador e PWA',
      paragraphs: [
        'O armazenamento local mantém a preferência de tema (gf_app_theme), os registros e séries da demonstração (gf_local_transactions) e, quando utilizada, a configuração pública de conexão (gf_supabase_url e gf_supabase_anon_key). A biblioteca de autenticação também persiste a sessão no navegador para manter o acesso.',
        'A PWA utiliza service worker e cache de arquivos da aplicação. Não foi implementado cache offline de respostas do banco ou fila de sincronização financeira. A demonstração pode funcionar offline após o carregamento dos arquivos necessários; suas alterações ficam locais e não são enviadas como lançamentos ao banco.',
        'Esses mecanismos têm finalidade funcional. Não há cookies de publicidade implementados na aplicação. Google e fornecedores podem utilizar mecanismos próprios em seus ambientes. Você pode limpar dados do site e gerenciar permissões no navegador; isso pode desconectar a sessão, apagar a demonstração e remover preferências. Desinstalar a PWA não garante apagar todos os dados do site, nem exclui sua conta no servidor.',
      ],
    },
    {
      id: 'fornecedores',
      title: '5. Fornecedores e compartilhamento',
      paragraphs: [
        'Supabase fornece autenticação e banco de dados, processando dados de conta, sessão, lançamentos, séries e auditoria conforme a operação do serviço. Google fornece a identidade usada no login e trata informações desse acesso conforme suas próprias condições. Vercel hospeda e distribui a aplicação e pode processar dados técnicos das requisições. O canal de atendimento utiliza Gmail, do Google, para receber e responder mensagens.',
        'O acesso administrativo deve se limitar às pessoas autorizadas e às necessidades de operação, suporte, segurança e cumprimento legal. Não disponibilizamos seus lançamentos a outros usuários ou anunciantes. Dados podem ser fornecidos a autoridades quando houver fundamento legal, observados os limites da solicitação.',
        'Ao exportar um CSV ou abrir um link externo, você decide sobre o destino do arquivo ou passa a interagir com outro serviço. As práticas desses destinos devem ser consultadas separadamente.',
      ],
    },
    {
      id: 'internacional',
      title: '6. Tratamento fora do Brasil',
      paragraphs: [
        'Os fornecedores utilizados têm infraestrutura e operações internacionais. Dados podem ser tratados fora do Brasil, conforme a região contratada, suporte e suboperadores. Isso não significa que todos os registros estejam necessariamente hospedados em um único país.',
        `Transferências internacionais devem observar os mecanismos previstos na LGPD e a regulamentação da ANPD. Você pode solicitar pelo e-mail ${LEGAL_CONTACT} informações sobre os países de destino e as garantias aplicáveis ao seu tratamento. A utilização do aplicativo não representa consentimento genérico para transferências internacionais.`,
      ],
    },
    {
      id: 'retencao',
      title: '7. Conservação e exclusão',
      paragraphs: [
        'Perfil, lançamentos e séries são mantidos enquanto a conta estiver ativa e forem necessários ao serviço. Não há exclusão automática por inatividade implementada. Você pode editar ou excluir registros na interface e solicitar o encerramento da conta pelo atendimento.',
        'Excluir uma ocorrência não necessariamente cancela a série que pode gerar novos registros: confira as opções de edição e cancelamento futuro. Os registros de auditoria são separados dos lançamentos e a configuração do projeto prevê remoção após 90 períodos de 24 horas desde sua criação. Assim, excluir uma transação não elimina imediatamente a referência à operação na auditoria.',
        'Pedidos de exclusão abrangem avaliação dos dados associados à conta, inclusive séries, perfil e auditoria. Informações podem ser conservadas de forma restrita quando houver obrigação legal ou necessidade fundamentada de exercício de direitos. Eventuais cópias de segurança e registros técnicos seguem os ciclos dos provedores; não prometemos apagamento instantâneo de todas as cópias. O atendimento informará as restrições aplicáveis ao pedido.',
        'Os 90 dias referem-se à auditoria de alterações, não a um prazo geral para todos os dados nem aos registros de acesso sujeitos ao Marco Civil da Internet. Dados locais permanecem até sua exclusão no navegador. Arquivos CSV exportados precisam ser eliminados por quem os detém.',
      ],
    },
    {
      id: 'direitos',
      title: '8. Seus direitos e como exercê-los',
      paragraphs: [
        `Envie sua solicitação a ${LEGAL_CONTACT}, preferencialmente pelo e-mail vinculado à conta, indicando o direito que deseja exercer. Não envie senha ou código de autenticação. Você pode pedir confirmação e acesso, correção, informações sobre compartilhamento, anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou irregulares, e portabilidade nos termos da regulamentação aplicável.`,
        'Quando o tratamento depender de consentimento, você pode revogá-lo, pedir a eliminação dos dados tratados nessa base e conhecer as consequências de não consentir. Também pode se opor a tratamento realizado em desacordo com a LGPD e solicitar revisão de decisões automatizadas quando aplicável. A exportação CSV é uma facilidade de acesso aos lançamentos filtrados e não substitui o atendimento aos demais direitos.',
        'As solicitações são gratuitas e serão tratadas nos prazos e condições legais. Para confirmação e acesso, a LGPD prevê resposta simplificada imediata ou declaração completa em até 15 dias. Se houver impedimento legal, necessidade de verificação de identidade ou hipótese de conservação, explicaremos o motivo e os próximos passos. Você também pode apresentar petição à ANPD e recorrer aos órgãos competentes.',
      ],
    },
    {
      id: 'seguranca',
      title: '9. Segurança e incidentes',
      paragraphs: [
        'O projeto utiliza conexão HTTPS com o banco, autenticação, validação de entradas, políticas de acesso por proprietário e restrição de consulta à auditoria. Essas medidas reduzem riscos, mas nenhum serviço oferece segurança absoluta. Não há promessa de criptografia de ponta a ponta dos lançamentos.',
        'Proteja sua conta Google e seu dispositivo e evite computadores compartilhados para registrar finanças. Se identificar possível exposição de dados, comunique pelo atendimento com apenas as informações necessárias. Incidentes que possam acarretar risco ou dano relevante aos titulares deverão ser avaliados e comunicados à ANPD e aos afetados nos termos da regulamentação aplicável.',
      ],
    },
    {
      id: 'atualizacoes',
      title: '10. Público e atualizações',
      paragraphs: [
        'O ContandoDinheiro é destinado a maiores de 18 anos. Se houver dados de criança ou adolescente inseridos indevidamente, o responsável pode contatar o atendimento para avaliação e providências, observando o melhor interesse do titular.',
        'Esta política tem versão e data de atualização. Mudanças relevantes serão comunicadas no aplicativo. Novas finalidades incompatíveis com as informadas exigem avaliação de fundamento legal e informação adequada antes do tratamento. Uma atualização do documento não substitui essas providências.',
      ],
    },
  ],
};
