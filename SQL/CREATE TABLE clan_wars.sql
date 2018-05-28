SET ROLE write_schema;

CREATE TABLE public.clan_wars (
    war_id text NOT NULL,
    place integer,
    season integer,
    player_count integer,
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.clan_wars OWNER TO write_schema;

--
-- Name: TABLE members; Type: COMMENT; Schema: public; Owner: write_schema
--

COMMENT ON TABLE public.clan_wars IS 'historia de guerras y sus resultados';


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: write_schema
--

ALTER TABLE ONLY public.clan_wars
    ADD CONSTRAINT clan_wars_pkey PRIMARY KEY (war_id);


CREATE TRIGGER clan_wars_update_modtime
BEFORE UPDATE ON 
public.clan_wars FOR EACH ROW EXECUTE PROCEDURE  update_modified_column();
RESET ROLE;

        
        
        
        
        