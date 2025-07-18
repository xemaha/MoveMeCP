-- Import Script für Movie/Series/Book Collection
-- Dieses Script fügt alle Filme, Serien und Bücher aus der Liste hinzu

-- Erst die Tags erstellen (falls sie nicht existieren)
-- Verwende INSERT mit WHERE NOT EXISTS für Duplikate
INSERT INTO tags (name, color) 
SELECT name, color FROM (VALUES 
-- Film Tags
('Animation', '#FF6B6B'),
('Zeichentrickfilm', '#4ECDC4'),
('Reise', '#45B7D1'),
('DC', '#DC143C'),
('Marvel', '#FF0000'),
('Wes Anderson', '#F7DC6F'),
('Metapher für die Welt', '#8E44AD'),
('Stimmungsvoll', '#3498DB'),
('Künstlerisch wertvoll', '#E67E22'),
('Weltraum', '#2C3E50'),
('Mindfuck', '#9B59B6'),
('Vampire', '#A52A2A'),
('Eskalation', '#E74C3C'),
('Roadmovie', '#F39C12'),
('Aussteiger', '#27AE60'),
('Coming of age', '#F1C40F'),
('Alte Kamellen', '#95A5A6'),
('Whatthefuck', '#E91E63'),
('Tarrantino', '#FF5722'),
('Dark', '#424242'),
('Almodovar', '#FF1744'),
('Zeitreise', '#00BCD4'),
('Deutsche Filme', '#FFC107'),
('Zweiter Weltkrieg', '#795548'),
('Zu Tränen gerührt', '#9C27B0'),
('Gay', '#E91E63'),
('Schnulze', '#F48FB1'),
('Drama', '#607D8B'),
('Psycho', '#263238'),
('Zombie', '#4CAF50'),
('Schräg', '#FF9800'),
('Aliens', '#009688'),
('Alien Universum', '#004D40'),
('Kifferfilm', '#8BC34A'),
('Französische Filme', '#3F51B5'),
('Dystopie', '#37474F'),
('Comic style', '#FF5722'),
('90er Kinderfilme', '#FFEB3B'),
('Jonny Depp', '#6A1B9A'),
('Leonardo Di Caprio', '#1976D2'),
('Schöne Männer', '#FF6F00'),
('Schöne Frauen', '#E91E63'),
('Crappy Teenie Horrorfilm', '#BF360C'),
('Naturkatastrophen', '#2E7D32'),
('Survival', '#1B5E20'),
('Urwald', '#388E3C'),
('Gruselig', '#424242'),
('Tim Burton', '#9C27B0'),
('Musicalfilme', '#E1BEE7'),
('Spielberg', '#1565C0'),
('Emmerich', '#0277BD'),
('Trash', '#FF9800'),
('Gesellschaftskritik', '#5D4037'),
('Kammerspiel', '#37474F'),
('Krimi', '#455A64'),
('Doku', '#607D8B'),
-- Serien Tags
('Starke Charaktere', '#795548'),
('Wildnis', '#4CAF50'),
('Seichte aber nice Unterhaltung', '#FFEB3B'),
('Mystery', '#673AB7'),
('Fantasy', '#9C27B0'),
('Spannung', '#F44336'),
('Bizarr', '#FF5722'),
('Jung sein', '#E91E63'),
-- Bücher Tags
('Horizonterweiternd/ Gesellschaftskritik', '#5D4037'),
('Allende', '#FF5722'),
('Lachen bleibt im Hals stecken', '#FF9800'),
('Skandinavisch', '#607D8B'),
('Alberto Vazquez Figuera', '#795548'),
('Murakami', '#9C27B0'),
('Arto Paasilinna', '#4CAF50'),
('Kinderbücher', '#FFEB3B'),
('Sachbücher', '#607D8B'),
('Ratgeber', '#2196F3')
) AS t(name, color)
WHERE NOT EXISTS (
    SELECT 1 FROM tags WHERE tags.name = t.name
);

-- Jetzt die Filme einfügen
INSERT INTO movies (title, content_type, created_by) 
SELECT title, content_type, created_by FROM (VALUES
-- Animation
('Lego Batman', 'film', 'System'),
('Avatar', 'film', 'System'),
-- Zeichentrickfilm
('Ein Königreich für ein Lama', 'film', 'System'),
('Der Goofy Film', 'film', 'System'),
('König der Löwen', 'film', 'System'),
('Falsches Spiel um Roger rabbit', 'film', 'System'),
('Der Brotverdiener', 'film', 'System'),
('Ich habe meinen Körper verloren', 'film', 'System'),
('Spirit - Der wilde Mustang', 'film', 'System'),
-- Reise
('Weit', 'film', 'System'),
('Wild (Reese Witherspoon)', 'film', 'System'),
-- DC
('Joker', 'film', 'System'),
-- Marvel
('Deadpool I', 'film', 'System'),
('Deadpool 2', 'film', 'System'),
('Spiderman - No way Home', 'film', 'System'),
('Free Guy', 'film', 'System'),
-- Wes Anderson
('Grand Budapest Hotel', 'film', 'System'),
('Tiefseetaucher', 'film', 'System'),
('Moonrise kingdom', 'film', 'System'),
('Wes Anderson - Roald-Dahl Kurzfilmreihe auf Netflix', 'film', 'System'),
('Der Phönizische Meisterstreich', 'film', 'System'),
-- Metapher für die Welt
('Snow Piercer', 'film', 'System'),
('Mother', 'film', 'System'),
('High Rise', 'film', 'System'),
('Der Schacht', 'film', 'System'),
-- Stimmungsvoll
('Her', 'film', 'System'),
('Perfect Sense', 'film', 'System'),
('Boké', 'film', 'System'),
('Wall E', 'film', 'System'),
('Ex Machina', 'film', 'System'),
('Oh beautiful night', 'film', 'System'),
('Ein ganzes Leben', 'film', 'System'),
('Angel-A', 'film', 'System'),
-- Künstlerisch wertvoll
('The Frame', 'film', 'System'),
('The Artist', 'film', 'System'),
('Phantasia', 'film', 'System'),
('Flow', 'film', 'System'),
-- Weltraum
('Interstellar', 'film', 'System'),
('Arrival', 'film', 'System'),
('Odyssee im Weltraum', 'film', 'System'),
-- Mindfuck
('Predestination', 'film', 'System'),
('Donny darko', 'film', 'System'),
('Memento', 'film', 'System'),
-- Vampire
('So finster die Nacht', 'film', 'System'),
('Only lovers left alive', 'film', 'System'),
('Daybreakers', 'film', 'System'),
('Nosferatu (Kinski)', 'film', 'System'),
-- Eskalation
('Requiem for a dream', 'film', 'System'),
('Wild tales', 'film', 'System'),
('Parasite', 'film', 'System'),
('Three billboards outside Ebbing Missouri', 'film', 'System'),
-- Roadmovie
('Tschick', 'film', 'System'),
('Thelma und Louise', 'film', 'System'),
('Easy rider', 'film', 'System'),
('Y tu Mama Tambien', 'film', 'System'),
('The motorcycle diaries', 'film', 'System'),
('Queen & Slim', 'film', 'System'),
-- Aussteiger
('Into the wild', 'film', 'System'),
('Die weiße Massai', 'film', 'System'),
-- Coming of age
('Kings of summer', 'film', 'System'),
('Die Reifeprüfung', 'film', 'System'),
('Mid 90s', 'film', 'System'),
-- Alte Kamellen
('Arsen und Spitzenhäubchen', 'film', 'System'),
('Feuerzangenbowle', 'film', 'System'),
-- Whatthefuck
('Swiss Army Men', 'film', 'System'),
('Beeing John Malcovich', 'film', 'System'),
('Wild (deutsch)', 'film', 'System'),
('Love Lies bleeding', 'film', 'System'),
('The substance', 'film', 'System'),
('The Double', 'film', 'System'),
-- Tarrantino
('Django unchained', 'film', 'System'),
('Reservoir dogs', 'film', 'System'),
-- Dark
('Pans Labyrinth', 'film', 'System'),
('Mullholland drive', 'film', 'System'),
-- Almodovar
('Die Haut in der ich stecke', 'film', 'System'),
('Mal Education', 'film', 'System'),
-- Zeitreise
('Butterfly effect', 'film', 'System'),
('Zurück in die Zukunft', 'film', 'System'),
('Mr Nobody', 'film', 'System'),
-- Deutsche Filme
('Ballon', 'film', 'System'),
('Oh boy', 'film', 'System'),
('Victoria', 'film', 'System'),
('Wer früher stirbt ist länger tot', 'film', 'System'),
('Die Blechtrommel', 'film', 'System'),
('Das fliegende Klassenzimmer', 'film', 'System'),
('Goodbye Lenin', 'film', 'System'),
('Jack', 'film', 'System'),
('Berlin Alexanderplatz', 'film', 'System'),
-- Zweiter Weltkrieg
('Das Leben ist schön', 'film', 'System'),
('Der Soldat James Ryan', 'film', 'System'),
('Der Junge mit dem gestreiften Pyjama', 'film', 'System'),
('Werk ohne Autor', 'film', 'System'),
-- Zu Tränen gerührt
('Winnetou 3', 'film', 'System'),
('Capernaum', 'film', 'System'),
('Ghost', 'film', 'System'),
('7 kogustaki mucize', 'film', 'System'),
-- Gay
('Brokeback Mountain', 'film', 'System'),
('Lost and delirious', 'film', 'System'),
('Aimée und Jaguar', 'film', 'System'),
('Call me by your name', 'film', 'System'),
-- Schnulze
('Das Haus am See', 'film', 'System'),
('Mit dem Herz durch die Wand', 'film', 'System'),
('Serendipity', 'film', 'System'),
('Tatsächlich liebe', 'film', 'System'),
('Eternal sunshine of a spotless mind', 'film', 'System'),
-- Drama
('Marriage Story', 'film', 'System'),
('Das Leben ist wie ein Stück Papier', 'film', 'System'),
-- Psycho
('Shutter island', 'film', 'System'),
('Black swan', 'film', 'System'),
-- Zombie
('Zombieland', 'film', 'System'),
('Warm bodies', 'film', 'System'),
-- Schräg
('The dead dont die', 'film', 'System'),
('Das ist das Ende', 'film', 'System'),
('Womb', 'film', 'System'),
('The lobster', 'film', 'System'),
('The disaster artist', 'film', 'System'),
('Burn after reading', 'film', 'System'),
('Männer die auf Ziegen starren', 'film', 'System'),
-- Aliens
('A quiet place', 'film', 'System'),
('E.T.', 'film', 'System'),
-- Alien Universum
('Prometheus', 'film', 'System'),
('Alien Covenant', 'film', 'System'),
-- Kifferfilm
('Lammbock', 'film', 'System'),
('How high', 'film', 'System'),
('Grasgeflüster', 'film', 'System'),
-- Französische Filme
('Die fabelhafte Welt der Amelie', 'film', 'System'),
('Ziemlich beste Freunde', 'film', 'System'),
('La Haine', 'film', 'System'),
('Willkommen bei den Schtis', 'film', 'System'),
-- Dystopie
('Blade Runner', 'film', 'System'),
('Gattaca', 'film', 'System'),
('V wie Vendetta', 'film', 'System'),
('Idiocrazy', 'film', 'System'),
('Leave the world behind', 'film', 'System'),
-- Comic style
('Sin City', 'film', 'System'),
('300', 'film', 'System'),
('Into the Spiderverse', 'film', 'System'),
('Renaissance', 'film', 'System'),
('Teheran tabu', 'film', 'System'),
('Waltz with Bashir', 'film', 'System'),
-- 90er Kinderfilme
('Kevin allein in New York', 'film', 'System'),
-- Jonny Depp
('Edward mit den Scheren Händen', 'film', 'System'),
('Gilbert Grape', 'film', 'System'),
('Wenn Träume fliegen lernen', 'film', 'System'),
('Dead man', 'film', 'System'),
-- Leonardo Di Caprio
('The great Gatsby', 'film', 'System'),
('Titanic', 'film', 'System'),
-- Schöne Männer
('Papillon', 'film', 'System'),
('The dark knight', 'film', 'System'),
-- Schöne Frauen
('Wonder Woman', 'film', 'System'),
-- Crappy Teenie Horrorfilm
('It follows', 'film', 'System'),
-- Naturkatastrophen
('Der Sturm', 'film', 'System'),
('The Wave', 'film', 'System'),
('Twister', 'film', 'System'),
-- Survival
('Fall', 'film', 'System'),
-- Urwald
('Apocalypto', 'film', 'System'),
('Jumanji', 'film', 'System'),
-- Gruselig
('Das Omen', 'film', 'System'),
('The others', 'film', 'System'),
('Coraline', 'film', 'System'),
-- Tim Burton
('Batman', 'film', 'System'),
('Sleepy hollow', 'film', 'System'),
-- Musicalfilme
('Les miserables', 'film', 'System'),
('Sweeny Tod', 'film', 'System'),
-- Spielberg
('Unheimliche Begegnung der dritten Art', 'film', 'System'),
-- Emmerich
('Independence Day', 'film', 'System'),
('Stargate', 'film', 'System'),
-- Trash
('Sharknado', 'film', 'System'),
('Tucker and Dale vs. Evil', 'film', 'System'),
('Die Eisprinzen', 'film', 'System'),
('Iron sky', 'film', 'System'),
-- Gesellschaftskritik
('Kein Mann für leichte Stunden', 'film', 'System'),
('Triangle of Sadness', 'film', 'System'),
-- Kammerspiel
('Nicht auflegen', 'film', 'System'),
('Guilty', 'film', 'System'),
('Le Jeu', 'film', 'System'),
('Der Kreis', 'film', 'System'),
('Cube', 'film', 'System'),
('The room', 'film', 'System'),
-- Krimi
('Knives out', 'film', 'System'),
-- Doku
('The Social Dilemma', 'film', 'System'),

-- SERIEN
-- Mindfuck
('Lost', 'serie', 'System'),
('Dark', 'serie', 'System'),
('OA', 'serie', 'System'),
-- Starke Charaktere
('Bir Baskadir - 8 Menschen in Istanbul', 'serie', 'System'),
-- Wildnis
('Wild Republic', 'serie', 'System'),
-- Dystopie
('Years and Years', 'serie', 'System'),
('Black Mirror', 'serie', 'System'),
('Handmaids Tale', 'serie', 'System'),
('Sweettooth', 'serie', 'System'),
('Watchmen', 'serie', 'System'),
-- Seichte aber nice Unterhaltung
('Modern family', 'serie', 'System'),
('Never have I ever', 'serie', 'System'),
('King of Queens', 'serie', 'System'),
('Berlin Berlin', 'serie', 'System'),
('Türkisch für Anfänger', 'serie', 'System'),
('It crowd', 'serie', 'System'),
('The sick Note', 'serie', 'System'),
-- Stimmungsvoll
('Gypsy', 'serie', 'System'),
('Die Gabe', 'serie', 'System'),
('Euphoria', 'serie', 'System'),
('Young Royals', 'serie', 'System'),
-- Gay
('Orange is the new black', 'serie', 'System'),
('Heartstopper', 'serie', 'System'),
('Tore', 'serie', 'System'),
-- Coming of age
('Atypical', 'serie', 'System'),
('Sex education', 'serie', 'System'),
-- Jung sein
('Girls', 'serie', 'System'),
-- Schöne Männer
('Vampire Diaries', 'serie', 'System'),
-- Mystery
('Jordskott', 'serie', 'System'),
('Stranger things', 'serie', 'System'),
('Beforeigners', 'serie', 'System'),
-- Fantasy
('Game of thrones', 'serie', 'System'),
-- Spannung
('Breaking bad', 'serie', 'System'),
-- Schräg
('Better call Saul', 'serie', 'System'),
('Arrested development', 'serie', 'System'),
-- Animation
('Love death & robots', 'serie', 'System'),
('Undone', 'serie', 'System'),
('Arcane', 'serie', 'System'),
-- Doku
('Age of A.I.', 'serie', 'System'),
-- Bizarr
('Severance', 'serie', 'System'),

-- BÜCHER
-- Horizonterweiternd/ Gesellschaftskritik
('Löwen wecken', 'buch', 'System'),
('Ein Platz an der Sonne', 'buch', 'System'),
('Freie Geister', 'buch', 'System'),
-- Allende
('Insel unter dem Meer', 'buch', 'System'),
('Zoro', 'buch', 'System'),
('Mayas Tagebuch', 'buch', 'System'),
-- Lachen bleibt im Hals stecken
('Quality Land', 'buch', 'System'),
('Quality Land 2.0', 'buch', 'System'),
('Der Ursprung der Welt', 'buch', 'System'),
-- Fantasy
('Harry Potter 1-7 + Theaterstück', 'buch', 'System'),
('Die 13 1/2 Leben des Captain Blaubär', 'buch', 'System'),
('Rumo', 'buch', 'System'),
('Herr der Ringe', 'buch', 'System'),
-- Stimmungsvoll
('Der Schatten des Windes', 'buch', 'System'),
-- Coming of Age
('Tschick', 'buch', 'System'),
-- Skandinavisch
('Populärmusik aus Vittula', 'buch', 'System'),
('Die Tiefe (Mankel)', 'buch', 'System'),
-- Alberto Vazquez Figuera
('Oceano', 'buch', 'System'),
('Der Leguan', 'buch', 'System'),
('Tuareg', 'buch', 'System'),
-- Murakami
('Hard boiled Wonderland und das Ende der Welt', 'buch', 'System'),
('Mister Aufziehvogel', 'buch', 'System'),
('Gefährliche Geliebte', 'buch', 'System'),
('Schlaf', 'buch', 'System'),
-- Arto Paasilinna
('Die Giftköchin', 'buch', 'System'),
('Sommer der lachenden Kühe', 'buch', 'System'),
('Das Jahr des Hasen', 'buch', 'System'),
-- Kinderbücher
('Jim Knopf und Lukas der Lokomotivführer', 'buch', 'System'),
('Jim Knopf und die wilde 13', 'buch', 'System'),
('Momo', 'buch', 'System'),
('Mio mein Mio', 'buch', 'System'),
-- Sachbücher
('Im Grunde gut', 'buch', 'System'),
('Darm mit Charme', 'buch', 'System'),
('Eine kurze Geschichte der Menschheit', 'buch', 'System'),
('Sonst knallts', 'buch', 'System'),
-- Ratgeber
('The magic cleaning von Mari Kondo', 'buch', 'System'),
('Simplify your life', 'buch', 'System')
) AS t(title, content_type, created_by)
WHERE NOT EXISTS (
    SELECT 1 FROM movies WHERE movies.title = t.title AND movies.content_type = t.content_type
);
