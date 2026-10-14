-- Correção incremental para instalações que já aplicaram o schema inicial.
BEGIN;

-- Recupera apenas perfis ausentes para que as contas antigas tenham a referência exigida
-- por transacoes.user_id. ON CONFLICT preserva perfis já cadastrados.
INSERT INTO public.usuarios (id, email, nome, avatar_url, provider)
SELECT
    id,
    COALESCE(email, ''),
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)),
    COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture'),
    COALESCE(raw_app_meta_data->>'provider', 'google')
FROM auth.users
ON CONFLICT (id) DO NOTHING;

COMMIT;
