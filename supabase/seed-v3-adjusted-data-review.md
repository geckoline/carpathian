# Carpathian v3 adjusted data review

Generated from `projects_rows.sql` and `experts_rows.sql`.

## Counts

| Check | Value | Expected |
|---|---:|---:|
| Experts | 32 | 32 |
| Projects | 39 | 39 |
| Citizen-science projects | 10 | 10 |
| Citizen-science linked experts | 9 | 9 |
| Primary project geometries | 39 | 39 |

## Category Counts

| Category id | Projects |
|---|---:|
| agriculture | 1 |
| awareness-education | 4 |
| biodiversity | 9 |
| climate-change | 8 |
| cultural-heritage | 2 |
| forests | 4 |
| industry-infrastructure | 3 |
| spatial-planning | 1 |
| tourism | 1 |
| water | 6 |

## Project Mapping

| CS | Project | Category | Lead expert | Region / sample geometry |
|---|---|---|---|---|
| no | Carpathian Consumption Study | awareness-education | Dr. Péter Nagy | Hungarian Carpathians, Maramureș - community outreach region |
| no | Carpathian Educational Outreach | awareness-education | Dr. Anna Smith | Western Romanian Carpathians - community outreach region |
| no | Transylvanian Air Quality Network | climate-change | Prof. Maria Toderas | Central Transylvania, Romania - air-monitoring area polygon |
| yes | Carpathian Forest Watch | forests | Dr. Elena Popescu | 3 Countries - forest landscape polygon |
| yes | Alpine River Restoration | water | Dr. Jan Novak | Slovakia - river-catchment corridor |
| yes | Bear Corridor Mapping | biodiversity | Dr. Andrei Ionescu | Romania - wildlife corridor polygon |
| yes | Meadow Pollinator Survey | biodiversity | Dr. Marek Kowalski | Poland - habitat monitoring polygon |
| no | Soil Carbon Assessment | climate-change | Dr. Radu Ionescu | Ukraine - climate observation region |
| no | Test Project | biodiversity | Dr. Elena Popescu | Romania - habitat monitoring polygon |
| no | Polish Carpathian Watershed Study | water | Dr. Krzysztof Nowicki | Bieszczady National Park, Poland - river-catchment corridor |
| no | Carpathian Renewable Energy Initiative | industry-infrastructure | Dr. Péter Nagy | Central Carpathians, International - infrastructure pressure area |
| no | Carpathian Climate Adaptation | climate-change | Dr. Martin Schmidt | Western Carpathians, Slovakia - climate observation region |
| no | Carpathian Environmental Policy Framework | spatial-planning | Dr. Maria Kowalski | Central Carpathians, Romania - project area polygon |
| no | Czech Carpathian Geological Survey | cultural-heritage | Dr. Jan Novak | Beskydy Mountains, Czech Republic - heritage mapping area |
| no | Carpathian Sustainable Agriculture | agriculture | Dr. Elena Popescu | Curvature Carpathians, Romania - agricultural landscape polygon |
| yes | Brown Bear Monitoring Network | biodiversity | Dr. Mihai Radu | Transylvanian Alps, Romania - wildlife corridor polygon |
| no | Carpathian Pollution Prevention Network | industry-infrastructure | Dr. Monika Kowalczyk | Cross-border Carpathian Region - infrastructure pressure area |
| no | Carpathian Climate Change Impact | climate-change | Dr. Radu Ionescu | Făgăraș Mountains, Romania - climate observation region |
| no | Carpathian Forest Restoration | forests | Prof. Vasyl Petrenko | Harghita Mountains, Romania - forest restoration block |
| no | Serbian Carpathian Community Health | awareness-education | Dr. Ana Petrovic | Carpathian Region, Serbia - community outreach region |
| yes | Mountain Water Quality Project | water | Dr. Vasile Moldovan | Maramureș Mountains, Romania - river-catchment corridor |
| no | Carpathian Water Cycle Research | water | Prof. Anna Wiśniewska | Tatra Mountains, Poland - river-catchment corridor |
| no | Carpathian Water Pollution Study | water | Dr. Monika Kowalczyk | San River Basin, Poland - river-catchment corridor |
| no | Carpathian Biodiversity Corridors | biodiversity | Dr. Andrei Mihai | Northern Romanian Carpathians - wildlife corridor polygon |
| yes | Carpathian Climate Observers | climate-change | Dr. Anna Kowalski | Polish Carpathians, Beskid Range - climate observation region |
| no | Carpathian Sustainable Tourism | tourism | Dr. Viktória Nagy | Eastern Carpathians, Romania/Moldova - tourism planning area |
| yes | Forest Canopy Watch | forests | Dr. Marta Nowak | Bieszczady Mountains, Poland - forest landscape polygon |
| no | Geological Heritage Mapping | cultural-heritage | Prof. Andrei Petrescu | Ukrainian Carpathians, Zakarpattia - heritage mapping area |
| yes | Carpathian Wildlife Watch | biodiversity | Dr. Elena Popescu | Romanian Carpathians, Suceava County - wildlife corridor polygon |
| no | Ukrainian Carpathian Forest Dynamics | forests | Dr. Oksana Kovalenko | Chernivtsi Oblast, Ukraine - forest landscape polygon |
| no | Carpathian Water Conservation | water | Dr. Oleksandr Petrenko | Upper Tisza River Basin - river-catchment corridor |
| yes | Carpathian Air Purity Initiative | climate-change | Dr. Ioana Stanescu | Eastern Carpathians, Bacău County - air-monitoring area polygon |
| no | Hungarian Carpathian Wetlands | biodiversity | Dr. Gábor Tóth | Northern Hungary, Miskolc Region - habitat monitoring polygon |
| no | Carpathian Biodiversity Genetics | biodiversity | Dr. Laura Munteanu | Southern Carpathians, Romania - habitat monitoring polygon |
| no | Slovak Carpathian Climate Resilience | climate-change | Dr. Ján Kováč | Low Tatras, Slovakia - climate observation region |
| no | Carpathian Pollution Monitor | industry-infrastructure | Dr. Jan Kowalczyk | Slovak Carpathians, Spiš Region - infrastructure pressure area |
| no | Carpathian Air Monitoring Network | climate-change | Prof. Anna Wiśniewska | High Tatra Mountains, Poland/Slovakia - air-monitoring area polygon |
| no | Carpathian Bird Migration | biodiversity | Dr. Elena Varga | Southern Carpathians, Vâlcea County - habitat monitoring polygon |
| no | Carpathian Community Resilience | awareness-education | Dr. Vasile Moldovan | Moldavian Platform, Romania - community outreach region |

## Citizen-science expert sharing

| Expert | CS projects |
|---|---|
| Dr. Andrei Ionescu | Bear Corridor Mapping |
| Dr. Anna Kowalski | Carpathian Climate Observers |
| Dr. Elena Popescu | Carpathian Forest Watch; Carpathian Wildlife Watch |
| Dr. Ioana Stanescu | Carpathian Air Purity Initiative |
| Dr. Jan Novak | Alpine River Restoration |
| Dr. Marek Kowalski | Meadow Pollinator Survey |
| Dr. Marta Nowak | Forest Canopy Watch |
| Dr. Mihai Radu | Brown Bear Monitoring Network |
| Dr. Vasile Moldovan | Mountain Water Quality Project |

## Notes
- The old `contact` project column is not imported because schema v3 derives contact from linked experts.
- Old `air` fields are mapped to `climate-change`, following the migration decision.
- The old `projects` count on experts is not imported because schema v3 computes it from `project_experts`.
- Project geometries are generated sample polygons from exported coordinates and categories, not authoritative GIS boundaries.
- The exported rows reuse UUID `52524d6e-10dc-5261-aa36-8b2efcbaa5f0` in both `projects` and `experts`; this is valid because they are different tables, but it is worth reviewing before production.
