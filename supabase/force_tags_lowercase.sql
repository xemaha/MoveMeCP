-- Funktion und Trigger, um Tag-Namen immer in lowercase zu speichern
CREATE OR REPLACE FUNCTION enforce_tags_lowercase()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name := LOWER(NEW.name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tags_lowercase ON tags;
CREATE TRIGGER trg_tags_lowercase
  BEFORE INSERT OR UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION enforce_tags_lowercase();
