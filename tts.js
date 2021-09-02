function tts(text) {
    const speech = new SpeechSynthesisUtterance(text);
    speech.rate = document.querySelector("#rate").value;
    speech.pitch = document.querySelector("#pitch").value;
    speech.volume = document.querySelector("#volume").value;

    guessLanguage.detect(text, lang => {
        speech.lang = lang === "unknown" ? "en" : lang;
        speech.voice = window.speechSynthesis.getVoices().filter(v => v.lang === speech.lang)[0];
        window.speechSynthesis.speak(speech);
    });
}
