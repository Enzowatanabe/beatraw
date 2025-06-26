// === PreloadScene: carrega todos os assets ===
class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }
  preload() {
    // Faixa 1
    this.load.audio('musica1', [
      'assets/audio/musica1.mp3',
      'assets/audio/musica1.ogg'
    ]);
    this.load.json('bm1', 'assets/beatmaps/musica1.json');
    // Faixa 2 (já existente)
    this.load.audio('musica2', [
      'assets/audio/musica2.mp3',
      'assets/audio/musica2.ogg'
    ]);
    this.load.json('bm2', 'assets/beatmaps/musica2.json');
    // Faixa C (nova)
    this.load.audio('musica2', [
      'assets/audio/musica2.mp3',
      'assets/audio/musica2.ogg'
    ]);
    this.load.json('bmc', 'assets/beatmaps/musica2.json');
  }
  create() {
    this.scene.start('MenuScene');
  }
}

// === MenuScene: escolhe música e dificuldade ===
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    this.add
      .text(400, 80, 'SELECIONE MÚSICA E DIFICULDADE', {
        fontSize: '32px', color: '#fff'
      })
      .setOrigin(0.5);

    const options = [
      { label: 'Música 1 – Fácil',   songKey: 'musica1', beatmapKey: 'bm1', speed: 1 },
      { label: 'Música 1 – Difícil', songKey: 'musica1', beatmapKey: 'bm1', speed: 1.5 },
      { label: 'Música 2 – Fácil',   songKey: 'musica2', beatmapKey: 'bm2', speed: 1 },
      { label: 'Música 2 – Difícil', songKey: 'musica2', beatmapKey: 'bm2', speed: 1.5 },
      { label: 'Música C – Fácil',   songKey: 'musicac', beatmapKey: 'bmc', speed: 1 },
      { label: 'Música C – Difícil', songKey: 'musicac', beatmapKey: 'bmc', speed: 1.5 }
    ];

    options.forEach((opt, i) => {
      this.add
        .text(400, 160 + i * 50, opt.label, {
          fontSize: '24px', color: '#0f0'
        })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
          this.scene.start('GameScene', opt);
        });
    });
  }
}

// === GameScene: gameplay ===
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }

  init(data) {
    this.songKey    = data.songKey;
    this.beatmapKey = data.beatmapKey;
    this.speed      = data.speed;
  }

  create() {
    // Hit-zone
    this.hitZoneY     = 550;
    this.perfectThres = 10;
    this.goodThres    = 30;
    const g = this.add.graphics();
    g.lineStyle(2, 0xff0000);
    g.strokeRect(100, this.hitZoneY - 15, 600, 30);

    // Colunas / teclas
    this.columnsX = [200, 300, 400, 500];
    this.keys     = this.input.keyboard.addKeys('A,S,D,F');

    // Score / combo
    this.score     = 0;
    this.combo     = 0;
    this.scoreText = this.add.text(10, 10, 'PONTOS: 0', { fontSize: '24px', color: '#fff' });
    this.comboText = this.add.text(10, 40, 'COMBO: 0', { fontSize: '24px', color: '#fff' });

    // Feedback
    this.feedbackText = this.add
      .text(400, this.hitZoneY - 50, '', {
        fontSize: '48px', fontStyle: 'bold', color: '#fff'
      })
      .setOrigin(0.5)
      .setAlpha(0);
    this.showFeedback = (txt, clr) => {
      this.feedbackText.setText(txt).setStyle({ color: clr });
      this.tweens.killTweensOf(this.feedbackText);
      this.feedbackText.setAlpha(1);
      this.tweens.add({
        targets: this.feedbackText,
        alpha: 0,
        duration: 800,
        ease: 'Cubic.easeOut'
      });
    };

    // Beatmap & notas
    this.beatmap       = this.cache.json.get(this.beatmapKey);
    console.log('Beatmap carregado:', this.beatmap);
    this.nextNoteIndex = 0;
    this.notesGroup    = this.add.group();

    // Áudio
    this.track   = this.sound.add(this.songKey);
    this.started = false;

    // Botão de início
    const startBtn = this.add
      .text(400, 300, '▶ CLIQUE PARA COMEÇAR', {
        fontSize: '32px', color: '#0f0'
      })
      .setOrigin(0.5)
      .setInteractive();

    startBtn.on('pointerdown', () => {
      if (this.started) return;
      this.started = true;
      startBtn.destroy();
      this.sound.context.resume().then(() => {
        this.songStartTime = this.sound.context.currentTime;
        this.track.play();
      });
    });
  }

  update() {
    if (!this.started) return;
    const currentTime = this.sound.context.currentTime - this.songStartTime;

    // Spawn
    while (
      this.nextNoteIndex < this.beatmap.length &&
      this.beatmap[this.nextNoteIndex].time <= currentTime + 1.5
    ) {
      const { time, col } = this.beatmap[this.nextNoteIndex++];
      const x = this.columnsX[col];
      const note = this.add.rectangle(x, 0, 50, 20, 0xffffff);
      note.col = col;
      this.notesGroup.add(note);
      this.tweens.add({
        targets: note,
        y: this.hitZoneY,
        duration: ((time - currentTime) * 1000) / this.speed,
        ease: 'Linear',
        onComplete: () => note.destroy()
      });
    }

    // Hit logic
    ['A','S','D','F'].forEach((k,i) => {
      if (Phaser.Input.Keyboard.JustDown(this.keys[k])) {
        this.processHit(i);
      }
    });
  }

  processHit(colIndex) {
    const notes = this.notesGroup.getChildren().filter(n => n.col === colIndex);
    if (!notes.length) {
      this.showFeedback('MISS', '#f00');
      return this.resetCombo();
    }
    notes.sort((a,b) => Math.abs(a.y - this.hitZoneY) - Math.abs(b.y - this.hitZoneY));
    const note = notes[0];
    const dy   = Math.abs(note.y - this.hitZoneY);

    let result, pts, clr;
    if (dy < this.perfectThres)      { result='PERFECT'; pts=100; clr='#0f0'; }
    else if (dy < this.goodThres)    { result='GOOD';    pts=50;  clr='#ff0'; }
    else                              { this.showFeedback('MISS','#f00'); return this.resetCombo(); }

    this.showFeedback(result, clr);
    this.score   += pts;
    this.combo   += 1;
    this.scoreText.setText('PONTOS: ' + this.score);
    this.comboText.setText('COMBO: ' + this.combo);
    note.destroy();
  }

  resetCombo() {
    this.combo = 0;
    this.comboText.setText('COMBO: ' + this.combo);
  }
}

// === Configuração e inicialização ===
const gameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2d2d2d',
  scene: [PreloadScene, MenuScene, GameScene]
};

new Phaser.Game(gameConfig);
