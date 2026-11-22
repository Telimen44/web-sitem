window.BureauSound = (() => {
  const Audio = window.AudioContext || window.webkitAudioContext;
  let context;
  let output;
  let noise;
  let enabled = true;

  function unlock() {
    if (!enabled || !Audio) return;
    try {
      if (!context) {
        context = new Audio();
        output = context.createGain();
        output.gain.value = 0.48;
        output.connect(context.destination);
        noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
        const samples = noise.getChannelData(0);
        for (let index = 0; index < samples.length; index++) samples[index] = Math.random() * 2 - 1;
      }
      if (context.state === "suspended") context.resume().catch(() => {});
    } catch {
      // The visual cues also work on devices without audio.
    }
  }

  function connectVoice(source, time, duration, volume, pan, attack = .008) {
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(.0001, time);
    envelope.gain.exponentialRampToValueAtTime(volume, time + attack);
    envelope.gain.exponentialRampToValueAtTime(.0001, time + duration);
    source.connect(envelope);
    if (context.createStereoPanner) {
      const stereo = context.createStereoPanner();
      stereo.pan.value = pan;
      envelope.connect(stereo);
      stereo.connect(output);
    } else {
      envelope.connect(output);
    }
  }

  function mallet(time, pitch, duration, volume, pan = 0) {
    const partials = [
      [1, 1, 1], [2.01, .20, .53], [3.98, .095, .32]
    ];
    partials.forEach(([ratio, amplitude, decay]) => {
      const oscillator = context.createOscillator();
      const length = duration * decay;
      oscillator.frequency.value = pitch * ratio;
      connectVoice(oscillator, time, length, volume * amplitude, pan, .005);
      oscillator.start(time);
      oscillator.stop(time + length + .02);
    });
  }

  function paper(time, high, low, duration, volume, pan = 0) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 0.7;
    filter.frequency.setValueAtTime(high, time);
    filter.frequency.exponentialRampToValueAtTime(low, time + duration);
    source.buffer = noise;
    source.connect(filter);
    connectVoice(filter, time, duration, volume, pan, Math.min(.045, duration / 3));
    source.start(time, Math.random() * .4);
    source.stop(time + duration + .01);
  }

  const cues = {
    study(time) {
      paper(time, 1800, 480, .28, .19, -.15);
      mallet(time + .04, 349.23, .23, .12);
      mallet(time + .13, 523.25, .34, .095, .12);
    },
    cover(time) {
      paper(time, 2700, 320, .43, .34, -.18);
      mallet(time + .13, 174.61, .12, .19);
    },
    reveal(time) {
      paper(time, 650, 2600, .24, .19, .16);
      mallet(time + .09, 587.33, .33, .11);
    },
    correct(time) {
      mallet(time, 523.25, .38, .22, -.18);
      mallet(time + .11, 659.25, .4, .19);
      mallet(time + .22, 783.99, .56, .18, .18);
    },
    retry(time) {
      mallet(time, 349.23, .22, .16);
      mallet(time + .13, 293.66, .35, .13, -.12);
    },
    hint(time) {
      mallet(time, 440, .22, .13, -.12);
      mallet(time + .1, 587.33, .32, .11, .12);
    },
    finish(time) {
      const notes = [392, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((pitch, index) => mallet(time + index * .11, pitch, .48 + index * .08, .19, (index - 2) * .11));
      mallet(time + .43, 261.63, .65, .12);
    }
  };

  return {
    unlock,
    setEnabled(value) {
      enabled = value;
      if (context && output) output.gain.setTargetAtTime(value ? .48 : 0, context.currentTime, .017);
      if (enabled) unlock();
    },
    play(cue) {
      if (!enabled || !context) return;
      cues[cue]?.(context.currentTime + .025);
    }
  };
})();
