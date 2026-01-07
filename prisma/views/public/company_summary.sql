SELECT
  c.id,
  c.name,
  c.short_name,
  c.district,
  c.contact_name,
  COALESCE(s.total, (0) :: bigint) AS current_month_total,
  COALESCE(s.total_plants, 0) AS current_month_plants,
  COALESCE(s.needs_confirmation, false) AS has_pending
FROM
  (
    companies c
    LEFT JOIN monthly_statements s ON (
      (
        (s.company_id = c.id)
        AND (
          (s.year) :: numeric = EXTRACT(
            year
            FROM
              CURRENT_DATE
          )
        )
        AND (
          (s.month) :: numeric = EXTRACT(
            MONTH
            FROM
              CURRENT_DATE
          )
        )
      )
    )
  )
ORDER BY
  c.name;