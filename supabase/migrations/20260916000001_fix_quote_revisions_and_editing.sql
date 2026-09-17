-- Quote revisions are cloned from a client-visible version.  Keep all column
-- references qualified: `quote_id` is also an OUT parameter of this function.
CREATE OR REPLACE FUNCTION public.create_quote_revision(
  p_quote_id uuid,
  p_actor_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS TABLE(quote_id uuid, version integer)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_source public.quotes%ROWTYPE;
  v_quote_id uuid;
  v_version integer;
BEGIN
  SELECT * INTO v_source FROM public.quotes q WHERE q.id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'QUOTE_NOT_FOUND'; END IF;
  IF v_source.status NOT IN ('changes_requested', 'conversion_blocked', 'sent', 'viewed', 'ready_to_send') THEN
    RAISE EXCEPTION 'QUOTE_REVISION_NOT_ALLOWED';
  END IF;

  SELECT COALESCE(MAX(q.version), 0) + 1 INTO v_version
  FROM public.quotes q
  WHERE q.tenant_id = v_source.tenant_id AND q.quote_number = v_source.quote_number;

  UPDATE public.quotes q
  SET status = 'superseded', updated_by = p_actor_id, updated_at = now()
  WHERE q.id = v_source.id;

  INSERT INTO public.quotes(
    tenant_id, customer_id, parent_quote_id, quote_number, version, status,
    subtotal, discount, total, internal_notes, customer_note, valid_until,
    created_by, updated_by
  ) VALUES (
    v_source.tenant_id, v_source.customer_id, v_source.id, v_source.quote_number,
    v_version, 'draft', v_source.subtotal, v_source.discount, v_source.total,
    v_source.internal_notes, v_source.customer_note, now() + interval '7 days',
    p_actor_id, p_actor_id
  ) RETURNING id INTO v_quote_id;

  INSERT INTO public.quote_items(
    quote_id, product_id, name_snapshot, description_snapshot, image_url_snapshot,
    item_type, quantity, unit_price, subtotal, position
  )
  SELECT v_quote_id, qi.product_id, qi.name_snapshot, qi.description_snapshot, qi.image_url_snapshot,
    qi.item_type, qi.quantity, qi.unit_price, qi.subtotal, qi.position
  FROM public.quote_items qi
  WHERE qi.quote_id = v_source.id
  ORDER BY qi.position;

  INSERT INTO public.quote_events(quote_id, actor_id, event_type, source, reason)
  VALUES(v_source.id, p_actor_id, 'superseded', 'staff', NULLIF(btrim(p_reason), ''));
  INSERT INTO public.quote_events(quote_id, actor_id, event_type, source, reason, metadata)
  VALUES(v_quote_id, p_actor_id, 'revision_created', 'staff', NULLIF(btrim(p_reason), ''), jsonb_build_object('previous_quote_id', v_source.id, 'version', v_version));

  RETURN QUERY SELECT v_quote_id AS quote_id, v_version AS version;
END $$;

-- Replace all snapshots in a draft revision in one transaction.  Customers see
-- an immutable old proposal while staff safely prepares the corrected version.
CREATE OR REPLACE FUNCTION public.replace_quote_draft_items(
  p_quote_id uuid,
  p_actor_id uuid,
  p_items jsonb
)
RETURNS TABLE(quote_id uuid, subtotal numeric, total numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_quote public.quotes%ROWTYPE;
  v_requested_count integer;
  v_available_count integer;
  v_subtotal numeric(12,2);
  v_total numeric(12,2);
BEGIN
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'QUOTE_ITEMS_REQUIRED';
  END IF;

  SELECT * INTO v_quote FROM public.quotes q WHERE q.id = p_quote_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'QUOTE_NOT_FOUND'; END IF;
  IF v_quote.status <> 'draft' THEN RAISE EXCEPTION 'QUOTE_DRAFT_REQUIRED'; END IF;

  SELECT count(*) INTO v_requested_count
  FROM jsonb_to_recordset(p_items) AS requested(product_id uuid, quantity integer)
  WHERE requested.product_id IS NOT NULL AND requested.quantity > 0;

  SELECT count(*), COALESCE(sum(p.price * requested.quantity), 0)
  INTO v_available_count, v_subtotal
  FROM jsonb_to_recordset(p_items) AS requested(product_id uuid, quantity integer)
  JOIN public.products p ON p.id = requested.product_id
  WHERE requested.quantity > 0
    AND p.tenant_id = v_quote.tenant_id
    AND p.deleted_at IS NULL;

  IF v_requested_count = 0 OR v_requested_count <> jsonb_array_length(p_items) OR v_available_count <> v_requested_count THEN
    RAISE EXCEPTION 'QUOTE_ITEM_UNAVAILABLE';
  END IF;

  DELETE FROM public.quote_items qi WHERE qi.quote_id = v_quote.id;

  INSERT INTO public.quote_items(
    quote_id, product_id, name_snapshot, description_snapshot, image_url_snapshot,
    item_type, quantity, unit_price, subtotal, position
  )
  SELECT v_quote.id, p.id, p.name, p.description, p.image_url, p.type,
    requested.quantity, p.price, p.price * requested.quantity, requested.position - 1
  FROM jsonb_to_recordset(p_items) WITH ORDINALITY AS requested(product_id uuid, quantity integer, position bigint)
  JOIN public.products p ON p.id = requested.product_id
  WHERE requested.quantity > 0
  ORDER BY requested.position;

  UPDATE public.quotes q
  SET subtotal = v_subtotal,
      total = GREATEST(0, v_subtotal - q.discount),
      updated_by = p_actor_id,
      updated_at = now()
  WHERE q.id = v_quote.id
  RETURNING q.total INTO v_total;

  INSERT INTO public.quote_events(quote_id, actor_id, event_type, source)
  VALUES(v_quote.id, p_actor_id, 'revision_updated', 'staff');
  RETURN QUERY SELECT v_quote.id AS quote_id, v_subtotal AS subtotal, v_total AS total;
END $$;

REVOKE ALL ON FUNCTION public.replace_quote_draft_items(uuid, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.replace_quote_draft_items(uuid, uuid, jsonb) TO service_role;
