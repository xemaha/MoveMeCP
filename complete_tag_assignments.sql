-- Vollständiges Tag-Zuordnungs-Script
-- Dieses Script verknüpft alle Filme/Serien/Bücher mit ihren Tags
-- WICHTIG: Erst import_collection.sql ausführen, dann dieses Script!

-- FILME Tag-Zuordnungen

-- Animation
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Lego Batman' AND t.name = 'Animation';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Avatar' AND t.name = 'Animation';

-- Zeichentrickfilm
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Ein Königreich für ein Lama' AND t.name = 'Zeichentrickfilm';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Der Goofy Film' AND t.name = 'Zeichentrickfilm';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'König der Löwen' AND t.name = 'Zeichentrickfilm';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Falsches Spiel um Roger rabbit' AND t.name = 'Zeichentrickfilm';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Der Brotverdiener' AND t.name = 'Zeichentrickfilm';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Ich habe meinen Körper verloren' AND t.name = 'Zeichentrickfilm';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Spirit - Der wilde Mustang' AND t.name = 'Zeichentrickfilm';

-- Reise
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Weit' AND t.name = 'Reise';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Wild (Reese Witherspoon)' AND t.name = 'Reise';

-- DC
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Joker' AND t.name = 'DC';

-- Marvel
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Deadpool I' AND t.name = 'Marvel';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Deadpool 2' AND t.name = 'Marvel';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Spiderman - No way Home' AND t.name = 'Marvel';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Free Guy' AND t.name = 'Marvel';

-- Wes Anderson
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Grand Budapest Hotel' AND t.name = 'Wes Anderson';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Tiefseetaucher' AND t.name = 'Wes Anderson';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Moonrise kingdom' AND t.name = 'Wes Anderson';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Wes Anderson - Roald-Dahl Kurzfilmreihe auf Netflix' AND t.name = 'Wes Anderson';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Der Phönizische Meisterstreich' AND t.name = 'Wes Anderson';

-- Metapher für die Welt
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Snow Piercer' AND t.name = 'Metapher für die Welt';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Mother' AND t.name = 'Metapher für die Welt';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'High Rise' AND t.name = 'Metapher für die Welt';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Der Schacht' AND t.name = 'Metapher für die Welt';

-- Stimmungsvoll
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Her' AND t.name = 'Stimmungsvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Perfect Sense' AND t.name = 'Stimmungsvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Boké' AND t.name = 'Stimmungsvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Wall E' AND t.name = 'Stimmungsvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Ex Machina' AND t.name = 'Stimmungsvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Oh beautiful night' AND t.name = 'Stimmungsvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Ein ganzes Leben' AND t.name = 'Stimmungsvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Angel-A' AND t.name = 'Stimmungsvoll';

-- Künstlerisch wertvoll
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The Frame' AND t.name = 'Künstlerisch wertvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The Artist' AND t.name = 'Künstlerisch wertvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Phantasia' AND t.name = 'Künstlerisch wertvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Flow' AND t.name = 'Künstlerisch wertvoll';

-- Weltraum
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Interstellar' AND t.name = 'Weltraum';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Arrival' AND t.name = 'Weltraum';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Odyssee im Weltraum' AND t.name = 'Weltraum';

-- Mindfuck
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Predestination' AND t.name = 'Mindfuck';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Donny darko' AND t.name = 'Mindfuck';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Memento' AND t.name = 'Mindfuck';

-- Vampire
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'So finster die Nacht' AND t.name = 'Vampire';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Only lovers left alive' AND t.name = 'Vampire';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Daybreakers' AND t.name = 'Vampire';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Nosferatu (Kinski)' AND t.name = 'Vampire';

-- Eskalation
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Requiem for a dream' AND t.name = 'Eskalation';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Wild tales' AND t.name = 'Eskalation';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Parasite' AND t.name = 'Eskalation';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Three billboards outside Ebbing Missouri' AND t.name = 'Eskalation';

-- Roadmovie
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Tschick' AND t.name = 'Roadmovie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Thelma und Louise' AND t.name = 'Roadmovie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Easy rider' AND t.name = 'Roadmovie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Y tu Mama Tambien' AND t.name = 'Roadmovie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The motorcycle diaries' AND t.name = 'Roadmovie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Queen & Slim' AND t.name = 'Roadmovie';

-- Aussteiger
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Into the wild' AND t.name = 'Aussteiger';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Die weiße Massai' AND t.name = 'Aussteiger';

-- Coming of age
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Kings of summer' AND t.name = 'Coming of age';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Die Reifeprüfung' AND t.name = 'Coming of age';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Mid 90s' AND t.name = 'Coming of age';

-- Alte Kamellen
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Arsen und Spitzenhäubchen' AND t.name = 'Alte Kamellen';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Feuerzangenbowle' AND t.name = 'Alte Kamellen';

-- Whatthefuck
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Swiss Army Men' AND t.name = 'Whatthefuck';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Beeing John Malcovich' AND t.name = 'Whatthefuck';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Wild (deutsch)' AND t.name = 'Whatthefuck';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Love Lies bleeding' AND t.name = 'Whatthefuck';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The substance' AND t.name = 'Whatthefuck';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The Double' AND t.name = 'Whatthefuck';

-- Tarrantino
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Django unchained' AND t.name = 'Tarrantino';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Reservoir dogs' AND t.name = 'Tarrantino';

-- Dark
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Pans Labyrinth' AND t.name = 'Dark';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Mullholland drive' AND t.name = 'Dark';

-- Almodovar
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Die Haut in der ich stecke' AND t.name = 'Almodovar';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Mal Education' AND t.name = 'Almodovar';

-- Zeitreise
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Butterfly effect' AND t.name = 'Zeitreise';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Zurück in die Zukunft' AND t.name = 'Zeitreise';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Mr Nobody' AND t.name = 'Zeitreise';

-- Deutsche Filme
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Ballon' AND t.name = 'Deutsche Filme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Oh boy' AND t.name = 'Deutsche Filme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Victoria' AND t.name = 'Deutsche Filme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Wer früher stirbt ist länger tot' AND t.name = 'Deutsche Filme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Die Blechtrommel' AND t.name = 'Deutsche Filme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Das fliegende Klassenzimmer' AND t.name = 'Deutsche Filme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Goodbye Lenin' AND t.name = 'Deutsche Filme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Jack' AND t.name = 'Deutsche Filme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Berlin Alexanderplatz' AND t.name = 'Deutsche Filme';

-- Zweiter Weltkrieg
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Das Leben ist schön' AND t.name = 'Zweiter Weltkrieg';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Der Soldat James Ryan' AND t.name = 'Zweiter Weltkrieg';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Der Junge mit dem gestreiften Pyjama' AND t.name = 'Zweiter Weltkrieg';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Werk ohne Autor' AND t.name = 'Zweiter Weltkrieg';

-- Zu Tränen gerührt
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Winnetou 3' AND t.name = 'Zu Tränen gerührt';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Capernaum' AND t.name = 'Zu Tränen gerührt';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Ghost' AND t.name = 'Zu Tränen gerührt';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = '7 kogustaki mucize' AND t.name = 'Zu Tränen gerührt';

-- Gay
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Brokeback Mountain' AND t.name = 'Gay';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Lost and delirious' AND t.name = 'Gay';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Aimée und Jaguar' AND t.name = 'Gay';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Call me by your name' AND t.name = 'Gay';

-- Schnulze
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Das Haus am See' AND t.name = 'Schnulze';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Mit dem Herz durch die Wand' AND t.name = 'Schnulze';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Serendipity' AND t.name = 'Schnulze';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Tatsächlich liebe' AND t.name = 'Schnulze';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Eternal sunshine of a spotless mind' AND t.name = 'Schnulze';

-- Drama
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Marriage Story' AND t.name = 'Drama';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Das Leben ist wie ein Stück Papier' AND t.name = 'Drama';

-- Psycho
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Shutter island' AND t.name = 'Psycho';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Black swan' AND t.name = 'Psycho';

-- Zombie
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Zombieland' AND t.name = 'Zombie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Warm bodies' AND t.name = 'Zombie';

-- Schräg
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The dead dont die' AND t.name = 'Schräg';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Das ist das Ende' AND t.name = 'Schräg';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Womb' AND t.name = 'Schräg';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The lobster' AND t.name = 'Schräg';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The disaster artist' AND t.name = 'Schräg';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Burn after reading' AND t.name = 'Schräg';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Männer die auf Ziegen starren' AND t.name = 'Schräg';

-- Aliens
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'A quiet place' AND t.name = 'Aliens';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'E.T.' AND t.name = 'Aliens';

-- Alien Universum
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Prometheus' AND t.name = 'Alien Universum';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Alien Covenant' AND t.name = 'Alien Universum';

-- Kifferfilm
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Lammbock' AND t.name = 'Kifferfilm';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'How high' AND t.name = 'Kifferfilm';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Grasgeflüster' AND t.name = 'Kifferfilm';

-- Französische Filme
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Die fabelhafte Welt der Amelie' AND t.name = 'Französische Filme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Ziemlich beste Freunde' AND t.name = 'Französische Filme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'La Haine' AND t.name = 'Französische Filme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Willkommen bei den Schtis' AND t.name = 'Französische Filme';

-- Dystopie
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Blade Runner' AND t.name = 'Dystopie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Gattaca' AND t.name = 'Dystopie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'V wie Vendetta' AND t.name = 'Dystopie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Idiocrazy' AND t.name = 'Dystopie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Leave the world behind' AND t.name = 'Dystopie';

-- Comic style
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Sin City' AND t.name = 'Comic style';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = '300' AND t.name = 'Comic style';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Into the Spiderverse' AND t.name = 'Comic style';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Renaissance' AND t.name = 'Comic style';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Teheran tabu' AND t.name = 'Comic style';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Waltz with Bashir' AND t.name = 'Comic style';

-- 90er Kinderfilme
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Kevin allein in New York' AND t.name = '90er Kinderfilme';

-- Jonny Depp
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Edward mit den Scheren Händen' AND t.name = 'Jonny Depp';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Gilbert Grape' AND t.name = 'Jonny Depp';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Wenn Träume fliegen lernen' AND t.name = 'Jonny Depp';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Dead man' AND t.name = 'Jonny Depp';

-- Leonardo Di Caprio
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The great Gatsby' AND t.name = 'Leonardo Di Caprio';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Titanic' AND t.name = 'Leonardo Di Caprio';

-- Schöne Männer
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Papillon' AND t.name = 'Schöne Männer';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The dark knight' AND t.name = 'Schöne Männer';

-- Schöne Frauen
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Wonder Woman' AND t.name = 'Schöne Frauen';

-- Crappy Teenie Horrorfilm
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'It follows' AND t.name = 'Crappy Teenie Horrorfilm';

-- Naturkatastrophen
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Der Sturm' AND t.name = 'Naturkatastrophen';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The Wave' AND t.name = 'Naturkatastrophen';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Twister' AND t.name = 'Naturkatastrophen';

-- Survival
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Fall' AND t.name = 'Survival';

-- Urwald
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Apocalypto' AND t.name = 'Urwald';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Jumanji' AND t.name = 'Urwald';

-- Gruselig
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Das Omen' AND t.name = 'Gruselig';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The others' AND t.name = 'Gruselig';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Coraline' AND t.name = 'Gruselig';

-- Tim Burton
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Batman' AND t.name = 'Tim Burton';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Sleepy hollow' AND t.name = 'Tim Burton';

-- Musicalfilme
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Les miserables' AND t.name = 'Musicalfilme';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Sweeny Tod' AND t.name = 'Musicalfilme';

-- Spielberg
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Unheimliche Begegnung der dritten Art' AND t.name = 'Spielberg';

-- Emmerich
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Independence Day' AND t.name = 'Emmerich';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Stargate' AND t.name = 'Emmerich';

-- Trash
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Sharknado' AND t.name = 'Trash';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Tucker and Dale vs. Evil' AND t.name = 'Trash';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Die Eisprinzen' AND t.name = 'Trash';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Iron sky' AND t.name = 'Trash';

-- Gesellschaftskritik
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Kein Mann für leichte Stunden' AND t.name = 'Gesellschaftskritik';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Triangle of Sadness' AND t.name = 'Gesellschaftskritik';

-- Kammerspiel
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Nicht auflegen' AND t.name = 'Kammerspiel';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Guilty' AND t.name = 'Kammerspiel';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Le Jeu' AND t.name = 'Kammerspiel';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Der Kreis' AND t.name = 'Kammerspiel';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Cube' AND t.name = 'Kammerspiel';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The room' AND t.name = 'Kammerspiel';

-- Krimi
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Knives out' AND t.name = 'Krimi';

-- Doku
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The Social Dilemma' AND t.name = 'Doku';

-- SERIEN Tag-Zuordnungen

-- Mindfuck
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Lost' AND t.name = 'Mindfuck';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Dark' AND t.name = 'Mindfuck';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'OA' AND t.name = 'Mindfuck';

-- Starke Charaktere
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Bir Baskadir - 8 Menschen in Istanbul' AND t.name = 'Starke Charaktere';

-- Wildnis
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Wild Republic' AND t.name = 'Wildnis';

-- Dystopie
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Years and Years' AND t.name = 'Dystopie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Black Mirror' AND t.name = 'Dystopie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Handmaids Tale' AND t.name = 'Dystopie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Sweettooth' AND t.name = 'Dystopie';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Watchmen' AND t.name = 'Dystopie';

-- Seichte aber nice Unterhaltung
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Modern family' AND t.name = 'Seichte aber nice Unterhaltung';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Never have I ever' AND t.name = 'Seichte aber nice Unterhaltung';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'King of Queens' AND t.name = 'Seichte aber nice Unterhaltung';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Berlin Berlin' AND t.name = 'Seichte aber nice Unterhaltung';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Türkisch für Anfänger' AND t.name = 'Seichte aber nice Unterhaltung';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'It crowd' AND t.name = 'Seichte aber nice Unterhaltung';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The sick Note' AND t.name = 'Seichte aber nice Unterhaltung';

-- Stimmungsvoll
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Gypsy' AND t.name = 'Stimmungsvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Die Gabe' AND t.name = 'Stimmungsvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Euphoria' AND t.name = 'Stimmungsvoll';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Young Royals' AND t.name = 'Stimmungsvoll';

-- Gay
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Orange is the new black' AND t.name = 'Gay';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Heartstopper' AND t.name = 'Gay';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Young Royals' AND t.name = 'Gay';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Tore' AND t.name = 'Gay';

-- Coming of age
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Atypical' AND t.name = 'Coming of age';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Sex education' AND t.name = 'Coming of age';

-- Jung sein
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Girls' AND t.name = 'Jung sein';

-- Schöne Männer
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Vampire Diaries' AND t.name = 'Schöne Männer';

-- Mystery
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Jordskott' AND t.name = 'Mystery';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Stranger things' AND t.name = 'Mystery';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Beforeigners' AND t.name = 'Mystery';

-- Fantasy
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Game of thrones' AND t.name = 'Fantasy';

-- Spannung
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Breaking bad' AND t.name = 'Spannung';

-- Schräg
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Better call Saul' AND t.name = 'Schräg';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Arrested development' AND t.name = 'Schräg';

-- Animation
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Love death & robots' AND t.name = 'Animation';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Undone' AND t.name = 'Animation';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Arcane' AND t.name = 'Animation';

-- Doku
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Age of A.I.' AND t.name = 'Doku';

-- Bizarr
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Severance' AND t.name = 'Bizarr';

-- BÜCHER Tag-Zuordnungen

-- Horizonterweiternd/ Gesellschaftskritik
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Löwen wecken' AND t.name = 'Horizonterweiternd/ Gesellschaftskritik';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Ein Platz an der Sonne' AND t.name = 'Horizonterweiternd/ Gesellschaftskritik';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Freie Geister' AND t.name = 'Horizonterweiternd/ Gesellschaftskritik';

-- Allende
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Insel unter dem Meer' AND t.name = 'Allende';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Zoro' AND t.name = 'Allende';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Mayas Tagebuch' AND t.name = 'Allende';

-- Lachen bleibt im Hals stecken
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Quality Land' AND t.name = 'Lachen bleibt im Hals stecken';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Quality Land 2.0' AND t.name = 'Lachen bleibt im Hals stecken';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Der Ursprung der Welt' AND t.name = 'Lachen bleibt im Hals stecken';

-- Fantasy
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Harry Potter 1-7 + Theaterstück' AND t.name = 'Fantasy';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Die 13 1/2 Leben des Captain Blaubär' AND t.name = 'Fantasy';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Rumo' AND t.name = 'Fantasy';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Herr der Ringe' AND t.name = 'Fantasy';

-- Stimmungsvoll
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Der Schatten des Windes' AND t.name = 'Stimmungsvoll';

-- Coming of Age
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Tschick' AND t.name = 'Coming of age';

-- Skandinavisch
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Populärmusik aus Vittula' AND t.name = 'Skandinavisch';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Die Tiefe (Mankel)' AND t.name = 'Skandinavisch';

-- Alberto Vazquez Figuera
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Oceano' AND t.name = 'Alberto Vazquez Figuera';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Der Leguan' AND t.name = 'Alberto Vazquez Figuera';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Tuareg' AND t.name = 'Alberto Vazquez Figuera';

-- Murakami
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Hard boiled Wonderland und das Ende der Welt' AND t.name = 'Murakami';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Mister Aufziehvogel' AND t.name = 'Murakami';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Gefährliche Geliebte' AND t.name = 'Murakami';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Schlaf' AND t.name = 'Murakami';

-- Arto Paasilinna
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Die Giftköchin' AND t.name = 'Arto Paasilinna';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Sommer der lachenden Kühe' AND t.name = 'Arto Paasilinna';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Das Jahr des Hasen' AND t.name = 'Arto Paasilinna';

-- Kinderbücher
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Jim Knopf und Lukas der Lokomotivführer' AND t.name = 'Kinderbücher';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Jim Knopf und die wilde 13' AND t.name = 'Kinderbücher';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Momo' AND t.name = 'Kinderbücher';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Mio mein Mio' AND t.name = 'Kinderbücher';

-- Sachbücher
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Im Grunde gut' AND t.name = 'Sachbücher';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Darm mit Charme' AND t.name = 'Sachbücher';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Eine kurze Geschichte der Menschheit' AND t.name = 'Sachbücher';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Sonst knallts' AND t.name = 'Sachbücher';

-- Ratgeber
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'The magic cleaning von Mari Kondo' AND t.name = 'Ratgeber';
INSERT INTO movie_tags (movie_id, tag_id) SELECT m.id, t.id FROM movies m, tags t WHERE m.title = 'Simplify your life' AND t.name = 'Ratgeber';
