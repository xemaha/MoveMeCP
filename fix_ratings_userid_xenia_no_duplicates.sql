-- Lösche alle doppelten Bewertungen, die nach dem Update einen Konflikt erzeugen würden
DELETE FROM ratings r
USING ratings r2
WHERE
  r.id > r2.id
  AND r.movie_id = r2.movie_id
  AND r.user_name = 'xenia'
  AND r2.user_id = '12eb43a9-7373-4ab5-af8d-faa84e89d1b5';

-- Jetzt das Update ausführen
UPDATE ratings
SET user_id = '12eb43a9-7373-4ab5-af8d-faa84e89d1b5'
WHERE user_name = 'xenia';
