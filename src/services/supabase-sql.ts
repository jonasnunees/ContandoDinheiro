export const SUPABASE_SQL_SCRIPT = `-- ==========================================
-- ETAPA 1: CRIAÇÃO DA TABELA transacoes & RLS
-- Sistema de Gestão Financeira Pessoal
-- ==========================================

-- 1. Criar a tabela transacoes
CREATE TABLE IF NOT EXISTS public.transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    forma_pagamento TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pago', 'pendente')),
    categoria TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar índices para consultas ultra-rápidas por usuário e data
CREATE INDEX IF NOT EXISTS idx_transacoes_user_data ON public.transacoes (user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes (tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes (status);

-- 3. Ativar o Row Level Security (RLS)
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Isolamento por user_id

-- Política de Visualização: usuário só vê suas próprias transações
DROP POLICY IF EXISTS "Usuários podem visualizar apenas suas transações" ON public.transacoes;
CREATE POLICY "Usuários podem visualizar apenas suas transações"
    ON public.transacoes FOR SELECT
    USING (auth.uid() = user_id);

-- Política de Inserção: usuário só pode cadastrar com seu próprio user_id
DROP POLICY IF EXISTS "Usuários podem inserir suas transações" ON public.transacoes;
CREATE POLICY "Usuários podem inserir suas transações"
    ON public.transacoes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política de Atualização: usuário só pode editar suas próprias transações
DROP POLICY IF EXISTS "Usuários podem atualizar suas transações" ON public.transacoes;
CREATE POLICY "Usuários podem atualizar suas transações"
    ON public.transacoes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Política de Deleção: usuário só pode excluir suas próprias transações
DROP POLICY IF EXISTS "Usuários podem deletar suas transações" ON public.transacoes;
CREATE POLICY "Usuários podem deletar suas transações"
    ON public.transacoes FOR DELETE
    USING (auth.uid() = user_id);
`;
