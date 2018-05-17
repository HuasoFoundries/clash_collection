
CREATE TABLE public.war_day 
( id text NOT NULL, 
  type text, 
  date timestamp without time zone, 
  player_tag text, 
  player_name text, 
  clan_tag text 
); 
--ALTER TABLE public.war_day OWNER TO write_schema; 
COMMENT ON TABLE public.war_day IS 'batallas collection day';
ALTER TABLE ONLY public.war_day ADD CONSTRAINT war_day_pkey PRIMARY KEY (id); 