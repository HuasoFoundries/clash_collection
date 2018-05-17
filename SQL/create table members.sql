
CREATE TABLE public.members 
( player_tag text NOT NULL, 
	player_name text,
	rank integer,
	previous_rank integer,
	role text,
	exp_level integer,
	trophies integer,
	donations_given integer,
	donations_received integer,
	created_at timestamp without time zone, 
	modified_at timestamp without time zone
); 
--ALTER TABLE public.war_day OWNER TO write_schema; 
COMMENT ON TABLE public.members IS 'miembros del clan';
ALTER TABLE ONLY public.members ADD CONSTRAINT members_pkey PRIMARY KEY (player_tag); 
