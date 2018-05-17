SET ROLE write_schema;
CREATE OR REPLACE FUNCTION update_modified_column()	
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = now();
    RETURN NEW;	
END;
$$ language 'plpgsql';
RESET ROLE;



SET ROLE write_schema;
CREATE TRIGGER members_update_modtime
BEFORE UPDATE ON 
public.members FOR EACH ROW EXECUTE PROCEDURE  update_modified_column();
RESET ROLE;

