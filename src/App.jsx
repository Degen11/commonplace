import { useState, useRef, useCallback, useEffect } from "react";

// ===================== LOCAL QUOTE DATABASE =====================
const LOCAL_DB = [
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
  {t:"i think therefore i am",s:"René Descartes",c:"Person"},
  {t:"the only thing we have to fear is fear itself",s:"FDR - Inaugural Address (1933)",c:"Speech"},
  {t:"i have a dream",s:"Martin Luther King Jr. - March on Washington (1963)",c:"Speech"},
  {t:"ask not what your country can do for you ask what you can do for your country",s:"John F. Kennedy - Inaugural Address (1961)",c:"Speech"},
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
  {t:"give me liberty or give me death",s:"Patrick Henry - Speech (1775)",c:"Speech"},
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
  {t:"memento mori",s:"Stoic Philosophy",c:"Phrase"},
  {t:"amor fati",s:"Friedrich Nietzsche / Stoic Philosophy",c:"Phrase"},
  {t:"this too shall pass",s:"Persian Proverb",c:"Person"},
  {t:"the best revenge is living well",s:"Often attributed to George Herbert",c:"Person"},
  {t:"we suffer more in imagination than in reality",s:"Seneca",c:"Person"},
  {t:"luck is what happens when preparation meets opportunity",s:"Seneca",c:"Person"},
  {t:"it is not death that a man should fear but he should fear never beginning to live",s:"Marcus Aurelius",c:"Person"},
  {t:"waste no more time arguing about what a good man should be be one",s:"Marcus Aurelius - Meditations",c:"Person"},
  {t:"man is condemned to be free",s:"Jean-Paul Sartre",c:"Person"},
  {t:"one must imagine sisyphus happy",s:"Albert Camus - The Myth of Sisyphus",c:"Person"},
  {t:"in the depth of winter i finally learned that within me there lay an invincible summer",s:"Albert Camus",c:"Person"},
  {t:"is this the real life is this just fantasy",s:"Bohemian Rhapsody - Queen",c:"Music"},
  {t:"imagine all the people living life in peace",s:"Imagine - John Lennon",c:"Music"},
  {t:"we are the champions",s:"We Are the Champions - Queen",c:"Music"},
].map(q => ({ ...q, norm: q.t }));

const LOCAL_MAP = new Map();
LOCAL_DB.forEach(q => LOCAL_MAP.set(q.norm, q));

function normalizeForLookup(s) { return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim(); }

function localLookup(text, hint) {
  const norm = normalizeForLookup(text);
  const exact = LOCAL_MAP.get(norm);
  if (exact) return { source: exact.s, category: exact.c, confidence: "high", local: true };
  for (const entry of LOCAL_DB) {
    if (norm.includes(entry.norm) && entry.norm.length > 15) return { source: entry.s, category: entry.c, confidence: "high", local: true };
    if (entry.norm.includes(norm) && norm.length > 15) return { source: entry.s, category: entry.c, confidence: "medium", local: true };
  }
  if (hint) {
    const h = hint.trim();
    const knownAuthors = LOCAL_DB.filter(e => e.s.toLowerCase().includes(h.toLowerCase()));
    if (knownAuthors.length > 0) return { source: h, category: knownAuthors[0].c, confidence: "medium", local: true };
    return null;
  }
  return null;
}

// ===================== CONSTANTS =====================
const DEFAULT_CATEGORIES = ["Film","TV","Book","Music","Speech","Person","Phrase","Unknown"];
const QUOTED_CATS = new Set(["Film","TV","Book","Music","Speech","Person"]);
const CAT_COLORS = {
  Film:{bg:"#F3E8FF",text:"#7C3AED"},TV:{bg:"#DCFCE7",text:"#16A34A"},Book:{bg:"#FEF3C7",text:"#D97706"},
  Music:{bg:"#FFE4E6",text:"#E11D48"},Speech:{bg:"#DBEAFE",text:"#2563EB"},Person:{bg:"#F0ABFC33",text:"#A21CAF"},
  Phrase:{bg:"#E0F2FE",text:"#0284C7"},Unknown:{bg:"#F1F1EF",text:"#787774"},
};
const CPAL=[{bg:"#D1FAE5",text:"#059669"},{bg:"#FDE68A55",text:"#B45309"},{bg:"#C7D2FE",text:"#4338CA"},{bg:"#FECACA55",text:"#DC2626"},{bg:"#CCFBF1",text:"#0D9488"},{bg:"#FED7AA55",text:"#EA580C"}];
const gc=(c,cust)=>CAT_COLORS[c]||(cust.indexOf(c)>=0?CPAL[cust.indexOf(c)%CPAL.length]:CAT_COLORS.Unknown);
const CONF_ORDER = { low: 0, medium: 1, high: 2 };
const CONF_LABELS = { low: "Low confidence — likely needs manual correction", medium: "Medium confidence — might be inaccurate", high: "High confidence" };
const EXAMPLE_QUOTES = `You can't handle the truth
The world breaks everyone — Hemingway
"Be the change" (Gandhi)
To infinity and beyond
Not all those who wander are lost — Tolkien
I think therefore I am
Get busy living or get busy dying
Is this the real life is this just fantasy
Winter is coming
The only thing we have to fear is fear itself`;

function smartParse(line) {
  let t = line.trim();
  if ((t.startsWith('"')&&t.endsWith('"'))||(t.startsWith('\u201C')&&t.endsWith('\u201D'))||(t.startsWith("'")&&t.endsWith("'")))
    t = t.slice(1,-1).trim();
  const parenMatch = t.match(/^(.+?)\s*\(([^)]{2,50})\)\s*$/);
  if (parenMatch && parenMatch[1].length > parenMatch[2].length)
    return { text: parenMatch[1].replace(/^["'\u201C]+|["'\u201D]+$/g,"").trim(), hint: parenMatch[2].trim() };
  const seps = [/\s*\u2014\s*/,/\s*\u2013\s*/,/\s*--\s*/,/\s+-\s+/,/\s*~\s*/];
  for (const sep of seps) {
    const parts = t.split(sep);
    if (parts.length >= 2) {
      const last = parts[parts.length-1].trim();
      const rest = parts.slice(0,-1).join(" — ").trim();
      if (last.length < 60 && rest.length > last.length)
        return { text: rest.replace(/^["'\u201C]+|["'\u201D]+$/g,"").trim(), hint: last.replace(/^["'\u201C]+|["'\u201D]+$/g,"").trim() };
    }
  }
  return { text: t.replace(/^["'\u201C]+|["'\u201D]+$/g,"").trim(), hint: null };
}

function normalize(s){return s.toLowerCase().replace(/[^a-z0-9\s]/g,"").replace(/\s+/g," ").trim()}
function wordSet(s){return new Set(normalize(s).split(" ").filter(w=>w.length>2))}
function similarity(a,b){
  const na=normalize(a),nb=normalize(b);if(na===nb)return 1;if(na.includes(nb)||nb.includes(na))return .9;
  const wa=wordSet(a),wb=wordSet(b);if(!wa.size||!wb.size)return 0;
  let o=0;wa.forEach(w=>{if(wb.has(w))o++});return(o*2)/(wa.size+wb.size);
}

function download(content,name,type){const b=new Blob([content],{type});const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
function exportCSV(quotes){
  const rows=[["Text","Source","Category","Favorite"]];
  quotes.forEach(q=>rows.push([`"${q.text.replace(/"/g,'""')}"`,`"${q.source.replace(/"/g,'""')}"`,q.category,q.favorite?"yes":"no"]));
  download(rows.map(r=>r.join(",")).join("\n"),"keeper-export.csv","text/csv");
}
function exportMD(quotes){
  const grouped={};quotes.forEach(q=>{(grouped[q.category]=grouped[q.category]||[]).push(q)});
  let md="# Keeper Export\n\n";
  Object.entries(grouped).forEach(([cat,qs])=>{md+=`## ${cat}\n\n`;qs.forEach(q=>{const f=q.favorite?" ⭐":"";QUOTED_CATS.has(q.category)?md+=`> \u201C${q.text}\u201D\n> \u2014 *${q.source}*${f}\n\n`:md+=`- **${q.text}** \u2014 ${q.source}${f}\n`});md+="\n"});
  download(md,"keeper-export.md","text/markdown");
}
function exportJSON(quotes){
  const data = quotes.map(q => ({ text: q.text, source: q.source, category: q.category, confidence: q.confidence, favorite: q.favorite }));
  download(JSON.stringify(data, null, 2), "keeper-export.json", "application/json");
}
function copyToClipboard(quotes){
  const grouped={};quotes.forEach(q=>{(grouped[q.category]=grouped[q.category]||[]).push(q)});
  let text="";
  Object.entries(grouped).forEach(([cat,qs])=>{text+=`${cat}\n${"─".repeat(cat.length)}\n`;qs.forEach(q=>{const f=q.favorite?" ★":"";QUOTED_CATS.has(q.category)?text+=`"${q.text}" — ${q.source}${f}\n`:text+=`${q.text} — ${q.source}${f}\n`});text+="\n"});
  return navigator.clipboard.writeText(text.trim());
}

// Shareable link encoding
function encodeShareData(quotes) {
  const minimal = quotes.map(q => [q.text, q.source, q.category, q.favorite ? 1 : 0]);
  const json = JSON.stringify(minimal);
  return btoa(unescape(encodeURIComponent(json)));
}
function decodeShareData(hash) {
  try {
    const json = decodeURIComponent(escape(atob(hash)));
    const arr = JSON.parse(json);
    return arr.map((q, i) => ({
      id: (Date.now() + i).toString(), text: q[0], source: q[1], category: q[2],
      confidence: "high", favorite: !!q[3],
    }));
  } catch { return null; }
}

// ===================== TOAST COMPONENT =====================
function Toast({ message, action, onAction, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, action ? 5000 : 2500);
    return () => clearTimeout(t);
  }, [onDismiss, action]);
  return (
    <div style={Z.toast}>
      <span>{message}</span>
      {action && <button style={Z.toastAction} onClick={onAction}>{action}</button>}
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export default function Keeper() {
  const [phase, setPhase] = useState("input");
  const [fadeClass, setFadeClass] = useState("phase-in");
  const [rawInput, setRawInput] = useState("");
  const [quotes, setQuotes] = useState([]);
  const [customCats, setCustomCats] = useState([]);
  const [progress, setProgress] = useState(null);
  const [view, setView] = useState(() => window.innerWidth < 640 ? "cards" : "table");
  const [catFilter, setCatFilter] = useState("All");
  const [favFilter, setFavFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editSource, setEditSource] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [bulkEditCat, setBulkEditCat] = useState("");
  const [bulkEditSource, setBulkEditSource] = useState("");
  const [newCatName, setNewCatName] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [stats, setStats] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [showAddMore, setShowAddMore] = useState(false);
  const [addMoreInput, setAddMoreInput] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);
  const [dragId, setDragId] = useState(null);
  const [failedEntries, setFailedEntries] = useState([]);
  const [isSharedView, setIsSharedView] = useState(false);
  const undoRef = useRef(null);
  const addMoreRef = useRef(null);
  const exportRef = useRef(null);
  const sortRef = useRef(null);

  const allCats = [...DEFAULT_CATEGORIES, ...customCats];
  const displayText = q => QUOTED_CATS.has(q.category) ? `\u201C${q.text}\u201D` : q.text;

  // Phase transition with fade
  const goPhase = useCallback((next) => {
    setFadeClass("phase-out");
    setTimeout(() => { setPhase(next); setFadeClass("phase-in"); }, 200);
  }, []);

  // Load shared link on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith("s=")) {
      const decoded = decodeShareData(hash.slice(2));
      if (decoded && decoded.length > 0) {
        setQuotes(decoded);
        setPhase("results");
        setIsSharedView(true);
      }
    }
  }, []);

  // Responsive
  useEffect(() => {
    const h = () => {
      const m = window.innerWidth < 640;
      setIsMobile(m);
      if (m && view === "table") setView("cards");
    };
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [view]);

  useEffect(() => {
    const h = e => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setShowSort(false);
    };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const showToast = (message, action, onAction) => {
    setToast({ message, action, onAction });
  };

  // Batched API call via Haiku
  const identifyBatch = useCallback(async (items) => {
    if (items.length === 0) return [];
    const cl = allCats.filter(c => c !== "Unknown").join("|");
    const quotesBlock = items.map((it, i) => {
      const hintStr = it.hint ? ` (attributed to: ${it.hint})` : "";
      return `[${i}] ${it.text}${hintStr}`;
    }).join("\n");

    try {
      const r = await fetch("/api/identify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 4000,
          system: `You identify quotes and phrases. Given a numbered list, identify each one. Respond ONLY with a JSON array (no markdown, no preamble).
Each element: {"i":index,"source":"Source - Speaker/Author","category":"${cl}|Unknown","confidence":"high|medium|low"}
Film=movies, TV=television, Book=novels/nonfiction/poetry, Music=lyrics, Speech=speeches, Person=real person.
Phrase=expressions, idioms, adverbial phrases not from a specific source.
Unknown if unsure. Be concise with sources. Return one object per input.`,
          messages: [{ role: "user", content: `Identify these:\n${quotesBlock}` }],
        }),
      });
      if (!r.ok) throw new Error(`API returned ${r.status}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error.message || "API error");
      const t = d.content.map(x => x.text || "").join("");
      const parsed = JSON.parse(t.replace(/```json|```/g, "").trim());
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("Batch API error:", err);
      throw err;
    }
  }, [allCats]);

  const processEntries = async (inputText, appendMode = false) => {
    const lines = inputText.trim().split("\n").map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    setIsProcessing(true);
    setFailedEntries([]);
    goPhase("processing");
    setApiError(null);
    const parsed = lines.map(l => smartParse(l));

    const existingTexts = appendMode ? quotes.map(q => normalize(q.text)) : [];
    const unique = [];
    const seen = new Set(existingTexts);
    let dupes = 0;
    parsed.forEach(p => {
      const norm = normalize(p.text);
      const isDupe = [...seen].some(s => similarity(s, norm) > 0.55);
      if (!isDupe) { unique.push(p); seen.add(norm); } else dupes++;
    });

    const localMatches = [];
    const needsApi = [];
    unique.forEach((p, i) => {
      const match = localLookup(p.text, p.hint);
      if (match) localMatches.push({ ...p, idx: i, result: match });
      else needsApi.push({ ...p, idx: i });
    });

    setProgress({ total: unique.length, done: localMatches.length, current: `${localMatches.length} identified locally, ${needsApi.length} need AI...`, phase: "local" });

    const apiResults = new Map();
    let apiFailed = false;
    const failed = [];
    const BATCH_SIZE = 20;

    if (needsApi.length > 0) {
      for (let i = 0; i < needsApi.length; i += BATCH_SIZE) {
        const chunk = needsApi.slice(i, i + BATCH_SIZE);
        setProgress({
          total: unique.length, done: localMatches.length + i,
          current: `AI identifying batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needsApi.length / BATCH_SIZE)}...`,
          phase: "api"
        });
        try {
          const results = await identifyBatch(chunk);
          results.forEach(r => { const item = chunk[r.i]; if (item) apiResults.set(item.idx, r); });
        } catch (err) {
          apiFailed = true;
          chunk.forEach(c => failed.push(c));
          setApiError(`AI identification failed for ${needsApi.length - i} entries. You can edit them manually or retry.`);
          break;
        }
      }
    }

    if (failed.length > 0) setFailedEntries(failed);

    const newQuotes = unique.map((p, i) => {
      const local = localMatches.find(m => m.idx === i);
      if (local) return { id: (Date.now() + i).toString(), text: p.text, source: local.result.source, category: local.result.category, confidence: local.result.confidence, favorite: false };
      const api = apiResults.get(i);
      if (api) return { id: (Date.now() + i).toString(), text: p.text, source: api.source || p.hint || "Unknown", category: allCats.includes(api.category) ? api.category : "Unknown", confidence: api.confidence || "low", favorite: false };
      return { id: (Date.now() + i).toString(), text: p.text, source: p.hint || "Unknown", category: "Unknown", confidence: "low", favorite: false };
    });

    if (appendMode) setQuotes(prev => [...prev, ...newQuotes]);
    else setQuotes(newQuotes);

    setStats({ local: localMatches.length, api: apiResults.size, failed: apiFailed ? needsApi.length - apiResults.size : 0, total: unique.length, dupes });
    setProgress(null);
    setIsProcessing(false);
    goPhase("results");
  };

  const retryFailed = async () => {
    if (failedEntries.length === 0) return;
    setApiError(null);
    const text = failedEntries.map(e => {
      const hintStr = e.hint ? ` — ${e.hint}` : "";
      return `${e.text}${hintStr}`;
    }).join("\n");
    setFailedEntries([]);
    await processEntries(text, true);
  };

  const handleProcess = () => processEntries(rawInput, false);
  const handleAddMore = () => {
    if (!addMoreInput.trim()) return;
    processEntries(addMoreInput, true);
    setAddMoreInput(""); setShowAddMore(false);
  };

  const handleClear = () => {
    window.history.replaceState(null, "", window.location.pathname);
    setIsSharedView(false);
    goPhase("input"); setQuotes([]); setRawInput(""); setSelected(new Set());
    setCatFilter("All"); setFavFilter(false); setSearch(""); setStats(null); setApiError(null);
    setConfirmClear(false); setShowAddMore(false); setSortBy("default"); setFailedEntries([]);
  };

  const handleDelete = (id) => {
    const deleted = quotes.find(q => q.id === id);
    const idx = quotes.findIndex(q => q.id === id);
    setQuotes(p => p.filter(q => q.id !== id));
    undoRef.current = { quote: deleted, index: idx };
    showToast("Entry deleted", "Undo", () => {
      if (undoRef.current) {
        const { quote, index } = undoRef.current;
        setQuotes(p => { const n = [...p]; n.splice(Math.min(index, n.length), 0, quote); return n; });
        undoRef.current = null;
      }
    });
  };

  const handleShare = () => {
    const encoded = encodeShareData(quotes);
    const url = `${window.location.origin}${window.location.pathname}#s=${encoded}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Shareable link copied to clipboard!");
    });
  };

  const toggleSel = id => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const startEdit = q => { setEditingId(q.id); setEditText(q.text); setEditSource(q.source); setEditCategory(q.category); };
  const saveEdit = id => { setQuotes(p => p.map(q => q.id === id ? { ...q, text: editText, source: editSource, category: editCategory } : q)); setEditingId(null); };
  const applyBulk = () => { setQuotes(p => p.map(q => { if (!selected.has(q.id)) return q; const u = { ...q }; if (bulkEditCat) u.category = bulkEditCat; if (bulkEditSource.trim()) u.source = bulkEditSource.trim(); return u; })); setSelected(new Set()); setBulkEditCat(""); setBulkEditSource(""); };
  const bulkDel = () => { setQuotes(p => p.filter(q => !selected.has(q.id))); setSelected(new Set()); };
  const addCat = () => { const n = newCatName.trim(); if (!n || allCats.includes(n)) return; setCustomCats(p => [...p, n]); setNewCatName(""); setShowNewCat(false); };
  const remCat = c => { setCustomCats(p => p.filter(x => x !== c)); setQuotes(p => p.map(q => q.category === c ? { ...q, category: "Unknown" } : q)); if (catFilter === c) setCatFilter("All"); };

  // Drag reorder
  const handleDragStart = (id) => setDragId(id);
  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) return;
    setQuotes(prev => {
      const arr = [...prev];
      const fromIdx = arr.findIndex(q => q.id === dragId);
      const toIdx = arr.findIndex(q => q.id === targetId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = arr.splice(fromIdx, 1);
      arr.splice(toIdx, 0, moved);
      return arr;
    });
  };
  const handleDragEnd = () => setDragId(null);

  let filtered = quotes.filter(q => {
    if (catFilter !== "All" && q.category !== catFilter) return false;
    if (favFilter && !q.favorite) return false;
    if (search && !q.text.toLowerCase().includes(search.toLowerCase()) && !q.source.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (sortBy === "confidence") filtered = [...filtered].sort((a, b) => (CONF_ORDER[a.confidence] || 0) - (CONF_ORDER[b.confidence] || 0));
  else if (sortBy === "alpha") filtered = [...filtered].sort((a, b) => a.text.localeCompare(b.text));
  else if (sortBy === "category") filtered = [...filtered].sort((a, b) => a.category.localeCompare(b.category));

  const cc = {}; quotes.forEach(q => { cc[q.category] = (cc[q.category] || 0) + 1; });
  const favCount = quotes.filter(q => q.favorite).length;
  const selAll = () => { const ids = filtered.map(q => q.id); ids.every(id => selected.has(id)) ? setSelected(new Set()) : setSelected(new Set(ids)); };
  const showBulkBar = selected.size > 0;
  const unknownCount = quotes.filter(q => q.confidence === "low" || q.category === "Unknown").length;

  const SORT_OPTIONS = [
    { key: "default", label: "Default order" },
    { key: "confidence", label: `Needs attention first${unknownCount > 0 ? ` (${unknownCount})` : ""}` },
    { key: "alpha", label: "Alphabetical" },
    { key: "category", label: "By category" },
  ];

  const FavBtn = ({ q }) => <button style={{ ...Z.actBtn, color: q.favorite ? "#F59E0B" : "#9B9A97" }} onClick={() => setQuotes(p => p.map(x => x.id === q.id ? { ...x, favorite: !x.favorite } : x))}>{q.favorite ? "★" : "☆"}</button>;
  const EditBtn = ({ q }) => <button style={Z.actBtn} onClick={() => startEdit(q)}>✎</button>;
  const DelBtn = ({ q }) => <button style={{ ...Z.actBtn, color: "#EB5757" }} onClick={() => handleDelete(q.id)}>✕</button>;

  const ConfDot = ({ q }) => {
    if (!q.confidence || q.confidence === "high") return null;
    return <span title={CONF_LABELS[q.confidence]} style={{ ...Z.confDot, background: q.confidence === "medium" ? "#FFB74D" : "#D6D6D4", cursor: "help" }} />;
  };

  const EditForm = ({ q, inCard }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: inCard ? 8 : 0 }} onClick={e => e.stopPropagation()}>
      <textarea style={{ ...Z.textarea, minHeight: 40, fontSize: 13, padding: 8 }} value={editText} onChange={e => setEditText(e.target.value)} />
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        <input style={Z.editIn} value={editSource} onChange={e => setEditSource(e.target.value)} placeholder="Source..." />
        <select style={Z.editSel} value={editCategory} onChange={e => setEditCategory(e.target.value)}>{allCats.map(c => <option key={c} value={c}>{c}</option>)}</select>
        <button style={Z.editSave} onClick={() => saveEdit(q.id)}>Save</button>
        <button style={Z.editCancel} onClick={() => setEditingId(null)}>Cancel</button>
      </div>
    </div>
  );

  const Footer = () => (
    <footer style={Z.footer}>
      <span>Built by <a href="https://github.com/Degen11" target="_blank" rel="noopener noreferrer" style={Z.footerLink}>Degen Hill</a></span>
    </footer>
  );

  // Category summary for header
  const topCats = Object.entries(cc).filter(([c]) => c !== "Unknown").sort((a, b) => b[1] - a[1]).slice(0, 4);

  // ============ INPUT ============
  if (phase === "input") return (
    <div style={Z.wrap} className={fadeClass}><style>{baseCSS}</style>
      <div style={Z.landing}>
        <div style={Z.hero}>
          <h1 style={Z.heroTitle}>Keeper</h1>
          <p style={Z.heroSub}>Paste your messy quotes, phrases, and fragments.<br />We'll organize everything and identify the sources.</p>
        </div>
        <div style={Z.inputCard}>
          <textarea style={Z.bigTextarea} value={rawInput} onChange={e => setRawInput(e.target.value)}
            placeholder={"Paste everything here — one per line, messy is fine:\n\nYou can't handle the truth\nThe world breaks everyone — Hemingway\n\"Be the change\" (Gandhi)\nTo infinity and beyond\nNot all those who wander are lost — Tolkien"} rows={12} />
          <div style={Z.inputFooter}>
            <span style={Z.inputCount}>{rawInput.trim() ? `${rawInput.trim().split("\n").filter(l => l.trim()).length} entries detected` : "Quotes, phrases, expressions — all welcome"}</span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!rawInput.trim() && <button className="try-btn" style={Z.tryBtn} onClick={() => setRawInput(EXAMPLE_QUOTES)}>Try it with examples</button>}
              <button className="proc-btn" style={{ ...Z.processBtn, opacity: (!rawInput.trim() || isProcessing) ? 0.4 : 1 }}
                onClick={handleProcess} disabled={!rawInput.trim() || isProcessing}>
                {isProcessing ? "Processing..." : "Organize my collection →"}
              </button>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div style={Z.howWrap}>
          <div className="how-step" style={Z.howStep}>
            <div style={Z.howIcon}>📋</div>
            <div style={Z.howLabel}>Paste</div>
            <div style={Z.howDesc}>Dump your messy quotes, one per line</div>
          </div>
          <div style={Z.howArrow}>→</div>
          <div className="how-step" style={Z.howStep}>
            <div style={Z.howIcon}>🤖</div>
            <div style={Z.howLabel}>Identify</div>
            <div style={Z.howDesc}>AI matches sources and categories</div>
          </div>
          <div style={Z.howArrow}>→</div>
          <div className="how-step" style={Z.howStep}>
            <div style={Z.howIcon}>✨</div>
            <div style={Z.howLabel}>Organized</div>
            <div style={Z.howDesc}>Export clean, attributed collections</div>
          </div>
        </div>

        {/* Before / After preview */}
        <div style={Z.previewWrap}>
          <div style={Z.previewBox}>
            <div style={Z.previewLabel}>What you paste</div>
            <div style={Z.previewContent}>
              <p style={Z.previewLine}>you miss 100% of the shots you don't take</p>
              <p style={Z.previewLine}>all those moments will be lost in time</p>
              <p style={Z.previewLine}>the unexamined life is not worth living</p>
              <p style={Z.previewLine}>"Be the change" (Gandhi)</p>
              <p style={Z.previewLine}>is this the real life is this just fantasy</p>
            </div>
          </div>
          <div style={Z.previewArrow}>→</div>
          <div style={Z.previewBox}>
            <div style={Z.previewLabel}>What you get</div>
            <div style={Z.previewContent}>
              <div style={Z.previewResult}><span style={{ ...Z.previewTag, background: "#F0ABFC33", color: "#A21CAF" }}>Person</span><span style={Z.previewText}>"You miss 100% of the shots you don't take"</span><span style={Z.previewSrc}>Wayne Gretzky</span></div>
              <div style={Z.previewResult}><span style={{ ...Z.previewTag, background: "#F3E8FF", color: "#7C3AED" }}>Film</span><span style={Z.previewText}>"All those moments will be lost in time"</span><span style={Z.previewSrc}>Blade Runner (1982)</span></div>
              <div style={Z.previewResult}><span style={{ ...Z.previewTag, background: "#F0ABFC33", color: "#A21CAF" }}>Person</span><span style={Z.previewText}>"The unexamined life is not worth living"</span><span style={Z.previewSrc}>Socrates</span></div>
              <div style={Z.previewResult}><span style={{ ...Z.previewTag, background: "#F0ABFC33", color: "#A21CAF" }}>Person</span><span style={Z.previewText}>"Be the change"</span><span style={Z.previewSrc}>Mahatma Gandhi</span></div>
              <div style={Z.previewResult}><span style={{ ...Z.previewTag, background: "#FFE4E6", color: "#E11D48" }}>Music</span><span style={Z.previewText}>"Is this the real life, is this just fantasy"</span><span style={Z.previewSrc}>Bohemian Rhapsody — Queen</span></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );

  // ============ PROCESSING ============
  if (phase === "processing") return (
    <div style={Z.wrap} className={fadeClass}><style>{baseCSS}</style>
      <div style={Z.procWrap}>
        <h2 style={Z.procTitle}>Organizing your collection...</h2>
        <p style={Z.procSub}>{progress?.phase === "local" ? "Checking local database..." : "AI is identifying remaining entries..."}</p>
        {progress && (
          <div style={Z.procCard}>
            <div style={Z.procTop}><span style={{ fontWeight: 600 }}>{progress.done} of {progress.total}</span><span style={{ color: "#9B9A97" }}>{Math.round((progress.done / progress.total) * 100)}%</span></div>
            <div style={Z.track}><div style={{ ...Z.fill, width: `${(progress.done / progress.total) * 100}%` }} /></div>
            <p style={Z.procCurrent}>{progress.current}</p>
          </div>
        )}
      </div>
    </div>
  );

  // ============ RESULTS ============
  return (
    <div style={Z.wrap} className={fadeClass}><style>{baseCSS}</style>

      {/* Toast */}
      {toast && <Toast message={toast.message} action={toast.action} onAction={() => { if (toast.onAction) toast.onAction(); setToast(null); }} onDismiss={() => setToast(null)} />}

      {/* Confirm clear modal */}
      {confirmClear && (
        <div style={Z.modalOverlay} onClick={() => setConfirmClear(false)}>
          <div style={Z.confirmBox} onClick={e => e.stopPropagation()}>
            <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Start fresh?</p>
            <p style={{ fontSize: 13, color: "#9B9A97", marginBottom: 16 }}>This will clear all {quotes.length} organized entries. Make sure you've exported anything you want to keep.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={Z.confirmCancel} onClick={() => setConfirmClear(false)}>Cancel</button>
              <button style={Z.confirmYes} onClick={handleClear}>Clear everything</button>
            </div>
          </div>
        </div>
      )}

      {/* Shared view banner */}
      {isSharedView && (
        <div style={Z.shareBanner}>
          <span>👀 You're viewing a shared collection ({quotes.length} entries)</span>
          <button style={Z.shareBannerBtn} onClick={() => { setIsSharedView(false); window.history.replaceState(null, "", window.location.pathname); }}>Make it yours</button>
        </div>
      )}

      {/* Header */}
      <div style={Z.header}>
        <div>
          <h1 style={Z.title}>Keeper</h1>
          <p style={Z.sub}>
            {quotes.length} {quotes.length === 1 ? "entry" : "entries"} organized
            {topCats.length > 0 && <span style={{ color: "#D3D3D0" }}> · </span>}
            {topCats.map(([c, n], i) => <span key={c} style={{ color: gc(c, customCats).text }}>{i > 0 && <span style={{ color: "#D3D3D0" }}>, </span>}{n} {c}</span>)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          {!isMobile && (
            <div style={Z.viewTog}>
              <button style={{ ...Z.viewBtn, ...(view === "table" ? Z.viewOn : {}) }} onClick={() => setView("table")} title="Table">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="2.5" rx=".5" fill="currentColor" opacity=".8"/><rect x="1" y="6.5" width="14" height="2.5" rx=".5" fill="currentColor" opacity=".5"/><rect x="1" y="11" width="14" height="2.5" rx=".5" fill="currentColor" opacity=".3"/></svg>
              </button>
              <button style={{ ...Z.viewBtn, ...(view === "cards" ? Z.viewOn : {}) }} onClick={() => setView("cards")} title="Cards">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7"/><rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity=".5"/><rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4"/><rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity=".3"/></svg>
              </button>
            </div>
          )}
          <div ref={exportRef} style={{ position: "relative" }}>
            <button style={Z.exportBtn} onClick={() => setShowExport(!showExport)}>Export ↓</button>
            {showExport && (
              <div style={Z.expDrop}>
                <button className="dd-opt" style={Z.expOpt} onClick={() => { copyToClipboard(quotes).then(() => showToast("Copied to clipboard!")); setShowExport(false); }}>📋 Copy to clipboard</button>
                <button className="dd-opt" style={Z.expOpt} onClick={() => { handleShare(); setShowExport(false); }}>🔗 Shareable link</button>
                <div style={{ height: 1, background: "#F1F1EF", margin: "2px 0" }} />
                <button className="dd-opt" style={Z.expOpt} onClick={() => { exportCSV(quotes); setShowExport(false); }}>📄 CSV</button>
                <button className="dd-opt" style={Z.expOpt} onClick={() => { exportMD(quotes); setShowExport(false); }}>📝 Markdown</button>
                <button className="dd-opt" style={Z.expOpt} onClick={() => { exportJSON(quotes); setShowExport(false); }}>{"{ }"} JSON</button>
              </div>
            )}
          </div>
          {!isMobile && quotes.length > 0 && <button style={Z.hdrBtn} onClick={selAll}>{selected.size === filtered.length && filtered.length > 0 ? "Deselect" : "Select all"}</button>}
          <button style={Z.addMoreBtn} onClick={() => { setShowAddMore(!showAddMore); setTimeout(() => addMoreRef.current?.focus(), 100); }}>＋ Add more</button>
          <button style={Z.startOverBtn} onClick={() => setConfirmClear(true)}>New batch</button>
        </div>
      </div>

      {/* API error + retry */}
      {apiError && (
        <div style={Z.errorBar}>
          <span>⚠️ {apiError}</span>
          <div style={{ display: "flex", gap: 8 }}>
            {failedEntries.length > 0 && <button style={Z.retryBtn} onClick={retryFailed}>Retry failed ({failedEntries.length})</button>}
            <button style={{ background: "none", border: "none", color: "#991B1B", cursor: "pointer", fontSize: 12, textDecoration: "underline" }} onClick={() => setApiError(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Stats bar */}
      {stats && (
        <div style={Z.statsBar}>
          <span>⚡ <strong>{stats.local}</strong> matched locally</span>
          <span style={Z.statDot} />
          <span>🤖 <strong>{stats.api}</strong> identified by AI</span>
          {stats.failed > 0 && <><span style={Z.statDot} /><span style={{ color: "#DC2626" }}>❌ <strong>{stats.failed}</strong> failed</span></>}
          {stats.dupes > 0 && <><span style={Z.statDot} /><span>🔁 <strong>{stats.dupes}</strong> duplicate{stats.dupes > 1 ? "s" : ""} removed</span></>}
          <button style={Z.statsDismiss} onClick={() => setStats(null)}>✕</button>
        </div>
      )}

      {/* Add more panel */}
      {showAddMore && (
        <div style={Z.addMorePanel}>
          <textarea ref={addMoreRef} style={{ ...Z.textarea, minHeight: 80 }} value={addMoreInput} onChange={e => setAddMoreInput(e.target.value)}
            placeholder="Paste additional quotes, one per line. Duplicates of existing entries will be skipped." />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "#9B9A97" }}>{addMoreInput.trim() ? `${addMoreInput.trim().split("\n").filter(l => l.trim()).length} entries` : "These will be added to your existing collection"}</span>
            <div style={{ display: "flex", gap: 6 }}>
              <button style={Z.editCancel} onClick={() => { setShowAddMore(false); setAddMoreInput(""); }}>Cancel</button>
              <button style={{ ...Z.editSave, opacity: !addMoreInput.trim() ? .4 : 1 }} onClick={handleAddMore} disabled={!addMoreInput.trim()}>Add & identify</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk edit */}
      {showBulkBar && (
        <div style={Z.bulkBar}>
          <span style={Z.bulkN}>{selected.size} selected</span>
          <div style={Z.bulkF}>
            <select style={Z.bulkSel} value={bulkEditCat} onChange={e => setBulkEditCat(e.target.value)}><option value="">Category...</option>{allCats.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <input style={Z.bulkIn} placeholder="Source..." value={bulkEditSource} onChange={e => setBulkEditSource(e.target.value)} />
            <button style={{ ...Z.bulkApply, opacity: (!bulkEditCat && !bulkEditSource.trim()) ? .4 : 1 }} onClick={applyBulk} disabled={!bulkEditCat && !bulkEditSource.trim()}>Apply</button>
            <button style={Z.bulkDelBtn} onClick={bulkDel}>Delete</button>
            <button style={Z.bulkX} onClick={() => setSelected(new Set())}>✕</button>
          </div>
        </div>
      )}

      {/* Search + sort */}
      <div style={Z.toolbar}>
        <div style={Z.srchW}><span style={Z.srchI}>🔍</span>
          <input style={Z.srchIn} placeholder="Search quotes or sources..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button style={Z.clrBtn} onClick={() => setSearch("")}>✕</button>}
        </div>
        <div ref={sortRef} style={{ position: "relative" }}>
          <button style={{ ...Z.sortBtn, ...(sortBy !== "default" ? { borderColor: "#2383E2", color: "#2383E2" } : {}) }} onClick={() => setShowSort(!showSort)}>
            Sort{sortBy !== "default" ? " ✓" : ""}<span style={{ fontSize: 10, marginLeft: 4, opacity: .4 }}>▾</span>
          </button>
          {showSort && (
            <div style={Z.sortDrop}>
              {SORT_OPTIONS.map(o => (
                <button key={o.key} className="dd-opt" style={{ ...Z.sortOpt, ...(sortBy === o.key ? Z.sortOptOn : {}) }}
                  onClick={() => { setSortBy(o.key); setShowSort(false); }}>{o.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Category pills + fav filter */}
      <div style={Z.cats}>
        <button onClick={() => setCatFilter("All")} style={{ ...Z.catPill, ...(catFilter === "All" && !favFilter ? Z.catOn : {}) }}>All</button>
        {favCount > 0 && (
          <button onClick={() => setFavFilter(!favFilter)} style={{ ...Z.catPill, ...(favFilter ? { background: "#FEF3C7", color: "#D97706", borderColor: "#FDE68A" } : {}) }}>
            ★ Favorites<span style={{ opacity: .5, fontSize: 11 }}>{favCount}</span>
          </button>
        )}
        {allCats.filter(c => cc[c]).map(c => {
          const col = gc(c, customCats); const on = catFilter === c;
          return <button key={c} onClick={() => { setCatFilter(c); setFavFilter(false); }} style={{ ...Z.catPill, ...(on ? { background: col.bg, color: col.text, borderColor: col.bg } : {}) }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: col.text, opacity: .6, flexShrink: 0 }} />{c}<span style={{ opacity: .5, fontSize: 11 }}>{cc[c]}</span>
            {customCats.includes(c) && <span style={{ opacity: .4, fontSize: 10, cursor: "pointer" }} onClick={e => { e.stopPropagation(); remCat(c); }}>✕</span>}
          </button>;
        })}
        {showNewCat ? (
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input style={Z.newCatIn} value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Name" autoFocus onKeyDown={e => { if (e.key === "Enter") addCat(); if (e.key === "Escape") { setShowNewCat(false); setNewCatName(""); } }} />
            <button style={Z.newCatSv} onClick={addCat}>Add</button>
          </div>
        ) : <button style={Z.addCatBtn} onClick={() => setShowNewCat(true)}>+</button>}
      </div>

      {/* Needs attention hint */}
      {unknownCount > 0 && sortBy !== "confidence" && (
        <div style={Z.hintBar}>
          <span>{unknownCount} {unknownCount === 1 ? "entry needs" : "entries need"} attention</span>
          <button style={Z.hintBtn} onClick={() => setSortBy("confidence")}>Sort to top ↑</button>
        </div>
      )}

      {/* TABLE */}
      {view === "table" && (
        <div style={{ overflowX: "auto" }}>
          {filtered.length > 0 && <div style={Z.tHead}><div style={{ width: 32 }} /><div style={{ flex: 1, minWidth: 200 }}>Content</div><div style={{ width: 200 }}>Source</div><div style={{ width: 80 }}>Category</div><div style={{ width: 56 }} /></div>}
          {filtered.map(q => {
            const col = gc(q.category, customCats), isSel = selected.has(q.id), isEd = editingId === q.id;
            const needsAtt = q.confidence === "low" || q.category === "Unknown";
            const isDragging = dragId === q.id;
            return (
              <div key={q.id} className="qrow" draggable={!isEd} onDragStart={() => handleDragStart(q.id)} onDragOver={e => handleDragOver(e, q.id)} onDragEnd={handleDragEnd}
                style={{ ...Z.row, ...(isSel ? { background: "#F0F7FF" } : {}), ...(q.favorite ? Z.favRow : {}), ...(needsAtt && sortBy === "confidence" ? { background: "#FFFBEB" } : {}), ...(isDragging ? { opacity: .4 } : {}), animation: "fadeUp .25s ease" }}>
                <div className="checkbox" style={{ ...Z.chkW, ...(isSel ? { opacity: 1 } : {}) }}>
                  <div style={{ ...Z.check, ...(isSel ? Z.checkOn : {}) }} onClick={() => toggleSel(q.id)}>{isSel && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}</div>
                </div>
                <div style={{ flex: 1, minWidth: 200, paddingRight: 12, cursor: isEd ? "default" : "text" }}
                  onClick={() => { if (!isEd) startEdit(q); }}>
                  {isEd ? <EditForm q={q} /> : <p style={Z.entryText}>{displayText(q)}</p>}
                </div>
                <div className="src-col" style={Z.srcCol}><span style={Z.srcText} title={q.source}>{q.source}</span><ConfDot q={q} /></div>
                <div style={{ width: 80 }}><span style={{ ...Z.tag, background: col.bg, color: col.text }}>{q.category}</span></div>
                <div className="row-actions" style={Z.rowAct}><FavBtn q={q} /><EditBtn q={q} /><DelBtn q={q} /></div>
              </div>
            );
          })}
        </div>
      )}

      {/* CARDS */}
      {view === "cards" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill,minmax(280px,1fr))", gap: 12, paddingTop: 8 }}>
          {filtered.map(q => {
            const col = gc(q.category, customCats), isSel = selected.has(q.id), isEd = editingId === q.id;
            const needsAtt = q.confidence === "low" || q.category === "Unknown";
            return (
              <div key={q.id} draggable={!isEd} onDragStart={() => handleDragStart(q.id)} onDragOver={e => handleDragOver(e, q.id)} onDragEnd={handleDragEnd}
                style={{ ...CZ.card, ...(isSel ? { outline: "2px solid #2383E2", outlineOffset: -2 } : {}), ...(q.favorite ? CZ.favCard : {}), ...(needsAtt && sortBy === "confidence" ? { background: "#FFFBEB" } : {}), ...(dragId === q.id ? { opacity: .4 } : {}), animation: "fadeUp .3s ease" }}
                onMouseEnter={e => { const a = e.currentTarget.querySelector('.ca'); if (a) a.style.opacity = 1; }}
                onMouseLeave={e => { const a = e.currentTarget.querySelector('.ca'); if (a) a.style.opacity = 0; }}>
                <div style={CZ.top}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ ...Z.check, ...(isSel ? Z.checkOn : {}), width: 15, height: 15, borderRadius: 3 }} onClick={() => toggleSel(q.id)}>{isSel && <span style={{ fontSize: 10, color: "#fff" }}>✓</span>}</div>
                    <span style={{ ...Z.tag, background: col.bg, color: col.text }}>{q.category}</span>
                  </div>
                  <div className="ca" style={{ ...CZ.acts, ...(isMobile ? { opacity: 1 } : {}) }}><FavBtn q={q} /><EditBtn q={q} /><DelBtn q={q} /></div>
                </div>
                {isEd ? <EditForm q={q} inCard /> : (
                  <>
                    <p style={CZ.txt}>{displayText(q)}</p>
                    <div style={CZ.srcRow}><span style={{ color: "#D3D3D0" }}>—</span><span style={CZ.src}>{q.source}</span><ConfDot q={q} /></div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={Z.empty}>
          <p style={{ fontSize: 14, color: "#9B9A97", marginBottom: 8 }}>No entries match your current filters.</p>
          <button style={{ background: "none", border: "none", color: "#2383E2", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}
            onClick={() => { setCatFilter("All"); setFavFilter(false); setSearch(""); setSortBy("default"); }}>Clear all filters</button>
        </div>
      )}

      <Footer />
    </div>
  );
}

// ===================== STYLES =====================
const baseCSS = `
  *{box-sizing:border-box;margin:0;padding:0}body{background:#fff;color:#37352F}::selection{background:#2383E233}
  textarea:focus,input:focus,select:focus{outline:none}
  @keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  @keyframes slideD{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes toastIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  .phase-in{animation:fadeUp .3s ease}.phase-out{opacity:0;transition:opacity .2s ease}
  .qrow{cursor:grab}.qrow:active{cursor:grabbing}
  .qrow:hover{background:#FAFAFA !important}.qrow:hover .row-actions{opacity:1 !important}.qrow:hover .checkbox{opacity:1 !important}
  .qrow:hover .src-col span:first-child{white-space:normal !important;overflow:visible !important}
  .dd-opt:hover{background:#F1F1EF !important}
  .proc-btn:hover:not(:disabled){box-shadow:0 2px 8px rgba(55,53,47,.25);transform:translateY(-1px)}
  .proc-btn{transition:all .15s ease}
  .try-btn:hover{background:#F1F1EF !important}
  .how-step{transition:transform .2s ease}.how-step:hover{transform:translateY(-2px)}
`;

const Z = {
  wrap:{maxWidth:1120,margin:"0 auto",padding:"0 32px 80px",fontFamily:"'Inter',-apple-system,sans-serif",fontSize:14,color:"#37352F",minHeight:"100vh",background:"#fff"},
  landing:{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:80},
  hero:{textAlign:"center",marginBottom:40},
  heroTitle:{fontSize:48,fontWeight:700,letterSpacing:-2,color:"#37352F",lineHeight:1},
  heroSub:{fontSize:16,color:"#9B9A97",marginTop:12,lineHeight:1.7},
  inputCard:{width:"100%",maxWidth:800,background:"#FAFAFA",border:"1px solid #F1F1EF",borderRadius:12,padding:20,animation:"fadeUp .4s ease"},
  bigTextarea:{width:"100%",border:"1px solid #E3E2DE",borderRadius:8,padding:16,fontSize:15,fontFamily:"inherit",color:"#37352F",resize:"vertical",minHeight:240,lineHeight:1.7,background:"#fff"},
  inputFooter:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,flexWrap:"wrap",gap:10},
  inputCount:{fontSize:13,color:"#9B9A97"},
  processBtn:{padding:"10px 24px",border:"none",borderRadius:8,background:"#37352F",color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
  tryBtn:{padding:"8px 16px",border:"1px solid #E3E2DE",borderRadius:8,background:"#fff",color:"#9B9A97",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"background .15s"},
  howWrap:{display:"flex",gap:24,marginTop:48,flexWrap:"wrap",justifyContent:"center",alignItems:"flex-start",width:"100%",maxWidth:600},
  howStep:{display:"flex",flexDirection:"column",alignItems:"center",gap:6,flex:1,minWidth:120,textAlign:"center"},
  howIcon:{fontSize:28,marginBottom:4},
  howLabel:{fontSize:14,fontWeight:600,color:"#37352F"},
  howDesc:{fontSize:12,color:"#9B9A97",lineHeight:1.4},
  howArrow:{display:"flex",alignItems:"center",fontSize:20,color:"#D3D3D0",fontWeight:300,paddingTop:16},
  procWrap:{display:"flex",flexDirection:"column",alignItems:"center",paddingTop:120},
  procTitle:{fontSize:24,fontWeight:700,letterSpacing:-.5,marginBottom:8},
  procSub:{fontSize:14,color:"#9B9A97",marginBottom:32},
  procCard:{width:"100%",maxWidth:480,padding:20,background:"#FAFAFA",border:"1px solid #F1F1EF",borderRadius:12},
  procTop:{display:"flex",justifyContent:"space-between",fontSize:14,marginBottom:10},
  track:{height:4,borderRadius:2,background:"#EBEBEA",overflow:"hidden"},
  fill:{height:"100%",borderRadius:2,background:"#37352F",transition:"width .3s"},
  procCurrent:{fontSize:13,color:"#9B9A97",marginTop:8,fontStyle:"italic",animation:"pulse 1.5s infinite"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"flex-end",padding:"40px 0 16px",borderBottom:"1px solid #F1F1EF",flexWrap:"wrap",gap:12},
  title:{fontSize:32,fontWeight:700,letterSpacing:-1,color:"#37352F",lineHeight:1},
  sub:{fontSize:13,color:"#9B9A97",marginTop:6},
  hdrBtn:{padding:"6px 12px",border:"1px solid #E3E2DE",borderRadius:6,background:"#fff",fontSize:12,color:"#37352F",cursor:"pointer",fontFamily:"inherit",fontWeight:500},
  exportBtn:{padding:"6px 14px",border:"1px solid #E3E2DE",borderRadius:6,background:"#fff",fontSize:12,fontWeight:600,color:"#37352F",cursor:"pointer",fontFamily:"inherit"},
  addMoreBtn:{padding:"6px 14px",border:"1px solid #2383E2",borderRadius:6,background:"#EFF6FF",color:"#2383E2",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  startOverBtn:{padding:"6px 14px",border:"1px solid #E3E2DE",borderRadius:6,background:"#fff",color:"#37352F",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  viewTog:{display:"flex",border:"1px solid #E3E2DE",borderRadius:6,overflow:"hidden"},
  viewBtn:{padding:"5px 8px",border:"none",background:"#fff",cursor:"pointer",color:"#9B9A97",display:"flex",alignItems:"center",justifyContent:"center"},
  viewOn:{background:"#F1F1EF",color:"#37352F"},
  expDrop:{position:"absolute",right:0,top:"calc(100% + 4px)",background:"#fff",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.1)",border:"1px solid #E3E2DE",minWidth:180,zIndex:100,padding:4,animation:"slideD .15s ease"},
  expOpt:{display:"block",width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"8px 12px",fontSize:13,color:"#37352F",cursor:"pointer",borderRadius:4,fontFamily:"inherit"},
  errorBar:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,margin:"12px 0",fontSize:13,color:"#991B1B",animation:"slideD .2s ease",gap:12,flexWrap:"wrap"},
  retryBtn:{padding:"4px 12px",borderRadius:6,border:"1px solid #DC2626",background:"#fff",color:"#DC2626",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  statsBar:{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#F0FDF4",border:"1px solid #DCFCE7",borderRadius:8,margin:"12px 0",fontSize:13,color:"#37352F",flexWrap:"wrap",animation:"slideD .2s ease"},
  statDot:{width:3,height:3,borderRadius:"50%",background:"#D3D3D0"},
  statsDismiss:{background:"none",border:"none",color:"#9B9A97",cursor:"pointer",fontSize:14,marginLeft:"auto"},
  addMorePanel:{background:"#FAFAFA",border:"1px solid #F1F1EF",borderRadius:8,padding:14,margin:"12px 0",animation:"slideD .2s ease"},
  hintBar:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 12px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:6,margin:"8px 0",fontSize:12,color:"#92400E"},
  hintBtn:{background:"none",border:"none",color:"#D97706",cursor:"pointer",fontSize:12,fontWeight:600,fontFamily:"inherit",textDecoration:"underline"},
  bulkBar:{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#F0F7FF",borderRadius:8,margin:"12px 0",flexWrap:"wrap",animation:"slideD .2s ease"},
  bulkN:{fontSize:13,fontWeight:600,color:"#2383E2",whiteSpace:"nowrap"},
  bulkF:{display:"flex",gap:6,alignItems:"center",flex:1,flexWrap:"wrap"},
  bulkSel:{border:"1px solid #D3D3D0",borderRadius:6,padding:"5px 8px",fontSize:12,fontFamily:"inherit",background:"#fff"},
  bulkIn:{border:"1px solid #D3D3D0",borderRadius:6,padding:"5px 8px",fontSize:12,fontFamily:"inherit",width:140},
  bulkApply:{padding:"5px 12px",borderRadius:6,border:"none",background:"#2383E2",color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  bulkDelBtn:{padding:"5px 12px",borderRadius:6,border:"1px solid #EB5757",background:"#fff",color:"#EB5757",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  bulkX:{background:"none",border:"none",color:"#9B9A97",cursor:"pointer",fontSize:14},
  toolbar:{display:"flex",gap:8,alignItems:"center",padding:"12px 0",borderBottom:"1px solid #F1F1EF"},
  srchW:{position:"relative",flex:1},
  srchI:{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",fontSize:13,opacity:.5},
  srchIn:{width:"100%",border:"1px solid #E3E2DE",borderRadius:6,padding:"7px 28px 7px 32px",fontSize:13,fontFamily:"inherit",color:"#37352F",background:"#fff"},
  clrBtn:{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#9B9A97",cursor:"pointer",fontSize:12},
  sortBtn:{padding:"7px 12px",border:"1px solid #E3E2DE",borderRadius:6,background:"#fff",fontSize:12,color:"#37352F",cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"},
  sortDrop:{position:"absolute",right:0,top:"calc(100% + 4px)",background:"#fff",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.1)",border:"1px solid #E3E2DE",minWidth:220,zIndex:100,padding:4,animation:"slideD .15s ease"},
  sortOpt:{display:"block",width:"100%",textAlign:"left",border:"none",background:"transparent",padding:"8px 12px",fontSize:13,color:"#37352F",cursor:"pointer",borderRadius:4,fontFamily:"inherit"},
  sortOptOn:{background:"#F1F1EF",fontWeight:600},
  cats:{display:"flex",gap:6,padding:"10px 0",flexWrap:"wrap",alignItems:"center",borderBottom:"1px solid #F1F1EF"},
  catPill:{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:50,border:"1px solid #E3E2DE",background:"#fff",fontSize:12,color:"#37352F",cursor:"pointer",fontFamily:"inherit",fontWeight:500},
  catOn:{background:"#37352F",color:"#fff",borderColor:"#37352F"},
  addCatBtn:{width:26,height:26,borderRadius:50,border:"1px dashed #D3D3D0",background:"transparent",color:"#9B9A97",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"},
  newCatIn:{border:"1px solid #2383E2",borderRadius:6,padding:"4px 8px",fontSize:12,width:90,fontFamily:"inherit"},
  newCatSv:{padding:"4px 10px",borderRadius:6,border:"none",background:"#2383E2",color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
  tHead:{display:"flex",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #F1F1EF",fontSize:11,color:"#9B9A97",fontWeight:500,textTransform:"uppercase",letterSpacing:.5},
  row:{display:"flex",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #F7F6F3",transition:"background .1s, opacity .15s",minHeight:48},
  favRow:{boxShadow:"inset 3px 0 0 #F59E0B",background:"#FFFDF5"},
  chkW:{width:32,display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity .15s"},
  check:{width:16,height:16,borderRadius:4,border:"1.5px solid #D3D3D0",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .1s",flexShrink:0},
  checkOn:{background:"#2383E2",borderColor:"#2383E2"},
  entryText:{fontSize:14,lineHeight:1.55,color:"#37352F"},
  srcCol:{width:200,display:"flex",alignItems:"center",gap:4,paddingRight:8},
  srcText:{fontSize:12,color:"#9B9A97",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",transition:"all .15s"},
  confDot:{width:6,height:6,borderRadius:"50%",flexShrink:0},
  tag:{fontSize:11,fontWeight:500,padding:"2px 8px",borderRadius:4,whiteSpace:"nowrap"},
  rowAct:{width:56,display:"flex",gap:1,opacity:0,transition:"opacity .15s",justifyContent:"flex-end"},
  actBtn:{background:"none",border:"none",cursor:"pointer",color:"#9B9A97",fontSize:14,padding:"2px 4px",borderRadius:4},
  textarea:{width:"100%",border:"1px solid #E3E2DE",borderRadius:6,padding:10,fontSize:14,fontFamily:"inherit",color:"#37352F",resize:"vertical",minHeight:60,lineHeight:1.6,background:"#fff"},
  editIn:{flex:1,minWidth:100,border:"1px solid #2383E2",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit"},
  editSel:{border:"1px solid #E3E2DE",borderRadius:6,padding:"4px 8px",fontSize:12,fontFamily:"inherit",background:"#fff"},
  editSave:{padding:"4px 12px",borderRadius:6,border:"none",background:"#2383E2",color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
  editCancel:{padding:"4px 8px",borderRadius:6,border:"none",background:"transparent",color:"#9B9A97",fontSize:12,cursor:"pointer",fontFamily:"inherit"},
  modalOverlay:{position:"fixed",inset:0,background:"rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20,animation:"fadeUp .15s ease"},
  confirmBox:{background:"#fff",borderRadius:12,padding:24,maxWidth:400,width:"100%",boxShadow:"0 8px 32px rgba(0,0,0,.12)"},
  confirmCancel:{padding:"8px 16px",borderRadius:6,border:"1px solid #E3E2DE",background:"#fff",color:"#37352F",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500},
  confirmYes:{padding:"8px 16px",borderRadius:6,border:"none",background:"#EB5757",color:"#fff",fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:500},
  empty:{textAlign:"center",padding:"60px 24px"},
  previewWrap:{display:"flex",gap:20,alignItems:"stretch",width:"100%",maxWidth:800,marginTop:48,animation:"fadeUp .5s ease",flexWrap:"wrap"},
  previewBox:{flex:1,minWidth:260,background:"#FAFAFA",border:"1px solid #F1F1EF",borderRadius:10,padding:16,overflow:"hidden"},
  previewLabel:{fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:.5,color:"#9B9A97",marginBottom:10},
  previewContent:{display:"flex",flexDirection:"column",gap:6},
  previewLine:{fontSize:13,color:"#787774",lineHeight:1.6,fontFamily:"'SF Mono',Menlo,monospace",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"},
  previewArrow:{display:"flex",alignItems:"center",fontSize:24,color:"#D3D3D0",fontWeight:300,flexShrink:0,padding:"0 4px"},
  previewResult:{display:"flex",alignItems:"center",gap:6,fontSize:12,lineHeight:1.5,minWidth:0},
  previewTag:{fontSize:10,fontWeight:600,padding:"1px 6px",borderRadius:3,whiteSpace:"nowrap",flexShrink:0},
  previewText:{color:"#37352F",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,minWidth:0},
  previewSrc:{color:"#9B9A97",fontSize:11,whiteSpace:"nowrap",flexShrink:0},
  footer:{textAlign:"center",padding:"40px 0 20px",fontSize:12,color:"#D3D3D0",borderTop:"1px solid #F7F6F3",marginTop:40},
  footerLink:{color:"#9B9A97",textDecoration:"none"},
  toast:{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#37352F",color:"#fff",padding:"10px 20px",borderRadius:8,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:12,zIndex:2000,boxShadow:"0 4px 16px rgba(0,0,0,.2)",animation:"toastIn .2s ease",fontFamily:"'Inter',-apple-system,sans-serif"},
  toastAction:{background:"none",border:"1px solid rgba(255,255,255,.3)",borderRadius:4,color:"#fff",padding:"3px 10px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"},
  shareBanner:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:"#EFF6FF",border:"1px solid #DBEAFE",borderRadius:8,margin:"12px 0",fontSize:13,color:"#2563EB",animation:"slideD .2s ease",flexWrap:"wrap",gap:8},
  shareBannerBtn:{padding:"4px 12px",borderRadius:6,border:"1px solid #2563EB",background:"#fff",color:"#2563EB",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"},
};

const CZ = {
  card:{background:"#fff",border:"1px solid #F1F1EF",borderRadius:8,padding:16,transition:"all .15s",cursor:"grab"},
  favCard:{boxShadow:"inset 3px 0 0 #F59E0B",background:"#FFFDF5"},
  top:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10},
  acts:{display:"flex",gap:2,opacity:0,transition:"opacity .15s"},
  txt:{fontSize:15,lineHeight:1.6,color:"#37352F",marginBottom:10},
  srcRow:{display:"flex",alignItems:"center",gap:6},
  src:{fontSize:12,color:"#9B9A97"},
};
