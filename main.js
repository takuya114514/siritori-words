class JaWord {
    constructor(reading, writing) {
        this.name = reading;
        this.writing = writing;
    }
}

const romap = {
    // あ行
    a:"あ", i:"い", u:"う", e:"え", o:"お",

    // か行
    ka:"か", ki:"き", ku:"く", ke:"け", ko:"こ",
    ga:"が", gi:"ぎ", gu:"ぐ", ge:"げ", go:"ご",

    // さ行
    sa:"さ", si:"し", su:"す", se:"せ", so:"そ",
    za:"ざ", zi:"じ", zu:"ず", ze:"ぜ", zo:"ぞ",

    // た行
    ta:"た", ti:"ち", tu:"つ", te:"て", to:"と",
    da:"だ", di:"ぢ", du:"づ", de:"で", do:"ど",

    // な行
    na:"な", ni:"に", nu:"ぬ", ne:"ね", no:"の",

    // は行
    ha:"は", hi:"ひ", hu:"ふ", he:"へ", ho:"ほ",
    ba:"ば", bi:"び", bu:"ぶ", be:"べ", bo:"ぼ",
    pa:"ぱ", pi:"ぴ", pu:"ぷ", pe:"ぺ", po:"ぽ",

    // ま行
    ma:"ま", mi:"み", mu:"む", me:"め", mo:"も",

    // や行
    ya:"や", yu:"ゆ", yo:"よ",

    // ら行
    ra:"ら", ri:"り", ru:"る", re:"れ", ro:"ろ",

    // わ行
    wa:"わ", wo:"を",

    // ん
    n:"ん",
};

function convert_kana(str) {
    let out = "";

    while (str.length) {
        let matched = false;

        for (const [roma, kana] of Object.entries(romap)) {
            if (str.startsWith(roma)) {
                out += kana;
                str = str.slice(roma.length);
                matched = true;
                break;
            }
        }

        if (!matched) {
            out += str[0];
            str = str.slice(1);
        }
    }

    return out;
}

const romap_keys = Object.keys(romap).sort((a, b) => b.length - a.length);

const kanaMap = {
    "あ行": {
        "あ": "あア",
        "い": "いイ",
        "う": "うウ",
        "え": "えエ",
        "お": "おオ"
    },
    "か行": {
        "か": "かカがガ",
        "き": "きキぎギ",
        "く": "くクぐグ",
        "け": "けケげゲ",
        "こ": "こコごゴ"
    },
    "さ行": {
        "さ": "さサざザ",
        "し": "しシじジ",
        "す": "すスずズ",
        "せ": "せセぜゼ",
        "そ": "そソぞゾ"
    },
    "た行": {
        "た": "たタだダ",
        "ち": "ちチぢヂ",
        "つ": "つツづヅっッ",
        "て": "てテでデ",
        "と": "とトどド"
    },
    "な行": {
        "な": "なナ",
        "に": "にニ",
        "ぬ": "ぬヌ",
        "ね": "ねネ",
        "の": "のノ"
    },
    "は行": {
        "は": "はハばバぱパ",
        "ひ": "ひヒびビぴピ",
        "ふ": "ふフぶブぷプ",
        "へ": "へヘべベぺペ",
        "ほ": "ほホぼボぽポ"
    },
    "ま行": {
        "ま": "まマ",
        "み": "みミ",
        "む": "むム",
        "め": "めメ",
        "も": "もモ"
    },
    "や行": {
        "や": "やヤゃャ",
        "ゆ": "ゆユゅュ",
        "よ": "よヨょョ"
    },
    "ら行": {
        "ら": "らラ",
        "り": "りリ",
        "る": "るル",
        "れ": "れレ",
        "ろ": "ろロ"
    },
    "わ行": {
        "わ": "わワゎヮ",
        "を": "をヲ",
        "ん": "んン"
    }
};

let allWords = [];

function toHiragana(str) {
    let out = "";
    let i = 0;

    while (i < str.length) {
        let matched = false;

        for (const key of romap_keys) {
            if (str.startsWith(key, i)) {
                out += romap[key];
                i += key.length;
                matched = true;
                break;
            }
        }

        if (!matched) {
            out += str[i];
            i++;
        }
    }

    return out;
}

async function loadCsv() {
    const response = await fetch("./words.csv");
    if (!response.ok) throw new Error(`ファイルを取得できません (HTTP ${response.status})`);

    const text = await response.text();
    const lines = text.trim().split(/\r?\n/);

    const data = lines.slice(1).map(line => {
        const [reading, writing, type] = line.split(",");
        return { reading, writing, type };
    });

    const result = data
        .filter(x => !(x.reading.endsWith("ん") || x.reading.endsWith("ン")))
        .sort((a, b) => a.reading.localeCompare(b.reading, "ja"))
        .filter((item, index, arr) =>
            index === 0 || item.reading !== arr[index - 1].reading
        );
    
    return result;
}

async function loadWordsFile() {
    const wordDisplay = document.getElementById("word-display");
    const searchStart = document.getElementById("search-input-start");
    const searchEnd = document.getElementById("search-input-end");
    const searchInfo = document.getElementById("search-info");

    try {
        allWords = await loadCsv()

        searchStart.disabled = false;
        searchEnd.disabled = false;
        searchInfo.textContent = `全 ${allWords.length} 件の単語を読み込みました`;

        handleSearch()
    } catch (err) {
        wordDisplay.className = "error-msg";
        wordDisplay.textContent = `読み込みエラー: ${err.message}`;
        searchInfo.textContent = "読み込みに失敗しました。";
    }
}

function getGroupChars(char) {
    if (!char) return null;
    char = toHiragana(char)
    for (const vowels of Object.values(kanaMap)) {
        for (const chars of Object.values(vowels)) {
            if (chars.includes(char)) {
                return chars;
            }
        }
    }
    return null;
}

// 検索処理
function handleSearch() {
    const startQuery = document.getElementById("search-input-start").value.trim();
    const endQuery = document.getElementById("search-input-end").value.trim();
    const searchInfo = document.getElementById("search-info");

    const nounOn = document.getElementById("cat-noun").checked;
    const foreignOn = document.getElementById("cat-foreign").checked;
    const properOn = document.getElementById("cat-proper").checked;
    const verbOn = document.getElementById("cat-verb").checked;

    const sk = convert_kana(startQuery);
    const ek = convert_kana(endQuery);
    const sl = sk ? sk.at(0) : null;
    const el = ek ? ek.at(0) : null;

    const startGroup = sl ? getGroupChars(sl) : null;
    const endGroup = el ? getGroupChars(el) : null;

    const filtered = allWords.filter(word => {
        if (startGroup) {
            if (!startGroup.includes(word.reading.at(0))) return false;
        }

        if (endGroup) {
            if (!endGroup.includes(word.reading.at(word.reading.length - 1))) return false;
        }

        if (!(word.type == "名" && nounOn || word.type == "外" && foreignOn || word.type == "固" && properOn || word.type == "動" && verbOn)) {
            return false;
        }

        return true;
    });

    if (!startGroup && !endGroup) {
        searchInfo.textContent = `全 ${filtered.length} 件の単語`;
        renderWords(filtered, "50音のワード");
        return;
    } else {
        let labelParts = [];
        if (startGroup) labelParts.push(`頭: 「${startGroup.at(0)}」`);
        if (endGroup) labelParts.push(`尻: 「${endGroup.at(0)}」`);

        searchInfo.textContent = `${labelParts.join(" / ")} で検索中`;
        renderWords(filtered, `${labelParts.join("・")} のワード`);
    }
}

// メイン画面へのワード表示
function renderWords(words, title) {
    const titleEl = document.getElementById("current-title");
    const countEl = document.getElementById("word-count");
    const displayEl = document.getElementById("word-display");

    titleEl.textContent = title;
    countEl.textContent = `${words.length}件`;
    displayEl.className = "";
    displayEl.innerHTML = "";

    if (words.length === 0) {
        displayEl.className = "status-msg";
        displayEl.textContent = "該当するワードが見つかりませんでした。";
        return;
    }

    const grid = document.createElement("div");
    grid.className = "word-grid";

    words.forEach(word => {
        const card = document.createElement("button");
        card.className = "word-card";
        card.textContent = word.writing;
        card.addEventListener("click", () => {
            window.open(
                `https://kotobank.jp/word/${encodeURIComponent(word.writing)}`,
                "_blank",
                "noopener,noreferrer"
            );
        });
        grid.appendChild(card);
    });

    displayEl.appendChild(grid);
}

// 画面が開いた時に実行
window.onload = loadWordsFile;