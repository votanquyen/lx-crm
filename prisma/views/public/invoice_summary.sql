SELECT
  c.id AS company_id,
  c.name AS company_name,
  count(i.id) AS invoice_count,
  sum(
    CASE
      WHEN ((i.status) :: text = 'paid' :: text) THEN 1
      ELSE 0
    END
  ) AS paid_count,
  sum(
    CASE
      WHEN ((i.status) :: text = 'pending' :: text) THEN 1
      ELSE 0
    END
  ) AS pending_count,
  COALESCE(sum(i.total), (0) :: numeric) AS total_amount,
  COALESCE(
    sum(
      CASE
        WHEN ((i.status) :: text = 'paid' :: text) THEN i.total
        ELSE (0) :: bigint
      END
    ),
    (0) :: numeric
  ) AS paid_amount
FROM
  (
    companies c
    LEFT JOIN invoices i ON ((i.company_id = c.id))
  )
GROUP BY
  c.id,
  c.name;