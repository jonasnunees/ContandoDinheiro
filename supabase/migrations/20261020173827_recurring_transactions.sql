BEGIN;
CREATE TABLE public.transaction_series (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  template jsonb NOT NULL CHECK (coalesce(
    jsonb_typeof(template) = 'object' AND length(btrim(template->>'descricao')) > 0
    AND (template->>'valor')::numeric > 0 AND (template->>'valor')::numeric <= 9999999999.99
    AND template->>'tipo' IN ('receita', 'despesa') AND template->>'status' IN ('pago', 'pendente')
    AND (template->>'data')::date BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'
    AND template->>'forma_pagamento' IN ('Pix', 'Cartão de Crédito', 'Cartão de Débito', 'Dinheiro', 'Boleto', 'Transferência', 'Outro')
    AND template->>'categoria' IN ('Alimentação', 'Moradia', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Salário', 'Investimentos', 'Serviços', 'Outros'), false)),
  mode text NOT NULL CHECK (mode IN ('monthly', 'installments')),
  count integer CHECK (count BETWEEN 2 AND 360),
  end_date date,
  next_index integer NOT NULL DEFAULT 0 CHECK (next_index >= 0),
  base_index integer NOT NULL DEFAULT 0 CHECK (base_index >= 0),
  cancelled boolean NOT NULL DEFAULT false,
  UNIQUE (id, user_id),
  CHECK ((mode = 'installments' AND count IS NOT NULL) OR (mode = 'monthly' AND count IS NULL))
);
ALTER TABLE public.transaction_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY series_owner ON public.transaction_series TO authenticated
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transaction_series TO authenticated;
REVOKE ALL ON public.transaction_series FROM anon;
ALTER TABLE public.transacoes
  ADD COLUMN serie_id uuid,
  ADD COLUMN ocorrencia integer,
  ADD COLUMN parcelas integer,
  ADD CONSTRAINT transacoes_series_owner_fk FOREIGN KEY (serie_id, user_id) REFERENCES public.transaction_series(id, user_id),
  ADD CONSTRAINT transacoes_occurrence_check CHECK (
    (serie_id IS NULL AND ocorrencia IS NULL AND parcelas IS NULL) OR
    (serie_id IS NOT NULL AND ocorrencia IS NOT NULL AND ocorrencia >= 0 AND
      (parcelas IS NULL OR (parcelas BETWEEN 2 AND 360 AND ocorrencia < parcelas)))
  ),
  ADD CONSTRAINT transacoes_series_occurrence_unique UNIQUE (serie_id, ocorrencia);

CREATE FUNCTION public.transaction_month(anchor date, offset_months integer) RETURNS date
LANGUAGE sql IMMUTABLE STRICT SET search_path = '' AS $$
  SELECT (date_trunc('month', anchor) + make_interval(months => offset_months))::date
    + (least(extract(day FROM anchor)::integer,
      extract(day FROM (date_trunc('month', anchor) + make_interval(months => offset_months + 1) - interval '1 day'))::integer) - 1);
$$;

-- Invoker mantém as políticas de proprietário também nas operações em lote.
CREATE FUNCTION public.materialize_transaction_series() RETURNS void
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
      INSERT INTO public.transacoes(user_id, descricao, valor, tipo, data, forma_pagamento, status, categoria, serie_id, ocorrencia, parcelas)
      VALUES (s.user_id, s.template->>'descricao', amount, s.template->>'tipo', occurrence_date,
        s.template->>'forma_pagamento', CASE WHEN s.next_index = 0 AND occurrence_date <= today THEN s.template->>'status' ELSE 'pendente' END,
        s.template->>'categoria', s.id, s.next_index, CASE WHEN s.mode = 'installments' THEN s.count END);
      s.next_index := s.next_index + 1;
    END LOOP;
    UPDATE public.transaction_series SET next_index = s.next_index WHERE id = s.id;
  END LOOP;
END;
$$;

CREATE FUNCTION public.save_transaction_series(draft jsonb, options jsonb, transaction_id uuid DEFAULT NULL) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE s public.transaction_series; selected public.transacoes; quantity integer; ending date;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  IF transaction_id IS NOT NULL THEN
    -- Sempre trava a série antes das ocorrências, na mesma ordem da geração.
    SELECT series.* INTO s FROM public.transaction_series series JOIN public.transacoes tx ON tx.serie_id = series.id
      WHERE tx.id = transaction_id AND tx.user_id = auth.uid() FOR UPDATE OF series;
    IF NOT FOUND THEN RAISE EXCEPTION 'Série não encontrada'; END IF;
    SELECT * INTO selected FROM public.transacoes WHERE id = transaction_id AND user_id = auth.uid() FOR UPDATE;
    IF options->>'scope' IS DISTINCT FROM 'following' THEN RAISE EXCEPTION 'Escopo inválido'; END IF;
    IF coalesce((options->>'cancel')::boolean, false) THEN
      UPDATE public.transaction_series SET cancelled = true WHERE id = s.id;
      DELETE FROM public.transacoes WHERE serie_id = s.id AND ocorrencia >= selected.ocorrencia AND status = 'pendente';
    ELSE
      UPDATE public.transaction_series SET template = draft || jsonb_build_object('status', 'pendente'), base_index = selected.ocorrencia WHERE id = s.id;
      UPDATE public.transacoes SET descricao = draft->>'descricao', valor = (draft->>'valor')::numeric,
        tipo = draft->>'tipo', forma_pagamento = draft->>'forma_pagamento', categoria = draft->>'categoria',
        data = public.transaction_month((draft->>'data')::date, ocorrencia - selected.ocorrencia)
        WHERE serie_id = s.id AND ocorrencia >= selected.ocorrencia AND status = 'pendente';
    END IF;
  ELSE
    IF options->>'mode' = 'installments' THEN
      quantity := (options->>'count')::integer;
      IF quantity IS NULL OR quantity NOT BETWEEN 2 AND 360 OR round((draft->>'valor')::numeric * 100) < quantity THEN
        RAISE EXCEPTION 'Informe de 2 a 360 parcelas, com pelo menos R$ 0,01 por parcela';
      END IF;
    END IF;
    ending := nullif(options->>'end', '')::date;
    IF ending IS NOT NULL AND (ending < (draft->>'data')::date OR ending > public.transaction_month((draft->>'data')::date, 359)) THEN
      RAISE EXCEPTION 'Término inválido';
    END IF;
    INSERT INTO public.transaction_series(user_id, template, mode, count, end_date)
      VALUES (auth.uid(), draft, options->>'mode', quantity, ending);
    PERFORM public.materialize_transaction_series();
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.transaction_month(date, integer), public.materialize_transaction_series(), public.save_transaction_series(jsonb, jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transaction_month(date, integer), public.materialize_transaction_series(), public.save_transaction_series(jsonb, jsonb, uuid) TO authenticated;
COMMIT;
