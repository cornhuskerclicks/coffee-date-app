-- Function to increment quiz views
CREATE OR REPLACE FUNCTION increment_quiz_views(quiz_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.quiz_templates
  SET views = COALESCE(views, 0) + 1
  WHERE id = quiz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment quiz starts
CREATE OR REPLACE FUNCTION increment_quiz_starts(quiz_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.quiz_templates
  SET starts = COALESCE(starts, 0) + 1
  WHERE id = quiz_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
