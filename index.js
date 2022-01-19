function tts(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = document.querySelector("#rate").value;
    speech.pitch = document.querySelector("#pitch").value;
    speech.volume = document.querySelector("#volume").value;

    if (document.querySelector("#multi-lang-scan").checked) {
        guessLanguage.detect(text, lang => {
            speech.lang = lang === "unknown" ? document.querySelector("#default-lang").value : lang;
            speech.voice = window.speechSynthesis.getVoices().filter(v => v.lang === speech.lang)[0];
            window.speechSynthesis.speak(speech);
        });
    } else {
        speech.lang = document.querySelector("#default-lang").value;
        speech.voice = window.speechSynthesis.getVoices().filter(v => v.lang === speech.lang)[0];
        window.speechSynthesis.speak(speech);
    }
}

let client;

document.querySelector("#connect").addEventListener("click", () => {
    if (client) return; // Already connected

    client = new window.tmi.client({ channels: [document.querySelector("#channel").value] });

    client.on("connected", () => {
        console.log(`Connected to IRC`);
        new bootstrap.Toast(document.getElementById("toast-connected")).show();
    });

    client.on("disconnected", () => {
        console.log(`Disconnected from IRC`);
        new bootstrap.Toast(document.getElementById("toast-disconnected")).show()
    });

    client.on("chat", (target, context, msg, self) => {
        if (self) return;
        if (config.blacklist && config.blacklist.includes(context.username)) return;
        if (config.replacements)
            config.replacements.forEach(({ find, replace }) => msg = msg.replace(new RegExp(find, "g"), replace));
        if (config.readUsername) {
            let username = context["display-name"];
            if (context.username in config.usernameAliases) {
                username = config.usernameAliases[context.username];
            } else if (username in config.usernameAliases) {
                username = config.usernameAliases[username];
            }
            msg = username + ": " + msg;
        }
        tts(msg);
    });

    client.connect().then(() => {
        document.getElementById("disconnect").style.display = "inline-block";
        document.getElementById("connect").style.display = "none";
    }).catch(console.error);
});

document.querySelector("#disconnect").addEventListener("click", () => {
    if (client) client.disconnect().then(() => {
        client = null;
        document.getElementById("disconnect").style.display = "none";
        document.getElementById("connect").style.display = "inline-block";
    }).catch(console.error);
});

document.querySelector("#test").addEventListener("click", () => {
    tts("This is a test message");
})
