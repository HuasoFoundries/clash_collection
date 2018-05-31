
create or replace view wars_played as 
select player_tag,
player_name,
exp_level,
donations_given, 
donations_received, 
season,
sum(coalesce(battles_played,0)) battles_played,
sum(coalesce(cards_earned,0)) cards_earned,
sum(coalesce(wins,0)) wins,
sum(
  case
  when cards_earned is null then 0
  else 1
  end
) wars_played,
sum(
  case
  when cards_earned is null then 1
  else 0
  end
) wars_missed
from members join clan_wars on 1=1
left join war_log using (war_id, player_tag,season,player_name)
where members.active=true
and war_log.created_at>=members.created_at
group by 
player_tag,
player_name,
exp_level,
donations_given, 
donations_received, 
season
order by player_name, season;

alter view wars_played owner to write_schema;

