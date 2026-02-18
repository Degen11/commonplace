// ===================== LOCAL QUOTE DATABASE =====================
// Add new quotes here — format: { t: "normalized lowercase no punctuation", s: "Source", c: "Category" }
// Categories: Film, TV, Book, Music, Speech, Person, Phrase
const LOCAL_DB_RAW = [
  // ── Film ──
  {t:"you cant handle the truth",s:"A Few Good Men (1992) - Col. Jessup",c:"Film"},
  {t:"heres looking at you kid",s:"Casablanca (1942) - Rick Blaine",c:"Film"},
  {t:"ill be back",s:"The Terminator (1984) - The Terminator",c:"Film"},
  {t:"may the force be with you",s:"Star Wars (1977) - Various",c:"Film"},
  {t:"to infinity and beyond",s:"Toy Story (1995) - Buzz Lightyear",c:"Film"},
  {t:"houston we have a problem",s:"Apollo 13 (1995) - Jim Lovell",c:"Film"},
  {t:"life is like a box of chocolates you never know what youre gonna get",s:"Forrest Gump (1994) - Forrest Gump",c:"Film"},
  {t:"life is like a box of chocolates",s:"Forrest Gump (1994) - Forrest Gump",c:"Film"},
  {t:"mama always said life was like a box of chocolates",s:"Forrest Gump (1994) - Forrest Gump",c:"Film"},
  {t:"after all tomorrow is another day",s:"Gone with the Wind (1939) - Scarlett O'Hara",c:"Film"},
  {t:"frankly my dear i dont give a damn",s:"Gone with the Wind (1939) - Rhett Butler",c:"Film"},
  {t:"im going to make him an offer he cant refuse",s:"The Godfather (1972) - Vito Corleone",c:"Film"},
  {t:"im gonna make him an offer he cant refuse",s:"The Godfather (1972) - Vito Corleone",c:"Film"},
  {t:"you talking to me",s:"Taxi Driver (1976) - Travis Bickle",c:"Film"},
  {t:"heres johnny",s:"The Shining (1980) - Jack Torrance",c:"Film"},
  {t:"i see dead people",s:"The Sixth Sense (1999) - Cole Sear",c:"Film"},
  {t:"there is no spoon",s:"The Matrix (1999) - Spoon Boy",c:"Film"},
  {t:"i am your father",s:"The Empire Strikes Back (1980) - Darth Vader",c:"Film"},
  {t:"no i am your father",s:"The Empire Strikes Back (1980) - Darth Vader",c:"Film"},
  {t:"why so serious",s:"The Dark Knight (2008) - The Joker",c:"Film"},
  {t:"you either die a hero or you live long enough to see yourself become the villain",s:"The Dark Knight (2008) - Harvey Dent",c:"Film"},
  {t:"its not who i am underneath but what i do that defines me",s:"Batman Begins (2005) - Batman",c:"Film"},
  {t:"keep your friends close but your enemies closer",s:"The Godfather Part II (1974) - Michael Corleone",c:"Film"},
  {t:"say hello to my little friend",s:"Scarface (1983) - Tony Montana",c:"Film"},
  {t:"i feel the need the need for speed",s:"Top Gun (1986) - Maverick",c:"Film"},
  {t:"you had me at hello",s:"Jerry Maguire (1996) - Dorothy Boyd",c:"Film"},
  {t:"show me the money",s:"Jerry Maguire (1996) - Rod Tidwell",c:"Film"},
  {t:"just keep swimming",s:"Finding Nemo (2003) - Dory",c:"Film"},
  {t:"with great power comes great responsibility",s:"Spider-Man (2002) - Uncle Ben",c:"Film"},
  {t:"im the king of the world",s:"Titanic (1997) - Jack Dawson",c:"Film"},
  {t:"roads where were going we dont need roads",s:"Back to the Future (1985) - Doc Brown",c:"Film"},
  {t:"nobody puts baby in a corner",s:"Dirty Dancing (1987) - Johnny Castle",c:"Film"},
  {t:"et phone home",s:"E.T. (1982) - E.T.",c:"Film"},
  {t:"wax on wax off",s:"The Karate Kid (1984) - Mr. Miyagi",c:"Film"},
  {t:"i drink your milkshake",s:"There Will Be Blood (2007) - Daniel Plainview",c:"Film"},
  {t:"i wish i knew how to quit you",s:"Brokeback Mountain (2005) - Jack Twist",c:"Film"},
  {t:"the first rule of fight club is you do not talk about fight club",s:"Fight Club (1999) - Tyler Durden",c:"Film"},
  {t:"it is not our abilities that show what we truly are it is our choices",s:"Harry Potter and the Chamber of Secrets (2002) - Dumbledore",c:"Film"},
  {t:"we accept the love we think we deserve",s:"The Perks of Being a Wallflower (2012) - Mr. Anderson",c:"Film"},
  {t:"the things you own end up owning you",s:"Fight Club (1999) - Tyler Durden",c:"Film"},
  {t:"hope is a good thing maybe the best of things and no good thing ever dies",s:"The Shawshank Redemption (1994) - Andy Dufresne",c:"Film"},
  {t:"get busy living or get busy dying",s:"The Shawshank Redemption (1994) - Andy Dufresne",c:"Film"},
  {t:"oh captain my captain",s:"Dead Poets Society (1989) - Todd Anderson",c:"Film"},
  {t:"carpe diem seize the day boys",s:"Dead Poets Society (1989) - John Keating",c:"Film"},
  {t:"carpe diem",s:"Dead Poets Society (1989) - John Keating",c:"Film"},
  {t:"all those moments will be lost in time like tears in rain",s:"Blade Runner (1982) - Roy Batty",c:"Film"},
  {t:"do or do not there is no try",s:"The Empire Strikes Back (1980) - Yoda",c:"Film"},
  {t:"the dude abides",s:"The Big Lebowski (1998) - The Dude",c:"Film"},
  {t:"thats just like your opinion man",s:"The Big Lebowski (1998) - The Dude",c:"Film"},

  // ── TV ──
  {t:"i am the one who knocks",s:"Breaking Bad - Walter White",c:"TV"},
  {t:"say my name",s:"Breaking Bad - Walter White",c:"TV"},
  {t:"winter is coming",s:"Game of Thrones - House Stark",c:"TV"},
  {t:"a lannister always pays his debts",s:"Game of Thrones - Tyrion Lannister",c:"TV"},
  {t:"thats what she said",s:"The Office - Michael Scott",c:"TV"},
  {t:"how you doin",s:"Friends - Joey Tribbiani",c:"TV"},
  {t:"we were on a break",s:"Friends - Ross Geller",c:"TV"},
  {t:"you know nothing jon snow",s:"Game of Thrones - Ygritte",c:"TV"},
  {t:"i am the danger",s:"Breaking Bad - Walter White",c:"TV"},
  {t:"the night is dark and full of terrors",s:"Game of Thrones - Melisandre",c:"TV"},
  {t:"cool cool cool cool cool",s:"Brooklyn Nine-Nine - Jake Peralta",c:"TV"},
  {t:"this is the way",s:"The Mandalorian - Din Djarin",c:"TV"},
  {t:"i have spoken",s:"The Mandalorian - Kuiil",c:"TV"},
  {t:"bazinga",s:"The Big Bang Theory - Sheldon Cooper",c:"TV"},
  {t:"suit up",s:"How I Met Your Mother - Barney Stinson",c:"TV"},
  {t:"legend wait for it dary",s:"How I Met Your Mother - Barney Stinson",c:"TV"},
  {t:"title of your sex tape",s:"Brooklyn Nine-Nine - Jake Peralta",c:"TV"},

  // ── Book ──
  {t:"it is a truth universally acknowledged that a single man in possession of a good fortune must be in want of a wife",s:"Pride and Prejudice - Jane Austen",c:"Book"},
  {t:"all that is gold does not glitter not all those who wander are lost",s:"The Lord of the Rings - J.R.R. Tolkien",c:"Book"},
  {t:"not all those who wander are lost",s:"The Lord of the Rings - J.R.R. Tolkien",c:"Book"},
  {t:"all we have to decide is what to do with the time that is given us",s:"The Lord of the Rings - J.R.R. Tolkien",c:"Book"},
  {t:"it was the best of times it was the worst of times",s:"A Tale of Two Cities - Charles Dickens",c:"Book"},
  {t:"so it goes",s:"Slaughterhouse-Five - Kurt Vonnegut",c:"Book"},
  {t:"call me ishmael",s:"Moby Dick - Herman Melville",c:"Book"},
  {t:"it was a bright cold day in april and the clocks were striking thirteen",s:"1984 - George Orwell",c:"Book"},
  {t:"all animals are equal but some animals are more equal than others",s:"Animal Farm - George Orwell",c:"Book"},
  {t:"big brother is watching you",s:"1984 - George Orwell",c:"Book"},
  {t:"war is peace freedom is slavery ignorance is strength",s:"1984 - George Orwell",c:"Book"},
  {t:"the world breaks everyone and afterward many are strong at the broken places",s:"A Farewell to Arms - Ernest Hemingway",c:"Book"},
  {t:"the world breaks everyone",s:"A Farewell to Arms - Ernest Hemingway",c:"Book"},
  {t:"stay gold ponyboy",s:"The Outsiders - S.E. Hinton",c:"Book"},
  {t:"one ring to rule them all",s:"The Lord of the Rings - J.R.R. Tolkien",c:"Book"},
  {t:"in a hole in the ground there lived a hobbit",s:"The Hobbit - J.R.R. Tolkien",c:"Book"},
  {t:"it is only with the heart that one can see rightly what is essential is invisible to the eye",s:"The Little Prince - Antoine de Saint-Exupéry",c:"Book"},
  {t:"what is essential is invisible to the eye",s:"The Little Prince - Antoine de Saint-Exupéry",c:"Book"},
  {t:"so we beat on boats against the current borne back ceaselessly into the past",s:"The Great Gatsby - F. Scott Fitzgerald",c:"Book"},
  {t:"the only people for me are the mad ones",s:"On the Road - Jack Kerouac",c:"Book"},
  {t:"i took the one less traveled by and that has made all the difference",s:"The Road Not Taken - Robert Frost",c:"Book"},
  {t:"two roads diverged in a wood and i i took the one less traveled by",s:"The Road Not Taken - Robert Frost",c:"Book"},
  {t:"to be or not to be that is the question",s:"Hamlet - William Shakespeare",c:"Book"},
  {t:"all the worlds a stage and all the men and women merely players",s:"As You Like It - William Shakespeare",c:"Book"},
  {t:"the lady doth protest too much methinks",s:"Hamlet - William Shakespeare",c:"Book"},
  {t:"brevity is the soul of wit",s:"Hamlet - William Shakespeare",c:"Book"},
  {t:"beware the ides of march",s:"Julius Caesar - William Shakespeare",c:"Book"},
  {t:"who controls the past controls the future who controls the present controls the past",s:"1984 - George Orwell",c:"Book"},
  {t:"it does not do to dwell on dreams and forget to live",s:"Harry Potter and the Philosopher's Stone - J.K. Rowling",c:"Book"},
  {t:"happiness can be found even in the darkest of times if one only remembers to turn on the light",s:"Harry Potter and the Prisoner of Azkaban - J.K. Rowling",c:"Book"},
  {t:"to thine own self be true",s:"Hamlet - William Shakespeare",c:"Book"},

  // ── Speech ──
  {t:"the only thing we have to fear is fear itself",s:"FDR - Inaugural Address (1933)",c:"Speech"},
  {t:"i have a dream",s:"Martin Luther King Jr. - March on Washington (1963)",c:"Speech"},
  {t:"ask not what your country can do for you ask what you can do for your country",s:"John F. Kennedy - Inaugural Address (1961)",c:"Speech"},
  {t:"give me liberty or give me death",s:"Patrick Henry - Speech (1775)",c:"Speech"},

  // ── Person ──
  {t:"i think therefore i am",s:"René Descartes",c:"Person"},
  {t:"be the change you wish to see in the world",s:"Mahatma Gandhi",c:"Person"},
  {t:"be the change that you wish to see in the world",s:"Mahatma Gandhi",c:"Person"},
  {t:"in the middle of difficulty lies opportunity",s:"Albert Einstein",c:"Person"},
  {t:"imagination is more important than knowledge",s:"Albert Einstein",c:"Person"},
  {t:"the unexamined life is not worth living",s:"Socrates",c:"Person"},
  {t:"i know that i know nothing",s:"Socrates",c:"Person"},
  {t:"that which does not kill us makes us stronger",s:"Friedrich Nietzsche",c:"Person"},
  {t:"what does not kill me makes me stronger",s:"Friedrich Nietzsche",c:"Person"},
  {t:"god is dead",s:"Friedrich Nietzsche - The Gay Science",c:"Person"},
  {t:"hell is other people",s:"Jean-Paul Sartre - No Exit",c:"Person"},
  {t:"one cannot step twice in the same river",s:"Heraclitus",c:"Person"},
  {t:"the medium is the message",s:"Marshall McLuhan",c:"Person"},
  {t:"you miss 100 of the shots you dont take",s:"Wayne Gretzky",c:"Person"},
  {t:"you miss 100 percent of the shots you dont take",s:"Wayne Gretzky",c:"Person"},
  {t:"float like a butterfly sting like a bee",s:"Muhammad Ali",c:"Person"},
  {t:"the definition of insanity is doing the same thing over and over and expecting different results",s:"Often attributed to Albert Einstein",c:"Person"},
  {t:"if you judge a fish by its ability to climb a tree it will live its whole life believing that it is stupid",s:"Often attributed to Albert Einstein",c:"Person"},
  {t:"those who cannot remember the past are condemned to repeat it",s:"George Santayana",c:"Person"},
  {t:"an eye for an eye makes the whole world blind",s:"Mahatma Gandhi",c:"Person"},
  {t:"the pen is mightier than the sword",s:"Edward Bulwer-Lytton",c:"Person"},
  {t:"knowledge is power",s:"Francis Bacon",c:"Person"},
  {t:"i came i saw i conquered",s:"Julius Caesar",c:"Person"},
  {t:"the only thing necessary for the triumph of evil is for good men to do nothing",s:"Often attributed to Edmund Burke",c:"Person"},
  {t:"we are what we repeatedly do excellence then is not an act but a habit",s:"Will Durant (on Aristotle)",c:"Person"},
  {t:"the journey of a thousand miles begins with a single step",s:"Lao Tzu - Tao Te Ching",c:"Person"},
  {t:"where there is love there is life",s:"Mahatma Gandhi",c:"Person"},
  {t:"turn your wounds into wisdom",s:"Oprah Winfrey",c:"Person"},
  {t:"the best time to plant a tree was 20 years ago the second best time is now",s:"Chinese Proverb",c:"Person"},
  {t:"if you want to go fast go alone if you want to go far go together",s:"African Proverb",c:"Person"},
  {t:"the obstacle is the way",s:"Marcus Aurelius - Meditations",c:"Person"},
  {t:"this too shall pass",s:"Persian Proverb",c:"Person"},
  {t:"the best revenge is living well",s:"Often attributed to George Herbert",c:"Person"},
  {t:"we suffer more in imagination than in reality",s:"Seneca",c:"Person"},
  {t:"luck is what happens when preparation meets opportunity",s:"Seneca",c:"Person"},
  {t:"it is not death that a man should fear but he should fear never beginning to live",s:"Marcus Aurelius",c:"Person"},
  {t:"waste no more time arguing about what a good man should be be one",s:"Marcus Aurelius - Meditations",c:"Person"},
  {t:"man is condemned to be free",s:"Jean-Paul Sartre",c:"Person"},
  {t:"one must imagine sisyphus happy",s:"Albert Camus - The Myth of Sisyphus",c:"Person"},
  {t:"in the depth of winter i finally learned that within me there lay an invincible summer",s:"Albert Camus",c:"Person"},

  // ── Phrase ──
  {t:"memento mori",s:"Stoic Philosophy",c:"Phrase"},
  {t:"amor fati",s:"Friedrich Nietzsche / Stoic Philosophy",c:"Phrase"},

  // ── Music ──
  {t:"is this the real life is this just fantasy",s:"Bohemian Rhapsody - Queen",c:"Music"},
  {t:"imagine all the people living life in peace",s:"Imagine - John Lennon",c:"Music"},
  {t:"we are the champions",s:"We Are the Champions - Queen",c:"Music"},
];

// Build lookup structures
const LOCAL_DB = LOCAL_DB_RAW.map(q => ({ ...q, norm: q.t }));
const LOCAL_MAP = new Map();
LOCAL_DB.forEach(q => LOCAL_MAP.set(q.norm, q));

function normalizeForLookup(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export function localLookup(text, hint) {
  const norm = normalizeForLookup(text);
  const exact = LOCAL_MAP.get(norm);
  if (exact) return { source: exact.s, category: exact.c, confidence: "high", local: true };

  for (const entry of LOCAL_DB) {
    if (norm.includes(entry.norm) && entry.norm.length > 15)
      return { source: entry.s, category: entry.c, confidence: "high", local: true };
    if (entry.norm.includes(norm) && norm.length > 15)
      return { source: entry.s, category: entry.c, confidence: "medium", local: true };
  }

  if (hint) {
    const h = hint.trim();
    const knownAuthors = LOCAL_DB.filter(e => e.s.toLowerCase().includes(h.toLowerCase()));
    if (knownAuthors.length > 0)
      return { source: h, category: knownAuthors[0].c, confidence: "medium", local: true };
    return null;
  }
  return null;
}

export default LOCAL_DB;
