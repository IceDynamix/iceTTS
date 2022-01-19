let config = {
    speechRate: 1.0,
    speechVolume: 0.5,
    speechPitch: 1.0,
    channel: "",
    multiLangScan: true,
    readUsername: false,
    usernameAliases: { "username1": "peter", "username2": "walter" },
    blacklist: [],
    replacements: [
        {
            find: "https?:\\/\\/(?:www\\.)?([-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6})\\b(?:[-a-zA-Z0-9()!@:%_\\+.~#?&\\/\\/=]*)",
            replace: "$1 url"
        }
    ]
};

function saveConfig() {
    localStorage.setItem("iceTtsConfig", JSON.stringify(config));
}

function loadConfig() {
    if (localStorage.getItem("iceTtsConfig")) {
        try {
            let savedConfig = JSON.parse(localStorage.getItem("iceTtsConfig"))
            config = Object.assign(config, savedConfig);
        } catch (error) {
            console.error("Could not read iceTtsConfig from localStorage", error);
        }
    }

    if (config.speechRate) {
        document.querySelector("#rate").value = config.speechRate;
        updateRate();
    }
    if (config.speechVolume) {
        document.querySelector("#volume").value = config.speechVolume;
        updateVolume();
    }
    if (config.speechPitch) {
        document.querySelector("#pitch").value = config.speechPitch;
        updatePitch();
    }
    if (config.channel) document.querySelector("#channel").value = config.channel;
    if (config.multiLangScan) document.querySelector("#multi-lang-scan").checked = config.multiLangScan;

    if (config.readUsername) document.querySelector("#read-username").checked = config.readUsername;
    if (config.usernameAliases) document.querySelector("#username-aliases").value = JSON.stringify(config.usernameAliases, null, 2);

    if (config.blacklist) document.querySelector("#blacklist").value = config.blacklist.join("\n");
    if (config.replacements) document.querySelector("#replacements").value = JSON.stringify(config.replacements, null, 2);
}

function updateRate() {
    const rate = document.querySelector("#rate").value;
    config.speechRate = rate;
    document.querySelector("#rate-label").innerHTML = rate;
    saveConfig();
}

function updateVolume() {
    const volume = document.querySelector("#volume").value;
    config.speechVolume = volume;
    document.querySelector("#volume-label").innerHTML = volume;
    saveConfig();
}

function updatePitch() {
    const pitch = document.querySelector("#pitch").value;
    config.speechPitch = pitch;
    document.querySelector("#pitch-label").innerHTML = pitch;
    saveConfig();
}

function updateChannel() {
    config.channel = document.querySelector("#channel").value;
    saveConfig();
}

function updateMultiLangScan() {
    config.multiLangScan = document.querySelector("#multi-lang-scan").checked;
    saveConfig();
}

function updateReadUsername() {
    config.readUsername = document.querySelector("#read-username").checked;
    saveConfig();
}

function updateUsernameAliases() {
    let classList = document.querySelector("#username-aliases").classList;
    try {
        config.usernameAliases = JSON.parse(document.querySelector("#username-aliases").value);
        if (classList.contains("is-invalid")) classList.remove("is-invalid");
        classList.add("is-valid");
        saveConfig();
    } catch (error) {
        if (classList.contains("is-valid")) classList.remove("is-valid");
        classList.add("is-invalid");
        document.querySelector("#username-aliases-feedback").textContent = "JSON is invalid";
    }
}

function updateBlacklist() {
    config.blacklist = document.querySelector("#blacklist").value.split("\n");
    saveConfig();
}

function updateReplacements() {
    let classList = document.querySelector("#replacements").classList;
    try {
        config.replacements = JSON.parse(document.querySelector("#replacements").value);
        if (classList.contains("is-invalid")) classList.remove("is-invalid");
        classList.add("is-valid");
        saveConfig();
    } catch (error) {
        if (classList.contains("is-valid")) classList.remove("is-valid");
        classList.add("is-invalid");
        document.querySelector("#replacements-feedback").textContent = "JSON is invalid";
    }
}

document.querySelector("#rate").addEventListener("input", updateRate);
document.querySelector("#volume").addEventListener("input", updateVolume);
document.querySelector("#pitch").addEventListener("input", updatePitch);
document.querySelector("#channel").addEventListener("input", updateChannel);
document.querySelector("#multi-lang-scan").addEventListener("change", updateMultiLangScan);
document.querySelector("#read-username").addEventListener("change", updateReadUsername);
document.querySelector("#username-aliases").addEventListener("input", updateUsernameAliases);
document.querySelector("#blacklist").addEventListener("input", updateBlacklist);
document.querySelector("#replacements").addEventListener("input", updateReplacements);

loadConfig();

window.speechSynthesis.onvoiceschanged = () => {
    const languages = window.speechSynthesis.getVoices().map(v => v.lang.slice(0, 2)).filter((v, i, self) => self.indexOf(v) === i);
    const langNameMap = {
        "ab": "Abkhazian",
        "af": "Afrikaans",
        "ar": "Arabic",
        "az": "Azeri",
        "be": "Belarusian",
        "bg": "Bulgarian",
        "bn": "Bengali",
        "bo": "Tibetan",
        "br": "Breton",
        "ca": "Catalan",
        "ceb": "Cebuano",
        "cs": "Czech",
        "cy": "Welsh",
        "da": "Danish",
        "de": "German",
        "el": "Greek",
        "en": "English",
        "eo": "Esperanto",
        "es": "Spanish",
        "et": "Estonian",
        "eu": "Basque",
        "fa": "Farsi",
        "fi": "Finnish",
        "fo": "Faroese",
        "fr": "French",
        "fy": "Frisian",
        "gd": "Scots Gaelic",
        "gl": "Galician",
        "gu": "Gujarati",
        "ha": "Hausa",
        "haw": "Hawaiian",
        "he": "Hebrew",
        "hi": "Hindi",
        "hmn": "Pahawh Hmong",
        "hr": "Croatian",
        "hu": "Hungarian",
        "hy": "Armenian",
        "id": "Indonesian",
        "is": "Icelandic",
        "it": "Italian",
        "ja": "Japanese",
        "ka": "Georgian",
        "kk": "Kazakh",
        "km": "Cambodian",
        "ko": "Korean",
        "ku": "Kurdish",
        "ky": "Kyrgyz",
        "la": "Latin",
        "lt": "Lithuanian",
        "lv": "Latvian",
        "mg": "Malagasy",
        "mk": "Macedonian",
        "ml": "Malayalam",
        "mn": "Mongolian",
        "mr": "Marathi",
        "ms": "Malay",
        "nd": "Ndebele",
        "ne": "Nepali",
        "nl": "Dutch",
        "nn": "Nynorsk",
        "no": "Norwegian",
        "nso": "Sepedi",
        "pa": "Punjabi",
        "pl": "Polish",
        "ps": "Pashto",
        "pt": "Portuguese",
        "pt-PT": "Portuguese (Portugal)",
        "pt-BR": "Portuguese (Brazil)",
        "ro": "Romanian",
        "ru": "Russian",
        "sa": "Sanskrit",
        "bs": "Serbo-Croatian",
        "sk": "Slovak",
        "sl": "Slovene",
        "so": "Somali",
        "sq": "Albanian",
        "sr": "Serbian",
        "sv": "Swedish",
        "sw": "Swahili",
        "ta": "Tamil",
        "te": "Telugu",
        "th": "Thai",
        "tl": "Tagalog",
        "tlh": "Klingon",
        "tn": "Setswana",
        "tr": "Turkish",
        "ts": "Tsonga",
        "tw": "Twi",
        "uk": "Ukrainian",
        "ur": "Urdu",
        "uz": "Uzbek",
        "ve": "Venda",
        "vi": "Vietnamese",
        "xh": "Xhosa",
        "zh": "Chinese",
        "zh-TW": "Traditional Chinese (Taiwan)",
        "zu": "Zulu"
    };

    const defaultLanguageSelect = document.querySelector("#default-lang");
    languages.forEach((lang, i) => {
        defaultLanguageSelect.options[i] = new Option(langNameMap[lang], lang);
    });
};
