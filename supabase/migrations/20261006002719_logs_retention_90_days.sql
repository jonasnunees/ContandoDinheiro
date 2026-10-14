-- Retenção individual: 90 x 24 horas desde created_at.
-- A cada minuto, apaga somente logs cujo prazo já terminou.
-- Usa o índice existente em created_at e as permissões do administrador.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_cron;
-- O nome identifica o agendamento nas reaplicações; os cinco asteriscos significam a cada minuto.
-- 2160 horas representa 90 períodos de 24 horas, sem depender da duração de um dia no fuso local.
SELECT cron.schedule(
    'logs_atividades_retention_90_days',
    '* * * * *',
    $job$DELETE FROM public.logs_atividades
    WHERE created_at <= now() - interval '2160 hours';$job$
);
COMMIT;
