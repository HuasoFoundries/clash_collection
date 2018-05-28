SET ROLE write_schema;

CREATE TABLE public.member_stats (
    id text NOT NULL,
    player_tag text NOT NULL,
    player_name text,
    exp_level integer,
    trophies integer,
    created_at timestamp without time zone DEFAULT now(),
    modified_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.member_stats OWNER TO write_schema;

--
-- Name: TABLE members; Type: COMMENT; Schema: public; Owner: write_schema
--

COMMENT ON TABLE public.member_stats IS 'evolución en el tiempo de miembros del clan';


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: write_schema
--

ALTER TABLE ONLY public.member_stats
    ADD CONSTRAINT member_stats_pkey PRIMARY KEY (id);


CREATE TRIGGER member_stats_update_modtime
BEFORE UPDATE ON 
public.member_stats FOR EACH ROW EXECUTE PROCEDURE  update_modified_column();
RESET ROLE;
