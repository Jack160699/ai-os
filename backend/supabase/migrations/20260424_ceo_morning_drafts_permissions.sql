-- CEO: morning brief + drafts flow (append if missing)

update public.ceo_bridge_settings
set permissions = array_append(permissions, 'morning brief')
where id = 'default' and not ('morning brief' = any (permissions));

update public.ceo_bridge_settings
set permissions = array_append(permissions, 'drafts send all')
where id = 'default' and not ('drafts send all' = any (permissions));

update public.ceo_bridge_settings
set permissions = array_append(permissions, 'drafts yes')
where id = 'default' and not ('drafts yes' = any (permissions));

update public.ceo_bridge_settings
set permissions = array_append(permissions, 'drafts no')
where id = 'default' and not ('drafts no' = any (permissions));

update public.ceo_bridge_settings
set permissions = array_append(permissions, 'drafts preview')
where id = 'default' and not ('drafts preview' = any (permissions));
