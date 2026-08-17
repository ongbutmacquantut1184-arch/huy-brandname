-- Enable pg_trgm extension for fast text search
create extension if not exists pg_trgm;

-- Create indexes for customers
create index if not exists idx_cx_customers_customer_id_trgm on cx_customers using gin (customer_id gin_trgm_ops);
create index if not exists idx_cx_customers_ten_cong_ty_trgm on cx_customers using gin (ten_cong_ty gin_trgm_ops);
create index if not exists idx_cx_customers_org_id_trgm on cx_customers using gin (org_id gin_trgm_ops);
create index if not exists idx_cx_customers_cpid_trgm on cx_customers using gin (cpid gin_trgm_ops);
create index if not exists idx_cx_customers_cp_name_trgm on cx_customers using gin (cp_name gin_trgm_ops);

-- Create indexes for services
create index if not exists idx_cx_services_brand_name_oa_trgm on cx_services using gin (brand_name_oa gin_trgm_ops);
create index if not exists idx_cx_services_cp_name_code_trgm on cx_services using gin (cp_name_code gin_trgm_ops);
create index if not exists idx_cx_services_service_id_trgm on cx_services using gin (service_id gin_trgm_ops);

-- Create the optimized RPC search function
create or replace function search_customers_fast(q text, limit_count int default 20)
returns table (
  customer_id text,
  ten_cong_ty text,
  org_id text,
  cpid text,
  cp_name text,
  customer_success text,
  sale_phu_trach text,
  total_contracts bigint,
  total_services bigint,
  active_services bigint,
  rank_score int
)
language sql
stable
as $$
  with matched_customer as (
    select c.customer_id, 100 as score
    from cx_customers c
    where c.customer_id ilike '%' || q || '%'
       or c.ten_cong_ty ilike '%' || q || '%'
       or c.org_id ilike '%' || q || '%'
       or c.cpid ilike '%' || q || '%'
       or c.cp_name ilike '%' || q || '%'
    limit limit_count * 2
  ),
  matched_service as (
    select distinct s.customer_id, 70 as score
    from cx_services s
    where s.brand_name_oa ilike '%' || q || '%'
       or s.cp_name_code ilike '%' || q || '%'
       or s.service_id ilike '%' || q || '%'
    limit limit_count * 2
  ),
  matched as (
    select customer_id, max(score) as score
    from (
      select * from matched_customer
      union all
      select * from matched_service
    ) x
    group by customer_id
  )
  select
    c.customer_id,
    c.ten_cong_ty,
    c.org_id,
    c.cpid,
    c.cp_name,
    c.customer_success,
    c.sale_phu_trach,
    count(distinct ct.contract_id) as total_contracts,
    count(distinct s.service_id) as total_services,
    count(distinct s.service_id) filter (where s.trang_thai = 'Active') as active_services,
    m.score as rank_score
  from matched m
  join cx_customers c on c.customer_id = m.customer_id
  left join cx_contracts ct on ct.customer_id = c.customer_id
  left join cx_services s on s.customer_id = c.customer_id
  group by c.customer_id, m.score
  order by m.score desc, c.ten_cong_ty asc
  limit limit_count;
$$;
