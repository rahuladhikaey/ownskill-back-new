-- Update Live Exams Table to Support PDF mode and remove Date/Time requirements
ALTER TABLE live_exams ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE live_exams ALTER COLUMN date DROP NOT NULL;
ALTER TABLE live_exams ALTER COLUMN time DROP NOT NULL;
ALTER TABLE live_exams ALTER COLUMN duration DROP NOT NULL;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
