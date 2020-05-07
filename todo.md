## todo

- finish fetching items from colleciton
- check if its working correctly
- nur noch crawlen, was noch nicht gecrawled wurde / nicht recently gecrawled wurde
- auswertung der gecrawlten stats
- regelmäßiger recrawl
- float values considern. trade_up_float = (max_possible_float_target - min_possible_float_target) * avg_possible_float_source + min_possible_float_target

## remember
- SELECT skins.collection_key,skin_conditions.condition_id,skins.rarity,MIN(skin_conditions.price),MAX(skin_conditions.price)
FROM skins
JOIN skin_conditions
ON skins.id=skin_conditions.skin_id
where  skins.collection_key='set_lake'
GROUP BY condition_id,rarity
