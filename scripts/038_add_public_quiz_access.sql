-- Add policy to allow public access to published quiz templates
-- This enables subdomain quiz links to work for anyone

CREATE POLICY "quiz_templates_select_published" ON quiz_templates
FOR SELECT
USING (is_published = true);
