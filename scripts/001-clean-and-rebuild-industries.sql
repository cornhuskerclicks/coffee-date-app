-- Clean up existing data
DELETE FROM niche_user_state WHERE niche_id IN (SELECT id FROM niches);
DELETE FROM niches;
DELETE FROM industries;

-- Insert correct 19 industries from PDF
INSERT INTO industries (name) VALUES
('Arts & Entertainment'),
('Automotive'),
('Business Services'),
('Clothing & Accessories'),
('Community and Government'),
('Computer & Tech'),
('Construction & Tradesmen'),
('Education'),
('Hospitality & Food'),
('Medicine & Health'),
('Home Improvements'),
('Agriculture & Mining'),
('Legal & Financial'),
('Media & Comms'),
('Fitness & Personal Care'),
('Real Estate'),
('Shopping & Retail'),
('Sports'),
('Travel & Transport');
