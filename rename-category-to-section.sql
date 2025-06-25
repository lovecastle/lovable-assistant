-- Migration: Rename 'category' column to 'section' and add missing columns
-- Purpose: Align database column naming with UI terminology and add missing fields

-- Step 1: Add new 'section' column
ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS section TEXT;

-- Step 2: Add missing 'is_hidden' column (for system template hiding)
ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Step 2b: Add missing 'is_system_template' column (to distinguish system vs user templates)
ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT FALSE;

-- Step 3: Copy data from 'category' to 'section' (if category exists)
UPDATE public.prompt_templates
SET section = category
WHERE section IS NULL AND category IS NOT NULL;

-- Step 4: Drop the old 'category' column (if it exists)
ALTER TABLE public.prompt_templates
DROP COLUMN IF EXISTS category;

-- Step 5: Add NOT NULL constraint to 'section' column (with default fallback)
UPDATE public.prompt_templates 
SET section = 'Uncategorized' 
WHERE section IS NULL;

ALTER TABLE public.prompt_templates
ALTER COLUMN section SET NOT NULL;

-- Step 6: Update any indexes or constraints that referenced 'category'
-- Create index on section for better query performance
CREATE INDEX IF NOT EXISTS idx_prompt_templates_section ON public.prompt_templates(section);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_section ON public.prompt_templates(user_id, section);

-- Note: After running this migration, the application code will use 'section' instead of 'category'