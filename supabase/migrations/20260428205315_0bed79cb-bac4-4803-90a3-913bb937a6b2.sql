ALTER TABLE public.contatos
ADD COLUMN observacao TEXT NOT NULL DEFAULT '';

ALTER TABLE public.contatos
ADD CONSTRAINT contatos_observacao_length CHECK (char_length(observacao) <= 1000);