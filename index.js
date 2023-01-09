const {createApp, reactive} = Vue;

const defaultConfig = {
    channel: "",
    speechRate: 1.0,
    speechVolume: 0.5,
    speechPitch: 1.0,
    defaultLang: '',
    multiLangScan: true,
    readUsername: false,
    usernameAliases: [],
    enableReplacements: false,
    replacements: [
        {
            find: "asshole",
            replace: "a-hole"
        },
        {
            find: "https?:\\/\\/(?:www\\.)?([-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6})\\b(?:[-a-zA-Z0-9()!@:%_\\+.~#?&\\/\\/=]*)",
            replace: "$1 url"
        }
    ],
    useRegex: true,
    enableBlacklist: false,
    blacklist: [],
    enableWhitelist: false,
    whitelist: [],
};

const localStorageKey = "iceTtsConfig";

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

const app = createApp({
    data() {
        return {
            config: {},
            availableLanguages: [],
            ircClient: null,
            ircConnected: false
        }
    },
    created() {
        this.loadConfig();

        window.speechSynthesis.onvoiceschanged = () => {
            this.availableLanguages = window.speechSynthesis.getVoices()
                .map(v => langNameMap[v.lang.slice(0, 2)]) // get full name
                .filter((v, i, self) => self.indexOf(v) === i); // unique
        };
    },
    watch: {
        config: {
            handler() {
                this.saveConfig();
            },
            deep: true
        }
    },
    methods: {
        loadConfig() {
            this.config = {};
            Object.assign(this.config, defaultConfig);

            if (localStorage.getItem(localStorageKey)) {
                try {
                    const storageConfig = JSON.parse(localStorage.getItem(localStorageKey));
                    Object.assign(this.config, storageConfig);

                    console.log("Loaded iceTtsConfig from browser storage");
                    console.log(this.config);
                } catch (error) {
                    console.error("Could not read iceTtsConfig from browser storage", error);
                }
            } else {
                console.log("No iceTtsConfig found in browser, using default");
            }
        },

        saveConfig(newConfig) {
            if (newConfig) {
                try {
                    this.config = JSON.parse(newConfig);
                } catch (e) {
                    console.error("Error while parsing new config");
                    return false;
                }
            }
            localStorage.setItem(localStorageKey, JSON.stringify(this.config));
            console.log("Saved iceTtsConfig to browser storage");

            return true;
        },

        resetConfig() {
            localStorage.setItem(localStorageKey, JSON.stringify(defaultConfig));
            this.config = defaultConfig;
            console.log("Reset iceTtsConfig");
        },

        tts(text) {
            const speech = new SpeechSynthesisUtterance(text);

            speech.rate = this.config.speechRate;
            speech.pitch = this.config.speechPitch;
            speech.volume = this.config.speechVolume;

            const defaultLang = this.config.defaultLang;

            function speak(lang) {
                if (lang === "unknown") console.log(`Could not detect language for ${text}`);
                speech.lang = lang === "unknown" ? defaultLang : lang;
                speech.voice = window.speechSynthesis.getVoices().filter(v => v.lang === speech.lang)[0];
                window.speechSynthesis.speak(speech);
                console.log(`Spoke message '${text}' in '${lang}'`);
            }

            if (this.config.multiLangScan)
                guessLanguage.detect(text, speak);
            else
                speak(defaultLang);
        },

        connectIrc() {
            if (this.ircClient)
                return; // Already connected

            this.ircClient = new tmi.client({channels: [this.config.channel]});

            this.ircClient.on("connected", (x) => {
                console.log(`Connected to IRC: ${x}`);
                new bootstrap.Toast(document.getElementById("toast-connected")).show();
                this.ircConnected = true;
            });

            this.ircClient.on("disconnected", (x) => {
                console.log(`Disconnected from IRC: ${x}`);
                new bootstrap.Toast(document.getElementById("toast-disconnected")).show();
                this.ircConnected = false;
            });

            this.ircClient.on("chat", (target, context, msg, self) => {
                if (self) return;

                msg = this.performReplacements(msg);
                if (this.config.readUsername) {
                    let username = this.getUsernameReading(context);
                    msg = username + ": " + msg;
                }

                this.tts(msg);
            });

            this.ircClient.connect().catch(console.error);
        },

        disconnectIrc() {
            if (!this.ircClient) return;
            this.ircClient.disconnect().then(() => {
                this.ircClient = null;
            }).catch(console.error);
        },

        isIrcConnected() {
            return this.ircClient != null;
        },

        performReplacements(msg) {
            if (!this.config.enableReplacements) return msg;

            for (const {find, replace} of this.config.replacements) {
                if (this.config.useRegex) {
                    msg = msg.replace(new RegExp(find, "g"), replace)
                } else {
                    msg = msg.replaceAll(find, replace);
                }
            }

            return msg;
        },

        getUsernameReading(context) {
            const aliases = this.config.usernameAliases;
            let username = context["display-name"];

            if (context["username"] in aliases) {
                username = context["username"];
            } else if (context["display-name"] in aliases) {
                username = aliases[context["display-name"]];
            }

            return username;
        }
    }
});

app.component(
    'settings-section',
    {
        props: ['title'],
        template: `
          <div class="bg-light p-3 my-3">
          <h3>{{ title }}</h3>
          <slot></slot>
          </div>`
    });

app.component("input-text", {
    props: ["modelValue", "id", "label", "placeholder"],
    emits: ["update:modelValue"],
    template: `
      <label v-if="label" for="channel" class="form-label">{{ label }}</label>
      <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"
             type="text" class="form-control" :placeholder="placeholder" :id="id"/>
    `
});

app.component("input-slider-percentage", {
    props: ["modelValue", "id", "label", "labelValue", "placeholder", "max"],
    emits: ["update:modelValue"],
    template: `
      <div class="row">
      <label :for="id" class="col-2 form-label">{{ label }}</label>
      <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"
             class="col form-range" :id="id"
             type="range" :min="0" :max="max" step="0.05"/>
      <span class="col-2">{{ Math.round(modelValue * 100) }}%</span>
      </div>
    `
});

app.component("input-select", {
    props: ["modelValue", "id", "label", "labelValue", "placeholder", "items"],
    emits: ["update:modelValue"],
    template: `
      <div class="row">
      <div class="col">
        <label :for="id" class="form-label">
          {{ label }}
        </label>
        <select :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" :id="id"
                class="form-select">
          <option v-for="item in items" :value="item" :selected="item === modelValue">{{ item }}</option>
        </select>
      </div>
      </div>
    `
});

app.component("input-checkbox", {
    props: ["modelValue", "id", "label"],
    emits: ["update:modelValue"],
    template: `
      <div class="form-check form-switch mt-3">
      <input :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)"
             class="form-check-input" type="checkbox" :id="id">
      <label class="form-check-label" :for="id">
        {{ label }}
      </label>
      </div>
    `
});

app.component("app-button", {
    props: ['label'],
    template: `
      <button type="button" class="btn btn-primary">{{ label }}</button>
    `
})

app.component("modal-trigger", {
    props: ['label', 'modalId'],
    template: `
      <app-button :label="label" data-bs-toggle="modal" :data-bs-target="'#' + modalId"></app-button>
    `
})

app.component('modal', {
    props: ['id', 'title'],
    template: `
      <div class="modal fade" :id="id" tabindex="-1" :aria-labelledby="id+'Label'" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="id+'Label'">{{ title }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <slot name="body"></slot>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
      </div>
    `
});

app.component("toast", {
    props: ["id"],
    template: `
      <div class="toast-container position-fixed bottom-0 end-0 m-3">
      <div :id="id" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-body">
          <slot></slot>
        </div>
      </div>
      </div>
    `,
});

app.component("settings-json", {
    data() {
        return {
            id: "settings-modal",
            settingsText: '',
            saveResult: null,
        }
    },
    template: `
      <modal-trigger :modalId="id" label="Open settings JSON" @click="load()"></modal-trigger>
      <modal :id="id" title="Settings JSON">
      <template v-slot:body>
        <p>
          Make sure to make a backup when editing directly! Only the JSON format is validated, the
          values are unchecked.
        </p>
        <textarea
            class="form-control" :class="{'is-valid': saveResult === true, 'is-invalid': saveResult === false}"
            rows="10" style="font-family:monospace;white-space:pre;overflow-wrap:normal;overflow-x:scroll;"
            v-model="settingsText"
            @input="saveResult = null"
        ></textarea>
      </template>
      <template v-slot:footer>
        <button type="button" class="btn btn-primary" @click="save()">
          Save
        </button>
      </template>
      </modal>
    `,
    methods: {
        load() {
            this.settingsText = JSON.stringify(this.$root.config, null, 2);
        },
        save() {
            this.saveResult = this.$root.saveConfig(this.settingsText);
        }
    }
});

app.component('list-table', {
    props: ['list', 'default'],
    data() {
        return {
            items: this.list,
            newItem: this.default
        }
    },
    template: `
      <table class="table">
      <thead>
      <tr>
        <slot name="header"></slot>
        <th></th>
      </tr>
      </thead>
      <tbody>
      <template v-for="(item, i) in items" :key="i">
        <tr>
          <slot name="item" :item="item" :index="i"></slot>
          <td>
            <button @click="remove(i)" class="btn btn-danger">-</button>
          </td>
        </tr>
      </template>
      </tbody>
      </table>
      <p>
      <button @click="add()" class="btn btn-success">Add</button>
      </p>
    `,
    methods: {
        add() {
            this.items.push(this.newItem);
        },
        remove(i) {
            this.items.splice(i, 1);
        }
    }
});

app.mount('#app');