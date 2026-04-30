ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Update existing profiles to true so they don't see onboarding
UPDATE public.profiles SET onboarding_completed = true;
