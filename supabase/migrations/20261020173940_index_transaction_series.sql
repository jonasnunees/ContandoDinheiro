BEGIN;
-- Suporta as consultas por proprietário e a verificação das chaves estrangeiras.
CREATE INDEX transaction_series_user_id_idx ON public.transaction_series (user_id);
CREATE INDEX transacoes_series_user_id_idx ON public.transacoes (serie_id, user_id);
COMMIT;
