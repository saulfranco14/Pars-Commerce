-- =============================================================================
-- GROWTH: formal email copy (usted), same voice as the WhatsApp v3 copy.
-- New versions only for the email templates the owner has not edited
-- (created_by IS NULL); older versions are archived, never deleted.
-- d3/d7 subjects are a fallback: a threaded follow-up reuses the first subject.
-- Reverted by supabase/snippets/growth_rollback.sql.
-- =============================================================================

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('d0', 'A', 'Una tienda en línea para {negocio}',
       E'Buen día:\n\nMi nombre es Saúl y le escribo de Tlaco. Vi su comercio y le preparé, sin costo, un ejemplo de tienda en línea para {negocio}: sus clientes le hacen pedidos desde el celular, con entrega a domicilio y pago sin terminal.\n\nPuede verla en este enlace, que es solo para usted:\n{link}\n\nActivarla no tiene costo y toma un par de minutos. Si lo prefiere, con gusto paso a su local y se la dejo lista.\n\nQuedo a sus órdenes.\n{firma}'),
      ('d0', 'B', 'Pregunta para {negocio}',
       E'Buen día:\n\nMi nombre es Saúl y le escribo de Tlaco. Vi su comercio y le preparé, sin costo, un ejemplo de tienda en línea para que sus clientes le hagan pedidos desde el celular, con entrega a domicilio y pago sin terminal.\n\n¿Me permite enviarle el enlace para que la conozca? Basta con que responda este correo.\n\nQuedo a sus órdenes.\n{firma}'),
      ('d0', 'C', '¿Sus clientes le piden por WhatsApp?',
       E'Buen día:\n\n¿Sus clientes le hacen pedidos por WhatsApp o por teléfono?\n\nSe lo pregunto porque le preparé a {negocio} un ejemplo de tienda en línea donde esos pedidos le llegan completos desde el celular, con entrega a domicilio y pago sin terminal. Puede verla aquí:\n{link}\n\nActivarla no tiene costo. Si tiene dudas, basta con responder este correo.\n\nQuedo a sus órdenes.\n{firma}'),
      ('d3', 'A', 'Seguimiento: tienda para {negocio}',
       E'Buen día:\n\nLe escribo nuevamente para dar seguimiento. ¿Tuvo oportunidad de ver la tienda que le preparé a {negocio}? Se la comparto otra vez:\n{link}\n\nSi lo prefiere, puedo pasar a su local y dejársela funcionando en 15 minutos, sin costo.\n\nQuedo a sus órdenes.\n{firma}'),
      ('d7', 'A', 'Último correo: tienda para {negocio}',
       E'Buen día:\n\nEste es mi último correo, para no quitarle más tiempo. La tienda de {negocio} sigue disponible en este enlace por si más adelante le interesa:\n{link}\n\nSi en otro momento le sirve, basta con responder este correo y con gusto le ayudo.\n\nSaludos cordiales.\n{firma}')
    ) AS v(step, variant, subject, body)
  LOOP
    IF EXISTS (
      SELECT 1 FROM public.growth_templates t
      WHERE t.channel = 'email' AND t.giro IS NULL AND t.step = r.step AND t.variant = r.variant
        AND t.status <> 'archived' AND t.created_by IS NULL
    ) THEN
      PERFORM public.growth_save_template_version('email', NULL, r.step, r.variant, r.subject, r.body, NULL);
    END IF;
  END LOOP;
END;
$$;
