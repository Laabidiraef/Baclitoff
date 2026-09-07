/*
# Create BACLIT student activity tables

1. New Tables
- `baclit_favorites` stores resources saved by an authenticated student.
- `baclit_history` stores the authenticated student's recently viewed resource IDs.
- `baclit_quiz_results` stores quiz scores and completion timestamps.

2. Security
- Every table has Row Level Security enabled.
- Authenticated students can only read and manage their own rows.
- Ownership defaults to the current authenticated user and is never accepted from the browser.

3. Notes
- Resource content remains public and application-managed in this first version.
- These tables are intentionally small and export-friendly for future content management.
*/

CREATE TABLE IF NOT EXISTS public.baclit_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id text NOT NULL,
  resource_title text NOT NULL,
  resource_type text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);

CREATE TABLE IF NOT EXISTS public.baclit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id text NOT NULL,
  resource_title text NOT NULL,
  resource_type text NOT NULL,
  subject text NOT NULL,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, resource_id)
);

CREATE TABLE IF NOT EXISTS public.baclit_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id text NOT NULL,
  score integer NOT NULL CHECK (score >= 0),
  total integer NOT NULL CHECK (total > 0),
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.baclit_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baclit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baclit_quiz_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select_own_favorites" ON public.baclit_favorites;
CREATE POLICY "students_select_own_favorites" ON public.baclit_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_insert_own_favorites" ON public.baclit_favorites;
CREATE POLICY "students_insert_own_favorites" ON public.baclit_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_update_own_favorites" ON public.baclit_favorites;
CREATE POLICY "students_update_own_favorites" ON public.baclit_favorites FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_delete_own_favorites" ON public.baclit_favorites;
CREATE POLICY "students_delete_own_favorites" ON public.baclit_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "students_select_own_history" ON public.baclit_history;
CREATE POLICY "students_select_own_history" ON public.baclit_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_insert_own_history" ON public.baclit_history;
CREATE POLICY "students_insert_own_history" ON public.baclit_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_update_own_history" ON public.baclit_history;
CREATE POLICY "students_update_own_history" ON public.baclit_history FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_delete_own_history" ON public.baclit_history;
CREATE POLICY "students_delete_own_history" ON public.baclit_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "students_select_own_quiz_results" ON public.baclit_quiz_results;
CREATE POLICY "students_select_own_quiz_results" ON public.baclit_quiz_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_insert_own_quiz_results" ON public.baclit_quiz_results;
CREATE POLICY "students_insert_own_quiz_results" ON public.baclit_quiz_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_update_own_quiz_results" ON public.baclit_quiz_results;
CREATE POLICY "students_update_own_quiz_results" ON public.baclit_quiz_results FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "students_delete_own_quiz_results" ON public.baclit_quiz_results;
CREATE POLICY "students_delete_own_quiz_results" ON public.baclit_quiz_results FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS baclit_history_user_viewed_idx ON public.baclit_history (user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS baclit_quiz_results_user_completed_idx ON public.baclit_quiz_results (user_id, completed_at DESC);