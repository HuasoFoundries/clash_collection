

CREATE TABLE public.collection_day (
    id text NOT NULL,
    type text,
    date timestamp without time zone,
    player_tag text,
    player_name text,
    clan_tag text
);


-- ALTER TABLE public.collection_day OWNER TO write_schema;


COMMENT ON TABLE public.collection_day IS 'batallas collection day';


CREATE TABLE public.war_day (
    id text NOT NULL,
    type text,
    date timestamp without time zone,
    player_tag text,
    player_name text,
    clan_tag text
);


-- ALTER TABLE public.war_day OWNER TO write_schema;


COMMENT ON TABLE public.war_day IS 'batallas war day';



ALTER TABLE ONLY public.collection_day
    ADD CONSTRAINT collection_day_pkey PRIMARY KEY (id);



ALTER TABLE ONLY public.war_day
    ADD CONSTRAINT war_day_pkey PRIMARY KEY (id);

