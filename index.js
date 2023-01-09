const {createApp} = Vue;

const defaultConfig = {
    version: 2,
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
            find: "https?:\\/\\/(?:www\\.)?([-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6})\\b(?:[-a-zA-Z0-9()!@:%_\\+.~#?&\\/\\/=]*)",
            replace: "$1 url"
        },
        {
            find: "(asshole|fuck|smooth ?brained)",
            replace: " slur "
        },
        {
            find: "[:\\/;]",
            replace: " "
        },
        {
            find: "(.)\\1{4,}",
            replace: "$1$1$1$1$1"
        },
        {
            find: "^(.{150}).*$",
            replace: "$1 et cetera"
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

const configMigrations = [
    {
        version: 1,
        migration: config => config.enableReplacements = config.replacements.length > 0
    },
    {
        version: 2,
        migration: config => config.usernameAliases = Object.entries(config.usernameAliases)
            .map(([username, alias]) => ({username, alias}))
    }
];

function performConfigMigrations(config) {
    if (!("version" in config)) {
        config.version = 0;
    }

    for (const {version, migration} of configMigrations) {
        if (version <= config.version) continue;
        migration(config);
        console.log(`Migrated config from version ${config.version} to ${version}`)
        config.version++;
    }

    return config;
}

const app = createApp({
    data() {
        return {
            config: {},
            availableLanguages: [],
            ircClient: null,
            ircConnected: false,
            showConfigToast: false
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
    mounted() {
        if (this.showConfigToast) {
            new bootstrap.Toast(document.getElementById("toast-bad-config")).show();
            this.showConfigToast = false;
        }
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
            // this.config is saved on every assignment (see watcher),
            // we want to avoid making any assignments until its actually ready
            let tempConfig = {...defaultConfig};

            let storageConfigString = localStorage.getItem(localStorageKey);
            if (storageConfigString) {
                try {
                    let storageConfig = JSON.parse(storageConfigString);
                    storageConfig = performConfigMigrations(storageConfig);
                    tempConfig = {...tempConfig, ...storageConfig};

                    console.log("Loaded iceTtsConfig from browser storage");
                    console.log(tempConfig);
                } catch (error) {
                    console.error("Could not read iceTtsConfig from browser storage");
                    console.log("Original string stored in storage: ", storageConfigString);
                    console.error(error);
                    this.showConfigToast = true;
                }
            } else {
                console.log("No iceTtsConfig found in browser, using default");
            }

            this.config = tempConfig;
        },

        saveConfig(newConfig) {
            if (newConfig) {
                try {
                    this.config = JSON.parse(newConfig);
                } catch (e) {
                    console.error("Error while parsing new config");
                    console.error(e);
                    return false;
                }
            }
            localStorage.setItem(localStorageKey, JSON.stringify(this.config));
            console.log("Saved iceTtsConfig to browser storage");

            return true;
        },

        resetConfig() {
            if (confirm("Are you sure you want to reset all settings?")) {
                localStorage.setItem(localStorageKey, JSON.stringify(defaultConfig));
                this.config = defaultConfig;
                console.log("Reset iceTtsConfig");
            }
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

            this.ircClient.on("disconnected", (x) => {
                console.log(`Disconnected from IRC: ${x}`);
                new bootstrap.Toast(document.getElementById("toast-disconnected")).show();
                this.ircConnected = false;
            });

            this.ircClient.on("chat", (target, context, msg, self) => {
                if (self) return;

                if (!this.isAllowedToSpeak(context)) return;

                msg = this.performReplacements(msg);
                if (this.config.readUsername) {
                    let username = this.getUsernameReading(context);
                    msg = username + ": " + msg;
                }

                this.tts(msg);
            });

            this.ircClient.connect().then(x => {
                console.log(`Connected to IRC: ${x}`);
                new bootstrap.Toast(document.getElementById("toast-connected")).show();
                this.ircConnected = true;
            }).catch(err => {
                console.error("Could not connect to Twitch");
                console.error(err);
                new bootstrap.Toast(document.getElementById("toast-connected-error")).show();
            });
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

        isAllowedToSpeak(context) {
            const displayName = context["display-name"];
            const twitchName = context["username"];

            for (const name of [displayName, twitchName]) {
                if (this.config.enableBlacklist && this.config.blacklist.includes(name))
                    return false;
            }

            if (this.config.enableWhitelist) {
                if (!(this.config.whitelist.contains(displayName) || this.config.whitelist.contains(twitchName))) {
                    return false;
                }
            }

            return true;
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

            const displayName = context["display-name"];
            const twitchName = context["username"];

            for ({username, alias} of aliases) {
                if ([displayName, twitchName].includes(username)) return alias;
            }

            return displayName;
        }
    }
});

app.component(
    'settings-section',
    {
        props: ['title'],
        template: `
          <div class="bg-light p-4 my-4">
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
      <div class="modal-dialog modal-lg">
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
      <div :id="id" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="toast-body">
        <slot></slot>
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
    props: ['modelValue', 'default', 'columns', 'toColumns', 'toObj'],
    emits: ['update:modelValue'],
    data() {
        return {
            defaultItem: this.default,
            currentItemColumns: this.toColumns(this.default),
        }
    },
    template: `
      <table class="table">
      <thead>
      <tr>
        <th v-for="column in columns">
          {{ column }}
        </th>
        <th></th>
      </tr>
      </thead>
      <tbody>
      <template v-for="(item, i) in modelValue" :key="i">
        <tr>
          <td v-for="column in toColumns(item)">
            <kbd>{{column.replaceAll(' ', '&nbsp')}}</kbd>
          </td>
          <td>
            <button @click="remove(i)" class="btn btn-danger btn-sm">-</button>
          </td>
        </tr>
      </template>
      <tr>
        <td v-for="(column, i) in currentItemColumns">
          <input-text v-model="currentItemColumns[i]" :placeholder="columns[i]"></input-text>
        </td>
        <td>
          <button @click="add()" class="btn btn-success">Add</button>
        </td>
      </tr>
      </tbody>
      </table>
      <p>
      </p>
    `,
    methods: {
        add() {
            this.save([...this.modelValue, this.toObj(this.currentItemColumns)]);
            this.currentItemColumns = this.toColumns(this.defaultItem);
        },
        remove(i) {
            const list = [...this.modelValue];
            list.splice(i, 1);
            this.save(list)
        },
        save(list) {
            this.$emit('update:modelValue', list);
        }
    }
});

app.mount('#app');