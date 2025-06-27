// ========== Pré-carregamento ==========
class PreloadScene extends Phaser.Scene {
  constructor() { super('PreloadScene'); }
  preload() {
    this.load.audio('musica1', ['assets/audio/musica1.mp3']);
    this.load.json('bm1', 'assets/beatmaps/musica1.json');
    this.load.audio('musica2', ['assets/audio/musica2.mp3']);
    this.load.json('bm2', 'assets/beatmaps/musica2.json');
    this.load.audio('musica3', ['assets/audio/musica3.mp3']);
    this.load.json('bm3', 'assets/beatmaps/musica3.json');
  }
  create() { this.scene.start('MenuScene'); }
}

// ========== MENU ==========
class MenuScene extends Phaser.Scene {
  constructor() { super('MenuScene'); }
  create() {
    const w = this.scale.width, h = this.scale.height, cx = w / 2;

    this.add.text(cx, 50, 'RHYTHM JAM', { fontSize: '36px', color: '#fff' }).setOrigin(0.5);
    this.add.text(cx, 90, 'Selecione música e dificuldade', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);

    // === Campo para nome do jogador (HTML Input) ===
    let nomeSalvo = localStorage.getItem('nomeJogador') || 'JOGADOR';
    let nomeInput = document.createElement('input');
    nomeInput.type = 'text';
    nomeInput.maxLength = 16;
    nomeInput.value = nomeSalvo;
    nomeInput.placeholder = 'Digite seu nome';
    nomeInput.style.position = 'absolute';
    nomeInput.style.top = '10px';
    nomeInput.style.left = '50%';
    nomeInput.style.transform = 'translateX(-50%)';
    nomeInput.style.fontSize = '20px';
    nomeInput.style.padding = '6px';
    nomeInput.style.zIndex = 10;
    nomeInput.style.textAlign = 'center';
    nomeInput.style.borderRadius = '8px';
    nomeInput.style.border = '1px solid #333';
    nomeInput.autofocus = true;
    document.body.appendChild(nomeInput);

    // Remove input ao sair da cena
    this.events.once('shutdown', () => { nomeInput.remove(); });

    nomeInput.addEventListener('input', () => {
      localStorage.setItem('nomeJogador', nomeInput.value.toUpperCase());
    });

    // === Botões de música ===
    const gameOptions = [
      { label: 'Música 1 – Fácil',   songKey: 'musica1', beatmapKey: 'bm1', speed: 1 },
      { label: 'Música 1 – Difícil', songKey: 'musica1', beatmapKey: 'bm1', speed: 1.5 },
      { label: 'Música 2 – Fácil',   songKey: 'musica2', beatmapKey: 'bm2', speed: 1 },
      { label: 'Música 2 – Difícil', songKey: 'musica2', beatmapKey: 'bm2', speed: 1.5 },
      { label: 'Música 3 – Fácil',   songKey: 'musica3', beatmapKey: 'bm3', speed: 1 },
      { label: 'Música 3 – Difícil', songKey: 'musica3', beatmapKey: 'bm3', speed: 1.5 }
    ];

    gameOptions.forEach((opt, i) => {
      let btn = this.add.text(cx, 150 + i * 40, opt.label, { fontSize: '20px', color: '#fff', backgroundColor: '#444', padding: { left: 10, right: 10, top: 5, bottom: 5 } })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => { 
          let nome = nomeInput.value.trim() ? nomeInput.value.trim().toUpperCase() : 'JOGADOR';
          localStorage.setItem('nomeJogador', nome);
          this.scene.start('GameScene', {...opt, nomeJogador: nome}); 
        });
    });

    // Editor de beatmap
    this.add.text(cx, 420, 'Editor de Beatmap', { fontSize: '16px', color: '#fff' }).setOrigin(0.5);

    const editorOptions = [
      { label: 'Editar Música 1', songKey: 'musica1', beatmapKey: 'bm1' },
      { label: 'Editar Música 2', songKey: 'musica2', beatmapKey: 'bm2' },
      { label: 'Editar Música 3', songKey: 'musica3', beatmapKey: 'bm3' }
    ];
    editorOptions.forEach((opt, i) => {
      this.add.text(cx, 450 + i * 28, opt.label, { fontSize: '16px', color: '#ffd700' })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => { this.scene.start('EditorScene', opt); });
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }
}

// ========== GAME ==========
class GameScene extends Phaser.Scene {
  constructor() { super('GameScene'); }
  init(data) {
    this.songKey    = data.songKey;
    this.beatmapKey = data.beatmapKey;
    this.speed      = data.speed;
    this.nomeJogador = data.nomeJogador || 'JOGADOR';
  }
  create() {
    const w = this.scale.width, h = this.scale.height, cx = w / 2;

    // Hit-zone (barra e linha de acerto ampliada)
    this.hitZoneY = Math.floor(h * 0.92);
    const hitZoneW = Math.floor(w * 0.75);
    const hitZoneX = cx - hitZoneW / 2;

    this.add.rectangle(hitZoneX, this.hitZoneY - 30, hitZoneW, 60, 0x888888).setOrigin(0, 0);
    this.add.line(
      cx, this.hitZoneY,
      -hitZoneW/2, 0,
       hitZoneW/2, 0,
      0xff0000
    ).setLineWidth(4);

    const teclas = ['A', 'S', 'D', 'F'];
    this.columnsX = [];
    const espacamento = hitZoneW / (teclas.length - 1);
    for (let i = 0; i < teclas.length; i++) {
      let x = hitZoneX + i * espacamento;
      this.columnsX.push(x);
      this.add.text(x, this.hitZoneY + 50, teclas[i], { fontSize: '24px', color: '#fff' }).setOrigin(0.5, 0);
    }
    this.keys = this.input.keyboard.addKeys('A,S,D,F');

    this.score     = 0;
    this.combo     = 0;
    this.scoreText = this.add.text(20, 20, 'PONTOS: 0', { fontSize: '18px', color: '#fff' });
    this.comboText = this.add.text(20, 50, 'COMBO: 0', { fontSize: '18px', color: '#fff' });

    this.feedbackText = this.add.text(cx, this.hitZoneY - 70, '', { fontSize: '32px', color: '#fff' }).setOrigin(0.5).setAlpha(0);
    this.showFeedback = (txt, clr) => {
      this.feedbackText.setText(txt).setColor(clr || '#fff');
      this.feedbackText.setAlpha(1);
      this.tweens.killTweensOf(this.feedbackText);
      this.tweens.add({ targets: this.feedbackText, alpha: 0, duration: 700, ease: 'Cubic.easeOut' });
    };

    this.beatmap       = this.cache.json.get(this.beatmapKey);
    this.nextNoteIndex = 0;
    this.notesGroup    = this.add.group();

    this.ended = false;
    this.totalNotas = this.beatmap.length;
    this.pontuacaoMaxima = this.totalNotas * 100;
    this.finalizeTimer = null;

    this.spawnNote = (col, noteData) => {
      let rect = this.add.rectangle(this.columnsX[col], 0, w * 0.07, h * 0.04, 0xffffff, 1).setOrigin(0.5);
      rect.col = col;
      this.notesGroup.add(rect);

      const timeToHit = ((noteData.time - this.getCurrentTime()) * 1000) / this.speed;
      const timeToMiss = timeToHit + 300;
      this.tweens.add({
        targets: rect,
        y: this.hitZoneY + 100,
        duration: timeToMiss,
        ease: 'Linear',
        onComplete: () => {
          if (rect.active) {
            rect.destroy();
            this.resetCombo();
          }
        }
      });
      return rect;
    };

    this.track   = this.sound.add(this.songKey);
    this.started = false;
    this.ready   = false;

    const startBtn = this.add.text(cx, h * 0.5, 'COMEÇAR', { fontSize: '28px', color: '#fff', backgroundColor: '#222', padding: { left: 15, right: 15, top: 10, bottom: 10 } })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        if (this.started) return;
        this.started = true;
        startBtn.destroy();
        this.iniciarContagemRegressiva();
      });

    this.input.keyboard.on('keydown-ESC', () => {
      this.track.stop();
      this.scene.start('MenuScene');
    });
  }
  getCurrentTime() {
    return this.sound.context.currentTime - this.songStartTime;
  }
  getRecordKey() {
    return `recorde_${this.nomeJogador}_${this.songKey}`;
  }
  getBestScore() {
    return Number(localStorage.getItem(this.getRecordKey()) || 0);
  }
  setBestScore(score) {
    localStorage.setItem(this.getRecordKey(), score);
  }
  iniciarContagemRegressiva() {
    const cx = this.scale.width / 2, cy = this.scale.height / 2;
    const countText = this.add.text(cx, cy, '', { fontSize: '80px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

    let count = 3;
    this.ready = false;
    const tick = () => {
      if (count > 0) {
        countText.setText(count);
        count--;
        this.time.delayedCall(800, tick);
      } else {
        countText.setText("VAI!");
        this.time.delayedCall(650, () => {
          countText.destroy();
          this.somenteAgoraComeca();
        });
      }
    };
    tick();
  }
  somenteAgoraComeca() {
    this.sound.context.resume().then(() => {
      this.songStartTime = this.sound.context.currentTime;
      this.track.play();
      this.ready = true;
    });
  }
  update() {
    if (!this.started || !this.ready || this.ended) return;

    const currentTime = this.getCurrentTime();

    while (
      this.nextNoteIndex < this.beatmap.length &&
      this.beatmap[this.nextNoteIndex].time <= currentTime + 1.5
    ) {
      const noteData = this.beatmap[this.nextNoteIndex];
      this.spawnNote(noteData.col, noteData);
      this.nextNoteIndex++;
    }

    ['A','S','D','F'].forEach((k,i) => {
      if (Phaser.Input.Keyboard.JustDown(this.keys[k])) {
        this.processHit(i);
      }
    });

    // Checa se acabou tudo e inicia o timer de 3 segundos
    if (!this.ended && this.nextNoteIndex >= this.totalNotas && this.notesGroup.countActive(true) === 0) {
      if (!this.finalizeTimer) {
        this.finalizeTimer = this.time.delayedCall(3000, () => {
          this.showEndMessage();
        });
      }
    }
  }
  processHit(colIndex) {
    const notes = this.notesGroup.getChildren().filter(n => n.col === colIndex);
    if (!notes.length) {
      this.showFeedback('MISS', '#f44');
      return this.resetCombo();
    }
    notes.sort((a,b) => Math.abs(a.y - this.hitZoneY) - Math.abs(b.y - this.hitZoneY));
    const note = notes[0];
    const dy   = Math.abs(note.y - this.hitZoneY);

    let result, pts, clr;
    if (dy < 30)      { result='PERFECT'; pts=100; clr='#0ff'; }
    else if (dy < 60) { result='GOOD';    pts=50;  clr='#ffd700'; }
    else              { this.showFeedback('MISS','#f44'); return this.resetCombo(); }

    this.showFeedback(result, clr);
    this.score   += pts;
    this.combo   += 1;
    this.scoreText.setText('PONTOS: ' + this.score);
    this.comboText.setText('COMBO: ' + this.combo);
    note.destroy();
    this.showHitEffect(colIndex, result === 'PERFECT' ? 0x00ff88 : 0xffff00);
  }
  resetCombo() {
    this.combo = 0;
    this.comboText.setText('COMBO: ' + this.combo);
  }
  showHitEffect(col, color = 0x00ffff) {
    const w = this.scale.width, h = this.scale.height;
    let x = this.columnsX[col], y = this.hitZoneY;
    let circle = this.add.circle(x, y, h * 0.032, color, 0.5).setDepth(99);
    this.tweens.add({
      targets: circle,
      scale: 1.7,
      alpha: 0,
      duration: 330,
      ease: 'Cubic.easeOut',
      onComplete: () => circle.destroy()
    });
  }
  showEndMessage() {
    this.ended = true;
    this.track.stop();

    // Calcula percentual de pontuação
    const perc = Math.round((this.score / this.pontuacaoMaxima) * 100);

    let msg = '';
    if (perc === 100) msg = 'PERFEITO! Você acertou tudo!';
    else if (perc > 80) msg = 'Mandou MUITO bem!';
    else if (perc >= 50) msg = 'Dá pra melhorar! Tente de novo!';
    else msg = 'Precisa treinar mais!';

    // Salvar melhor pontuação
    let bestScore = this.getBestScore();
    let isRecorde = false;
    if (this.score > bestScore) {
      this.setBestScore(this.score);
      bestScore = this.score;
      isRecorde = true;
    }

    this.feedbackText.setAlpha(0);

    const cx = this.scale.width/2, cy = this.scale.height/2;
    this.add.text(cx, cy-100, `JOGADOR: ${this.nomeJogador}`, {
      fontSize: '26px', color: '#aaa'
    }).setOrigin(0.5);

    this.add.text(cx, cy-60, `Pontuação: ${this.score} pts`, {
      fontSize: '32px', color: '#fff'
    }).setOrigin(0.5);
    
    this.add.text(cx, cy-20, isRecorde ? `NOVO RECORDE! 🎉` : `Melhor: ${bestScore} pts`, {
      fontSize: '24px', color: isRecorde ? '#00ff00' : '#ffd700'
    }).setOrigin(0.5);

    this.add.text(cx, cy+20, `${msg}`, {
      fontSize: '32px', color: '#ffd700'
    }).setOrigin(0.5);

    // Botão Tente Novamente
    let btnReplay = this.add.text(cx, cy+80, 'Tente novamente', {
      fontSize: '26px', color: '#fff', backgroundColor: '#337', padding: { left: 16, right: 16, top: 8, bottom: 8 }
    }).setOrigin(0.5).setInteractive();

    btnReplay.on('pointerdown', () => {
      this.scene.restart({
        songKey: this.songKey,
        beatmapKey: this.beatmapKey,
        speed: this.speed,
        nomeJogador: this.nomeJogador
      });
    });

    // Botão Voltar ao Menu
    let btnMenu = this.add.text(cx, cy+130, 'Voltar ao menu', {
      fontSize: '22px', color: '#fff', backgroundColor: '#444', padding: { left: 14, right: 14, top: 7, bottom: 7 }
    }).setOrigin(0.5).setInteractive();

    btnMenu.on('pointerdown', () => this.scene.start('MenuScene'));

    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }
}

// ========== EDITOR DE BEATMAP ==========
class EditorScene extends Phaser.Scene {
  constructor() { super('EditorScene'); }
  init(data) {
    this.songKey = data.songKey;
    this.beatmapKey = data.beatmapKey;
  }
  create() {
    const w = this.scale.width, h = this.scale.height, cx = w / 2;
    const espacamento = (w * 0.75) / 3;
    const hitZoneW = w * 0.75;
    const hitZoneX = cx - hitZoneW / 2;

    this.columnsX = [];
    for (let i = 0; i < 4; i++) {
      this.columnsX.push(hitZoneX + i * espacamento);
    }
    this.hitZoneY = Math.floor(h * 0.92);

    this.notes = [];
    this.isPlaying = false;
    this.songStartTime = 0;
    this.track = this.sound.add(this.songKey);

    this.add.text(cx, 30, 'EDITOR DE BEATMAP', { fontSize: '22px', color: '#fff' }).setOrigin(0.5);
    this.add.text(cx, 70, 'A S D F = marca nota | ESPAÇO = Play/Pause | ESC = Menu', { fontSize: '14px', color: '#fff' }).setOrigin(0.5);
    this.statusText = this.add.text(cx, 110, 'Parado', { fontSize: '14px', color: '#fff' }).setOrigin(0.5);
    this.notesText = this.add.text(10, h - 20, '', { fontSize: '12px', color: '#fff' });

    // Barra de acerto MAIOR
    this.add.rectangle(hitZoneX, this.hitZoneY - 30, hitZoneW, 60, 0x888888).setOrigin(0, 0);
    // Linha horizontal
    this.add.line(
      cx, this.hitZoneY,
      -hitZoneW/2, 0,
       hitZoneW/2, 0,
      0xff0000
    ).setLineWidth(4);

    const teclas = ['A', 'S', 'D', 'F'];
    for (let i = 0; i < teclas.length; i++) {
      this.add.text(this.columnsX[i], this.hitZoneY + 50, teclas[i], { fontSize: '20px', color: '#fff' }).setOrigin(0.5, 0);
    }

    this.input.keyboard.on('keydown-ESC', () => {
      this.track.stop();
      this.scene.start('MenuScene');
    });
    this.input.keyboard.on('keydown-SPACE', () => {
      if (!this.isPlaying) {
        this.sound.context.resume();
        this.track.play();
        this.songStartTime = this.sound.context.currentTime;
        this.statusText.setText('Gravando...');
        this.isPlaying = true;
      } else {
        this.track.pause();
        this.statusText.setText('Pausado');
        this.isPlaying = false;
      }
    });
    this.input.keyboard.on('keydown-A', () => this.marcaNota(0));
    this.input.keyboard.on('keydown-S', () => this.marcaNota(1));
    this.input.keyboard.on('keydown-D', () => this.marcaNota(2));
    this.input.keyboard.on('keydown-F', () => this.marcaNota(3));

    this.copyBtn = this.add.text(w - 120, h - 34, '[COPIAR JSON]', { fontSize: '14px', color: '#0f0' })
      .setInteractive().on('pointerdown', () => this.copiarJson());
  }
  update() {
    if (this.isPlaying && this.track.isPlaying) {
      const t = this.sound.context.currentTime - this.songStartTime;
      this.statusText.setText('Gravando...  t=' + t.toFixed(2) + 's');
    }
    this.atualizaNotasTexto();
  }
  marcaNota(col) {
    if (!this.isPlaying || !this.track.isPlaying) return;
    const t = +(this.sound.context.currentTime - this.songStartTime).toFixed(3);
    this.notes.push({ time: t, col: col });
    this.add.rectangle(this.columnsX[col], this.hitZoneY, this.scale.width * 0.06, this.scale.height * 0.04, 0xffff00, 0.6)
      .setAlpha(0.8).setDepth(10).setScale(1).setOrigin(0.5);
    this.time.delayedCall(200, () => { this.children.getAt(this.children.length-1).destroy(); });
  }
  atualizaNotasTexto() {
    let txt = this.notes.length
      ? 'Notas marcadas:\n' + this.notes.map(n => `{ "time": ${n.time}, "col": ${n.col} }`).join(',\n')
      : 'Nenhuma nota marcada ainda.';
    this.notesText.setText(txt);
  }
  copiarJson() {
    const json = "[\n" + this.notes.map(n => `  { "time": ${n.time}, "col": ${n.col} }`).join(',\n') + "\n]";
    navigator.clipboard.writeText(json).then(() => {
      this.copyBtn.setText('[COPIADO!]');
      setTimeout(() => this.copyBtn.setText('[COPIAR JSON]'), 1200);
    });
  }
}

// ========== INICIALIZAÇÃO ==========
const gameConfig = {
  type: Phaser.AUTO,
  backgroundColor: '#222',
  scene: [PreloadScene, MenuScene, GameScene, EditorScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600
  },
  render: {
    antialias: true,
    pixelArt: false
  }
};
new Phaser.Game(gameConfig);
