export class Visualizer {
  enable() {
    var samples = null;
    var fft = null;
    this.audioIntervalId = window.setInterval(() => {
      const analyser = window.warrolive && window.warrolive.audioAnalyser;
      if (analyser) {
        if (!samples) {
          samples = new Uint8Array(analyser.fftSize);
        }
        if (!fft) {
          fft = new Uint8Array(analyser.fftSize);
        }
        analyser.getByteTimeDomainData(samples);
        analyser.getByteFrequencyData(fft);
        this.onAudioData(samples, fft);
      }
    }, 50);
  }

  disable() {
    if (this.audioIntervalId != null) {
      window.clearTimeout(this.audioIntervalId);
    }
  }

  render() {
    throw new Error("Unimplemented");
  }

  onWindowResize() {
  }

  onAudioData(samples, fft) {
  }
};
