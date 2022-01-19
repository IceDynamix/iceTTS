function tts(text) {
    const speech = new SpeechSynthesisUtterance(text);

    speech.rate = config.speechRate;
    speech.pitch = config.speechPitch;
    speech.volume = config.speechVolume;

    const defaultLang = document.querySelector("#default-lang").value;

    function speak(lang) {
        speech.lang = lang === "unknown" ? defaultLang : lang;
        speech.voice = window.speechSynthesis.getVoices().filter(v => v.lang === speech.lang)[0];
        window.speechSynthesis.speak(speech);
    }

    if (config.multiLangScan)
        guessLanguage.detect(text, speak);
    else
        speak(defaultLang);

}

let client;

document.querySelector("#connect").addEventListener("click", onClickConnect);
document.querySelector("#disconnect").addEventListener("click", onClickDisconnect);
document.querySelector("#test").addEventListener("click", () => { tts("This is a test message") });

function onClickConnect() {
    if (client)
        return; // Already connected

    client = new window.tmi.client({ channels: [document.querySelector("#channel").value] });
    client.on("connected", onConnected);
    client.on("disconnected", onDisconnected);

    client.on("chat", onMessage);

    client.connect().then(() => {
        document.getElementById("disconnect").style.display = "inline-block";
        document.getElementById("connect").style.display = "none";
    }).catch(console.error);
}

function onClickDisconnect() {
    if (client)
        client.disconnect().then(() => {
            client = null;
            document.getElementById("disconnect").style.display = "none";
            document.getElementById("connect").style.display = "inline-block";
        }).catch(console.error);;
}

function onMessage(target, context, msg, self) {
    if (self)
        return;

    if (config.blacklist && config.blacklist.includes(context.username))
        return;

    if (config.replacements)
        config.replacements.forEach(
            ({ find, replace }) => msg = msg.replace(new RegExp(find, "g"), replace)
        );

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
}

function onConnected() {
    console.log(`Connected to IRC`);
    new bootstrap.Toast(document.getElementById("toast-connected")).show();
}

function onDisconnected() {
    console.log(`Disconnected from IRC`);
    new bootstrap.Toast(document.getElementById("toast-disconnected")).show();
}
