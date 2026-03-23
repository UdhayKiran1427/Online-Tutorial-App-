-- Add link column to courses table
ALTER TABLE courses ADD COLUMN link VARCHAR(500) AFTER description;

-- Update existing courses with example links
UPDATE courses SET link = 'https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web' WHERE id = 1;
UPDATE courses SET link = 'https://docs.python.org/3/tutorial/' WHERE id = 2;
UPDATE courses SET link = 'https://www.w3schools.com/sql/' WHERE id = 3;
UPDATE courses SET link = 'https://react.dev/learn' WHERE id = 4;
UPDATE courses SET link = 'https://www.interaction-design.org/literature/topics/ui-design' WHERE id = 5;
