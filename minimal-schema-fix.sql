-- Minimal Schema Fix: Add missing columns to prompt_templates table
-- This is a safe migration that only adds missing columns without removing existing ones

-- Add basic required columns
ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS template_name TEXT;

ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add new 'section' column (for category -> section rename)
ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS section TEXT;

-- Add missing 'is_hidden' column (for system template hiding)
ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- Add missing 'is_system_template' column (to distinguish system vs user templates)
ALTER TABLE public.prompt_templates
ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT FALSE;

-- Copy data from 'category' to 'section' if category column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'prompt_templates' AND column_name = 'category') THEN
    UPDATE public.prompt_templates
    SET section = category
    WHERE section IS NULL;
  END IF;
END $$;

-- Set default values for section if it's null
UPDATE public.prompt_templates 
SET section = 'Uncategorized' 
WHERE section IS NULL OR section = '';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_prompt_templates_section ON public.prompt_templates(section);
CREATE INDEX IF NOT EXISTS idx_prompt_templates_user_section ON public.prompt_templates(user_id, section);

-- Note: This migration is safe and additive only. 
-- The old 'category' column is preserved for backwards compatibility.