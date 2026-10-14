-- Regras de integridade também se aplicam a chamadas diretas à API.
-- A transação inteira é revertida caso existam registros incompatíveis.
BEGIN;

ALTER TABLE public.transacoes
    ADD CONSTRAINT transacoes_descricao_check CHECK (
        length(btrim(descricao, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF')) > 0
    ) NOT VALID,
    ADD CONSTRAINT transacoes_valor_positivo_check CHECK (
        valor > 0 AND valor <= 9999999999.99
    ) NOT VALID,
    ADD CONSTRAINT transacoes_forma_pagamento_check CHECK (
        forma_pagamento IN ('Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro')
    ) NOT VALID,
    ADD CONSTRAINT transacoes_categoria_check CHECK (
        categoria IN ('Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Salário', 'Investimentos', 'Serviços', 'Outros')
    ) NOT VALID,
    ADD CONSTRAINT transacoes_data_check CHECK (
        data BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'
    ) NOT VALID;

ALTER TABLE public.transacoes VALIDATE CONSTRAINT transacoes_descricao_check;
ALTER TABLE public.transacoes VALIDATE CONSTRAINT transacoes_valor_positivo_check;
ALTER TABLE public.transacoes VALIDATE CONSTRAINT transacoes_forma_pagamento_check;
ALTER TABLE public.transacoes VALIDATE CONSTRAINT transacoes_categoria_check;
ALTER TABLE public.transacoes VALIDATE CONSTRAINT transacoes_data_check;

COMMIT;

