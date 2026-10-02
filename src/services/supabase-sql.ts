export const SUPABASE_SQL_SCRIPT = `-- ========================================================
-- SISTEMA CONTANDODINHEIRO — SCHEMA SUPABASE + GOOGLE AUTH
-- Mapeamento automático de usuários e transações com RLS
-- ========================================================

-- 1. TABELA DE USUÁRIOS MAPEADOS DO GOOGLE AUTH
-- Armazena os dados públicos do usuário autenticado via Google
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    nome TEXT,
    avatar_url TEXT,
    provider TEXT DEFAULT 'google',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar Row Level Security (RLS) na tabela de usuários
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para a tabela de usuários
DROP POLICY IF EXISTS "Usuários podem visualizar seu próprio perfil" ON public.usuarios;
CREATE POLICY "Usuários podem visualizar seu próprio perfil"
    ON public.usuarios FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.usuarios;
CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON public.usuarios FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 2. TRIGGER AUTOMÁTICO PARA SINCRONIZAR USUÁRIOS DO GOOGLE AUTH
-- Toda vez que um usuário loga via Google pela 1ª vez (ou atualiza o perfil),
-- o Supabase dispara essa função para mapear os dados em public.usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, nome, avatar_url, provider)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'
        ),
        COALESCE(NEW.app_metadata->>'provider', 'google')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nome = COALESCE(EXCLUDED.nome, public.usuarios.nome),
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.usuarios.avatar_url),
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador no schema auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TABELA DE TRANSAÇÕES FINANCEIRAS
-- Vinculada ao id do usuário no Supabase com integridade referencial
CREATE TABLE IF NOT EXISTS public.transacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.usuarios(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor NUMERIC(12, 2) NOT NULL CHECK (valor >= 0),
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    forma_pagamento TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pago', 'pendente')),
    categoria TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de alta performance para consultas e filtros
CREATE INDEX IF NOT EXISTS idx_transacoes_user_data ON public.transacoes (user_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes (tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes (status);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON public.transacoes (categoria);

-- 4. ATIVAR ROW LEVEL SECURITY (RLS) NA TABELA transacoes
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;

-- Políticas de Isolamento RLS por user_id (Garante que cada usuário veja e gerencie apenas seus dados)
DROP POLICY IF EXISTS "Usuários podem visualizar apenas suas transações" ON public.transacoes;
CREATE POLICY "Usuários podem visualizar apenas suas transações"
    ON public.transacoes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem inserir suas transações" ON public.transacoes;
CREATE POLICY "Usuários podem inserir suas transações"
    ON public.transacoes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas transações" ON public.transacoes;
CREATE POLICY "Usuários podem atualizar suas transações"
    ON public.transacoes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas transações" ON public.transacoes;
CREATE POLICY "Usuários podem deletar suas transações"
    ON public.transacoes FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================================
-- 5. TABELA DE AUDITORIA E LOGS DE RASTRO (ACESSO EXCLUSIVO DO ADMINISTRADOR NO BANCO)
-- ========================================================
CREATE TABLE IF NOT EXISTS public.logs_atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT,
    user_email TEXT,
    acao TEXT NOT NULL,
    detalhes JSONB DEFAULT '{}'::jsonb,
    dispositivo TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de auditoria para busca rápida por data, ação e usuário
CREATE INDEX IF NOT EXISTS idx_logs_atividades_user ON public.logs_atividades (user_id);
CREATE INDEX IF NOT EXISTS idx_logs_atividades_email ON public.logs_atividades (user_email);
CREATE INDEX IF NOT EXISTS idx_logs_atividades_acao ON public.logs_atividades (acao);
CREATE INDEX IF NOT EXISTS idx_logs_atividades_created_at ON public.logs_atividades (created_at DESC);

-- Ativar Row Level Security (RLS)
ALTER TABLE public.logs_atividades ENABLE ROW LEVEL SECURITY;

-- Permitir gravação de logs pelo app (clientes autenticados e anônimos podem registrar)
DROP POLICY IF EXISTS "Permitir inserção de logs de atividade" ON public.logs_atividades;
CREATE POLICY "Permitir inserção de logs de atividade"
    ON public.logs_atividades FOR INSERT
    WITH CHECK (true);

-- IMPORTANTE: Nenhuma política de SELECT pública é criada.
-- Somente você (administrador do projeto) tem acesso a esses registros diretamente pelo painel do Supabase!
`;
