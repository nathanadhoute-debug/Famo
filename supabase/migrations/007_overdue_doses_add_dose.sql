-- Ajoute le dosage (m.dose) au retour de overdue_doses() pour l'afficher
-- dans le mail de rappel, en plus du nom du médicament.

create or replace function public.overdue_doses(grace_minutes int default 60)
returns table (
  dose_id uuid, family_id uuid, parent_id uuid,
  med_name text, med_dose text, scheduled_time time
) language sql security definer stable as $$
  select d.id, d.family_id, m.parent_id, m.name, m.dose, ms.scheduled_time
  from public.doses d
  join public.medication_schedules ms on ms.id = d.schedule_id
  join public.medications m on m.id = d.medication_id
  where d.dose_date = current_date
    and d.given = false
    and d.alert_sent_at is null
    and ((now() at time zone 'Europe/Paris')::time - ms.scheduled_time) >= (grace_minutes || ' minutes')::interval;
$$;
