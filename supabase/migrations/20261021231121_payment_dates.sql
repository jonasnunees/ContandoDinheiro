BEGIN;
-- A data existente continua como vencimento, preservando o recorte mensal.
-- Pagamentos antigos ficam sem data conhecida.
ALTER TABLE public.transacoes ADD COLUMN data_pagamento date;
ALTER TABLE public.transacoes ADD CONSTRAINT transacoes_payment_status_check
  CHECK (data_pagamento IS NULL OR status = 'pago');
CREATE INDEX transacoes_pending_due_idx ON public.transacoes(user_id, data, id)
  WHERE status = 'pendente' AND tipo = 'despesa';

CREATE FUNCTION public.validate_payment_date() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NEW.status = 'pendente' THEN NEW.data_pagamento := NULL; END IF;
  IF NEW.data_pagamento > (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN
    RAISE EXCEPTION 'A data do pagamento não pode estar no futuro';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_payment_date() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_payment_date() TO authenticated;
CREATE TRIGGER validate_payment_date BEFORE INSERT OR UPDATE ON public.transacoes
FOR EACH ROW EXECUTE FUNCTION public.validate_payment_date();

CREATE OR REPLACE FUNCTION public.materialize_transaction_series() RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE s public.transaction_series; occurrence_date date; cents bigint; amount numeric;
  today date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  horizon date := (date_trunc('month', today) + interval '12 months')::date;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  FOR s IN SELECT * FROM public.transaction_series WHERE user_id = auth.uid() AND NOT cancelled ORDER BY id FOR UPDATE LOOP
    LOOP
      occurrence_date := public.transaction_month((s.template->>'data')::date, s.next_index - s.base_index);
      EXIT WHEN (s.mode = 'installments' AND s.next_index >= s.count)
        OR (s.mode = 'monthly' AND s.end_date IS NOT NULL AND occurrence_date > s.end_date)
        OR (s.mode = 'monthly' AND s.end_date IS NULL AND occurrence_date >= horizon AND s.next_index > 0);
      IF occurrence_date > DATE '9999-12-31' THEN RAISE EXCEPTION 'Data fora do intervalo'; END IF;
      cents := round((s.template->>'valor')::numeric * 100);
      amount := CASE WHEN s.mode = 'installments'
        THEN (cents / s.count + CASE WHEN s.next_index < cents % s.count THEN 1 ELSE 0 END)::numeric / 100
        ELSE (s.template->>'valor')::numeric END;
      INSERT INTO public.transacoes(user_id, descricao, valor, tipo, data, forma_pagamento, status, categoria, serie_id, ocorrencia, parcelas, data_pagamento)
      VALUES (s.user_id, s.template->>'descricao', amount, s.template->>'tipo', occurrence_date,
        s.template->>'forma_pagamento', CASE WHEN s.next_index = 0 AND occurrence_date <= today THEN s.template->>'status' ELSE 'pendente' END,
        s.template->>'categoria', s.id, s.next_index, CASE WHEN s.mode = 'installments' THEN s.count END,
        CASE WHEN s.next_index = 0 AND occurrence_date <= today AND s.template->>'status' = 'pago' THEN nullif(s.template->>'data_pagamento', '')::date END);
      s.next_index := s.next_index + 1;
    END LOOP;
    UPDATE public.transaction_series SET next_index = s.next_index WHERE id = s.id;
  END LOOP;
END;
$$;

COMMIT;
