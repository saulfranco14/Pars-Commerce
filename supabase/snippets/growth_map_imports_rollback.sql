-- Reverts 20261031000005_growth_map_imports.sql. Growth objects only; import history is lost.
BEGIN;

DROP FUNCTION IF EXISTS public.growth_map_points(uuid, uuid, double precision, double precision, double precision, double precision, text, text, integer);
DROP FUNCTION IF EXISTS public.growth_claim_import(uuid, integer);
DROP TABLE IF EXISTS public.growth_imports;

-- growth_funnel without by_giro and by_member, verbatim from 20261031000001_growth_workspaces.
CREATE OR REPLACE FUNCTION public.growth_funnel(
  p_from timestamptz,
  p_to timestamptz,
  p_workspace_id uuid DEFAULT '00000000-0000-4000-8000-000000000001'
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ev AS (
    SELECT e.* FROM public.growth_lead_events e
    JOIN public.growth_leads g ON g.id = e.lead_id
    WHERE g.workspace_id = p_workspace_id AND e.created_at >= p_from AND e.created_at < p_to
  ),
  acq AS (
    SELECT a.* FROM public.tenant_acquisitions a
    WHERE a.captured_at >= p_from AND a.captured_at < p_to
      AND (a.lead_id IS NULL OR EXISTS (SELECT 1 FROM public.growth_leads g WHERE g.id = a.lead_id AND g.workspace_id = p_workspace_id))
  )
  SELECT jsonb_build_object(
    'contacted', (SELECT count(DISTINCT lead_id) FROM ev WHERE type IN ('whatsapp_sent', 'email_sent', 'visit_registered', 'visit_interested', 'visit_absent', 'visit_closed', 'not_interested')),
    'valid_channel', (SELECT count(DISTINCT lead_id) FROM ev WHERE type IN ('whatsapp_sent', 'email_sent', 'visit_registered', 'visit_interested', 'not_interested'))
                     - (SELECT count(DISTINCT lead_id) FROM ev WHERE type IN ('no_whatsapp', 'wrong_number', 'email_bounced')),
    'replied', (SELECT count(DISTINCT lead_id) FROM ev WHERE type IN ('whatsapp_replied', 'email_replied', 'visit_interested', 'visit_registered')),
    'viewed', (SELECT count(DISTINCT lead_id) FROM ev WHERE type = 'para_viewed'),
    'claimed', (SELECT count(DISTINCT lead_id) FROM ev WHERE type = 'claim_clicked'),
    'registered_engine', (SELECT count(*) FROM acq WHERE bucket = 'engine'),
    'registered_assisted', (SELECT count(*) FROM acq WHERE bucket = 'assisted'),
    'registered_self', (SELECT count(*) FROM acq WHERE bucket = 'self'),
    'by_channel', coalesce((SELECT jsonb_object_agg(coalesce(channel, 'otro'), n) FROM (SELECT channel, count(*) AS n FROM acq WHERE bucket <> 'self' GROUP BY channel) c), '{}'::jsonb),
    'drop_reasons', jsonb_build_object(
      'sin_whatsapp', (SELECT count(*) FROM ev WHERE type = 'no_whatsapp'),
      'equivocado', (SELECT count(*) FROM ev WHERE type = 'wrong_number'),
      'rebote', (SELECT count(*) FROM ev WHERE type = 'email_bounced'),
      'no_estaba', (SELECT count(*) FROM ev WHERE type = 'visit_absent'),
      'cerrado', (SELECT count(*) FROM ev WHERE type = 'visit_closed'),
      'no_le_interesa', (SELECT count(*) FROM ev WHERE type = 'not_interested' AND coalesce(payload->>'reason', 'rechazo') = 'rechazo'),
      'ya_usa_otra', (SELECT count(*) FROM ev WHERE type = 'not_interested' AND payload->>'reason' = 'competencia'),
      'baja', (SELECT count(*) FROM ev WHERE type = 'unsubscribed'),
      'sin_respuesta', (SELECT count(*) FROM ev WHERE type IN ('whatsapp_no_answer', 'email_no_answer'))
    ),
    'by_municipio', coalesce((
      SELECT jsonb_object_agg(municipio, jsonb_build_object('contacted', contacted, 'registered', registered))
      FROM (
        SELECT g.municipio,
               count(DISTINCT ev.lead_id) FILTER (WHERE ev.type IN ('whatsapp_sent', 'email_sent', 'visit_registered', 'visit_interested', 'visit_absent')) AS contacted,
               count(DISTINCT ev.lead_id) FILTER (WHERE ev.type = 'registered') AS registered
        FROM ev JOIN public.growth_leads g ON g.id = ev.lead_id
        GROUP BY g.municipio
      ) m
    ), '{}'::jsonb),
    'by_template', coalesce((
      SELECT jsonb_agg(jsonb_build_object('template_id', t.id, 'channel', t.channel, 'giro', t.giro, 'step', t.step,
             'variant', t.variant, 'version', t.version, 'sent', s.sent, 'replied', s.replied, 'rejected', s.rejected, 'registered', s.registered)
             ORDER BY s.sent DESC)
      FROM (
        SELECT sent_ev.template_id,
               count(DISTINCT sent_ev.lead_id) AS sent,
               count(DISTINCT r.lead_id) FILTER (WHERE r.type IN ('whatsapp_replied', 'email_replied')) AS replied,
               count(DISTINCT r.lead_id) FILTER (WHERE r.type IN ('not_interested', 'unsubscribed')) AS rejected,
               count(DISTINCT r.lead_id) FILTER (WHERE r.type = 'registered') AS registered
        FROM ev sent_ev
        LEFT JOIN public.growth_lead_events r ON r.lead_id = sent_ev.lead_id AND r.created_at >= sent_ev.created_at
        WHERE sent_ev.template_id IS NOT NULL AND sent_ev.type IN ('whatsapp_sent', 'email_sent')
        GROUP BY sent_ev.template_id
      ) s
      JOIN public.growth_templates t ON t.id = s.template_id
    ), '[]'::jsonb)
  );
$$;

COMMIT;
