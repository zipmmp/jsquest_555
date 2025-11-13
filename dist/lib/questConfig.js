class QuestConfig {
    constructor(options) {
        this.name = options.name;
        this.requireVoiceChannel = options.requireVoiceChannel ?? false;
        this.requireLogin = options.requireLogin ?? false;
        this.runFn = options.run;
    }
    async run(user) {
        return this.runFn(user);
    }
}
