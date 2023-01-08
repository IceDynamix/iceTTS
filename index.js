const {createApp} = Vue;

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

const app = createApp({
    data() {
        return {
            config: {}
        }
    },
    created() {
        this.loadConfig();
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

            if (localStorage.getItem("iceTtsConfig")) {
                try {
                    const storageConfig = JSON.parse(localStorage.getItem("iceTtsConfig"));
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
            localStorage.setItem("iceTtsConfig", JSON.stringify(this.config));
            console.log("Saved iceTtsConfig to browser storage");

            return true;
        },

        resetConfig() {
            localStorage.setItem("iceTtsConfig", JSON.stringify(defaultConfig));
            this.config = defaultConfig;
            console.log("Reset iceTtsConfig");
        }
    }
});

app.component(
    'settings-section',
    {
        props: ['title'],
        template: `
          <div class="bg-light p-3 m-3">
          <h3>{{ title }}</h3>
          <slot></slot>
          </div>`
    });

app.component("input-text", {
    props: ["modelValue", "id", "label", "placeholder"],
    emits: ["update:modelValue"],
    template: `
      <div class="row">
      <label for="channel" class="form-label">{{ label }}</label>
      <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)"
             type="text" class="form-control" :placeholder="placeholder" :id="id"/>
      </div>
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
      <span class="col-1">{{ Math.round(modelValue * 100) }}%</span>
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

app.component('modal', {
    props: ['id', 'title'],
    template: `
      <div class="modal fade" :id="id" tabindex="-1" aria-labelledby="{{id}}Label" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="{{id}}Label">{{ title }}</h5>
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

app.mount('#app');