BEGIN;
-- Mantém o RPC anterior para clientes existentes. Novo contrato retorna o destino persistido.
CREATE FUNCTION public.save_transaction_series_with_target(draft jsonb, options jsonb, transaction_id uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE s public.transaction_series; selected public.transacoes; quantity integer; ending date; new_series_id uuid; target public.transacoes;
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
        tipo = draft->>'tipo', forma_pagamento = draft->>'forma_pagamento', categoria = draft->>'categoria', categoria_id = (draft->>'categoria_id')::uuid,
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
      VALUES (auth.uid(), draft, options->>'mode', quantity, ending) RETURNING id INTO new_series_id;
    PERFORM public.materialize_transaction_series();
  END IF;
  -- Edição aponta para a ocorrência selecionada; criação, para a primeira da nova série.
  -- O cancelamento pode remover a selecionada: nesse caso não existe ação de navegação.
  IF transaction_id IS NOT NULL THEN
    SELECT * INTO target FROM public.transacoes WHERE id = transaction_id AND user_id = auth.uid();
  ELSE
    SELECT * INTO target FROM public.transacoes WHERE serie_id = new_series_id AND user_id = auth.uid()
      ORDER BY ocorrencia, id LIMIT 1;
  END IF;
  IF target.id IS NULL THEN RETURN NULL; END IF;
  RETURN to_jsonb(target);
END;
$$;
REVOKE ALL ON FUNCTION public.save_transaction_series_with_target(jsonb,jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_transaction_series_with_target(jsonb,jsonb,uuid) TO authenticated;
COMMIT;
