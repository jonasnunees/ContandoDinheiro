BEGIN;
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  name text NOT NULL,
  archived boolean NOT NULL DEFAULT false,
  UNIQUE(id, user_id),
  CHECK (char_length(name) BETWEEN 1 AND 60)
);
CREATE UNIQUE INDEX categories_owner_name_idx ON public.categories(user_id, translate(name, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'));
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.categories FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.categories TO authenticated;
GRANT UPDATE(archived) ON public.categories TO authenticated;
CREATE POLICY categories_read ON public.categories FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY categories_create ON public.categories FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY categories_archive ON public.categories FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
CREATE FUNCTION public.normalize_category() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  NEW.name := btrim(NEW.name, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
  IF TG_OP = 'UPDATE' AND (NEW.id IS DISTINCT FROM OLD.id OR NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.name IS DISTINCT FROM OLD.name) THEN RAISE EXCEPTION 'Categoria imutável'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER normalize_category BEFORE INSERT OR UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.normalize_category();
CREATE FUNCTION public.ensure_categories() RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Autenticação necessária'; END IF;
  INSERT INTO public.categories(user_id, name) SELECT auth.uid(), name FROM unnest(ARRAY['Alimentação','Moradia','Transporte','Saúde','Educação','Lazer','Salário','Investimentos','Serviços','Outros']) name ON CONFLICT DO NOTHING;
END $$;
INSERT INTO public.categories(user_id,name) SELECT u.id, name FROM public.usuarios u CROSS JOIN unnest(ARRAY['Alimentação','Moradia','Transporte','Saúde','Educação','Lazer','Salário','Investimentos','Serviços','Outros']) name;
ALTER TABLE public.transacoes ADD COLUMN categoria_id uuid;
ALTER TABLE public.transaction_series ADD COLUMN categoria_id uuid;
UPDATE public.transacoes t SET categoria_id=c.id FROM public.categories c WHERE c.user_id=t.user_id AND c.name=t.categoria;
UPDATE public.transaction_series s SET categoria_id=c.id, template=s.template || jsonb_build_object('categoria_id',c.id) FROM public.categories c WHERE c.user_id=s.user_id AND c.name=s.template->>'categoria';
ALTER TABLE public.transacoes ALTER COLUMN categoria_id SET NOT NULL, DROP CONSTRAINT transacoes_categoria_check,
 ADD CONSTRAINT transacoes_category_owner_fk FOREIGN KEY(categoria_id,user_id) REFERENCES public.categories(id,user_id);
ALTER TABLE public.transaction_series ALTER COLUMN categoria_id SET NOT NULL,
 ADD CONSTRAINT series_category_owner_fk FOREIGN KEY(categoria_id,user_id) REFERENCES public.categories(id,user_id);
CREATE INDEX transacoes_category_idx ON public.transacoes(user_id,categoria_id);
CREATE INDEX series_category_idx ON public.transaction_series(user_id,categoria_id);
ALTER TABLE public.transaction_series DROP CONSTRAINT transaction_series_template_check;
ALTER TABLE public.transaction_series ADD CONSTRAINT transaction_series_template_check CHECK (coalesce(
 jsonb_typeof(template)='object' AND length(btrim(template->>'descricao'))>0
 AND (template->>'valor')::numeric > 0 AND (template->>'valor')::numeric <= 9999999999.99
 AND template->>'tipo' IN ('receita','despesa') AND template->>'status' IN ('pago','pendente')
 AND (template->>'data')::date BETWEEN DATE '0001-01-01' AND DATE '9999-12-31'
 AND template->>'forma_pagamento' IN ('Pix','Cartão de Crédito','Cartão de Débito','Dinheiro','Boleto','Transferência','Outro')
 AND (template->>'categoria_id')::uuid=categoria_id, false));
-- SHARE serializa a decisão de gravar com UPDATE de arquivamento.
CREATE FUNCTION public.validate_category_reference() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE c public.categories; requested uuid; previous uuid; inherited boolean := false;
BEGIN
 IF TG_TABLE_NAME='transaction_series' THEN
   requested := nullif(NEW.template->>'categoria_id','')::uuid;
   IF TG_OP='UPDATE' THEN previous := OLD.categoria_id; END IF;
 ELSE
   requested := NEW.categoria_id;
   IF TG_OP='UPDATE' THEN
     previous := OLD.categoria_id;
     -- Impede que abas antigas reclassifiquem um vínculo usando somente o nome.
     IF NEW.categoria_id IS NOT DISTINCT FROM OLD.categoria_id AND NEW.categoria IS DISTINCT FROM OLD.categoria THEN
       RAISE EXCEPTION 'Atualize a página para alterar a categoria pelo identificador';
     END IF;
   END IF;
 END IF;
 IF requested IS NULL THEN
   IF TG_TABLE_NAME='transaction_series' THEN
 SELECT * INTO c FROM public.categories WHERE user_id=NEW.user_id AND name=NEW.template->>'categoria' FOR SHARE;
 ELSE
 SELECT * INTO c FROM public.categories WHERE user_id=NEW.user_id AND name=NEW.categoria FOR SHARE;
 END IF;
 ELSE
   SELECT * INTO c FROM public.categories WHERE user_id=NEW.user_id AND id=requested FOR SHARE;
 END IF;
 IF c.id IS NULL THEN RAISE EXCEPTION 'Categoria inválida para esta conta'; END IF;
 IF TG_TABLE_NAME='transacoes' THEN
 IF TG_OP='INSERT' AND NEW.serie_id IS NOT NULL THEN
   SELECT EXISTS(SELECT 1 FROM public.transaction_series s WHERE s.id=NEW.serie_id AND s.user_id=NEW.user_id AND s.categoria_id=c.id AND NOT s.cancelled AND NEW.ocorrencia >= s.next_index AND NEW.data=public.transaction_month((s.template->>'data')::date,NEW.ocorrencia-s.base_index) AND NEW.descricao=s.template->>'descricao'
     AND NEW.tipo=s.template->>'tipo' AND NEW.forma_pagamento=s.template->>'forma_pagamento'
     AND NEW.status=CASE WHEN NEW.ocorrencia=0 AND NEW.data <= (now() AT TIME ZONE 'America/Sao_Paulo')::date THEN s.template->>'status' ELSE 'pendente' END
     AND NEW.data_pagamento IS NOT DISTINCT FROM CASE WHEN NEW.ocorrencia=0 AND NEW.data <= (now() AT TIME ZONE 'America/Sao_Paulo')::date AND s.template->>'status'='pago' THEN nullif(s.template->>'data_pagamento','')::date END
     AND (s.mode='monthly' OR NEW.ocorrencia < s.count)
     AND (s.end_date IS NULL OR NEW.data <= s.end_date)
     AND NEW.valor=CASE WHEN s.mode='monthly' THEN (s.template->>'valor')::numeric
       ELSE (floor(round((s.template->>'valor')::numeric*100)/s.count) + CASE WHEN NEW.ocorrencia < mod(round((s.template->>'valor')::numeric*100),s.count) THEN 1 ELSE 0 END)/100 END) INTO inherited;
 END IF;
 END IF;
 IF c.archived AND c.id IS DISTINCT FROM previous AND NOT inherited THEN RAISE EXCEPTION 'Escolha uma categoria ativa'; END IF;
 NEW.categoria_id := c.id;
 IF TG_TABLE_NAME='transaction_series' THEN NEW.template := NEW.template || jsonb_build_object('categoria_id',c.id,'categoria',c.name);
 ELSE NEW.categoria := c.name; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER category_reference BEFORE INSERT OR UPDATE ON public.transacoes FOR EACH ROW EXECUTE FUNCTION public.validate_category_reference();
CREATE TRIGGER category_reference BEFORE INSERT OR UPDATE ON public.transaction_series FOR EACH ROW EXECUTE FUNCTION public.validate_category_reference();
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
      INSERT INTO public.transacoes(user_id, descricao, valor, tipo, data, forma_pagamento, status, categoria, categoria_id, serie_id, ocorrencia, parcelas, data_pagamento)
      VALUES (s.user_id, s.template->>'descricao', amount, s.template->>'tipo', occurrence_date,
        s.template->>'forma_pagamento', CASE WHEN s.next_index = 0 AND occurrence_date <= today THEN s.template->>'status' ELSE 'pendente' END,
        s.template->>'categoria', s.categoria_id, s.id, s.next_index, CASE WHEN s.mode = 'installments' THEN s.count END,
        CASE WHEN s.next_index = 0 AND occurrence_date <= today AND s.template->>'status' = 'pago' THEN nullif(s.template->>'data_pagamento', '')::date END);
      s.next_index := s.next_index + 1;
    END LOOP;
    UPDATE public.transaction_series SET next_index = s.next_index WHERE id = s.id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_transaction_series(draft jsonb, options jsonb, transaction_id uuid DEFAULT NULL) RETURNS void
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
      VALUES (auth.uid(), draft, options->>'mode', quantity, ending);
    PERFORM public.materialize_transaction_series();
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.normalize_category(), public.validate_category_reference(), public.ensure_categories() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.normalize_category(), public.validate_category_reference(), public.ensure_categories() TO authenticated;
COMMIT;
