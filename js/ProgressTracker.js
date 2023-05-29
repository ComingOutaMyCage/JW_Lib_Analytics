class ProgressTracker {
    constructor(totalSteps) {
        this.totalSteps = totalSteps;
        this.currentStep = 0;
        this.startTime = Date.now();
    }
    formatTime(milliseconds) {
        const seconds = Math.floor((milliseconds / 1000) % 60).toString().padStart(2, '0');
        const minutes = Math.floor((milliseconds / (1000 * 60)) % 60).toString().padStart(2, '0');
        const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    }
    updateProgress() {
        this.currentStep++;
        const elapsedTime = Date.now() - this.startTime;
        const estimatedTime = (elapsedTime / this.currentStep) * (this.totalSteps - this.currentStep);
        const estimatedTimestamp = new Date(Date.now() + estimatedTime).toLocaleTimeString();

        return this.formatTime(estimatedTime) + " " + estimatedTimestamp;
        // console.log(`Progress: ${this.currentStep}/${this.totalSteps}`);
        // console.log(`Estimated time remaining: ${Math.ceil(estimatedTime / 1000)} seconds`);
    }
}

export default ProgressTracker;