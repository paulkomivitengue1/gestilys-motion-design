-- PROPOSITION — NON APPLIQUÉE, NON TESTÉE (aucun PostgreSQL disponible côté Claude).
-- À relire et à tester sur une base de test (ou une branche Supabase) avant toute exécution en production.
-- Non destructive : ajoute deux garde-fous, ne supprime ni ne modifie aucune donnée existante.
-- Principe : les appels directs du navigateur s'exécutent avec le rôle "authenticated" ;
-- les fonctions SECURITY DEFINER et la clé service_role (fonction admin) ne sont pas bloquées.

-- C1 — colonnes d'abonnement de `schools` réservées au serveur
CREATE OR REPLACE FUNCTION public.protect_school_billing_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  col text;
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    FOREACH col IN ARRAY ARRAY[
      'subscription_status', 'plan', 'billing_period', 'subscription_amount',
      'trial_ends_at', 'referred_by_code', 'suspended_from_status'
    ] LOOP
      IF (to_jsonb(NEW) -> col) IS DISTINCT FROM (to_jsonb(OLD) -> col) THEN
        RAISE EXCEPTION 'Les champs d''abonnement sont gérés par Gestilys uniquement (%).', col
          USING ERRCODE = '42501';
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_school_billing_columns ON public.schools;
CREATE TRIGGER trg_protect_school_billing_columns
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.protect_school_billing_columns();

-- C2 — paiements déclarés par une école : toujours "en_attente", non modifiables une fois traités
CREATE OR REPLACE FUNCTION public.protect_manual_payments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.status := 'en_attente';
      RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
      RAISE EXCEPTION 'Un paiement déclaré ne peut pas être modifié par l''établissement.' USING ERRCODE = '42501';
    ELSIF TG_OP = 'DELETE' THEN
      IF OLD.status <> 'en_attente' THEN
        RAISE EXCEPTION 'Un paiement traité ne peut pas être supprimé.' USING ERRCODE = '42501';
      END IF;
      RETURN OLD;
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_manual_payments ON public.manual_payments;
CREATE TRIGGER trg_protect_manual_payments
BEFORE INSERT OR UPDATE OR DELETE ON public.manual_payments
FOR EACH ROW
EXECUTE FUNCTION public.protect_manual_payments();
