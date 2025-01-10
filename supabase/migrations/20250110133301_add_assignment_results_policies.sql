-- Enable RLS
alter table "public"."assignment_results" enable row level security;

-- Öğrenciler kendi sonuçlarını ekleyebilir
create policy "Öğrenciler kendi sonuçlarını ekleyebilir"
on "public"."assignment_results"
as permissive
for insert
with check (
    auth.uid() = student_id
    and exists (
        select 1 
        from class_students cs
        where cs.student_id = auth.uid()
    )
);

-- Öğrenciler kendi sonuçlarını görebilir
create policy "Öğrenciler kendi sonuçlarını görebilir"
on "public"."assignment_results"
as permissive
for select
using (
    auth.uid() = student_id
);

-- Öğretmenler sınıflarındaki öğrencilerin sonuçlarını görebilir
create policy "Öğretmenler sınıflarındaki sonuçları görebilir"
on "public"."assignment_results"
as permissive
for select
using (
    exists (
        select 1 
        from classes c
        join class_students cs on cs.class_id = c.id
        where cs.student_id = assignment_results.student_id
        and c.teacher_id = auth.uid()
    )
);
