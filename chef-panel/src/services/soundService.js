class SoundService {
    constructor() {
        this.newOrderSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        this.alertSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        
        // Pre-load sounds
        this.newOrderSound.load();
        this.alertSound.load();
    }

    playNewOrder() {
        this.newOrderSound.currentTime = 0;
        this.newOrderSound.play().catch(e => console.log("Sound play failed", e));
    }

    playAlert() {
        this.alertSound.currentTime = 0;
        this.alertSound.play().catch(e => console.log("Alert play failed", e));
    }
}

export default new SoundService();
