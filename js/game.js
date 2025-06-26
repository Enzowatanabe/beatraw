// === Configuração Phaser ===
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2d2d2d',
  scene: { preload, create, update }
};
new Phaser.Game(config);

let columnsX, hitZoneY, perfectThres, goodThres;
let beatmap, nextNoteIndex;
let songStartTime, track;

function preload() {
  this.load.audio('musica1', 'assets/audio/musica1.mp3');
  this.load.json('bm1',    'assets/beatmaps/musica1.json');
}

function create() {
  // Parâmetros da hit-zone
  hitZoneY     = 550;
  perfectThres = 10;
  goodThres    = 30;

  // Desenha hit-zone
  const g = this.add.graphics();
  g.lineStyle(2, 0xff0000);
  g.strokeRect(100, hitZoneY - 15, 600, 30);

  // Colunas X e mapeamento de teclas
  columnsX = [200, 300, 400, 500];
  this.keys = this.input.keyboard.addKeys('A,S,D,F');

  // Score e combo
  this.score = 0;
  this.combo = 0;
  this.scoreText = this.add.text(10, 10, 'PONTOS: 0', { fontSize: '24px', color: '#fff' });
  this.comboText = this.add.text(10, 40, 'COMBO: 0', { fontSize: '24px', color: '#fff' });

  // Carrega beatmap e debug
  beatmap = this.cache.json.get('bm1');
  console.log('Beatmap carregado:', beatmap);
  nextNoteIndex = 0;

  // Prepara grupo de notas
  this.notesGroup = this.add.group();

  // Cria o objeto de áudio (mas não toca ainda)
  track = this.sound.add('musica1');

  // Aguarda um clique para desbloquear o AudioContext e iniciar a música
  this.input.once('pointerdown', () => {
    this.sound.context.resume().then(() => {
      songStartTime = this.sound.context.currentTime;
      track.play();
      console.log('Música iniciada, aguardando batidas…');
    });
  });
}

function update() {
  // Se ainda não clicou, não faz nada
  if (songStartTime === undefined) {
    return;
  }

  // Tempo desde o início da música
  const currentTime = this.sound.context.currentTime - songStartTime;
  console.log(`t=${currentTime.toFixed(2)}s  nextNoteIndex=${nextNoteIndex}`);

  // Spawn de notas baseado no beatmap
  while (nextNoteIndex < beatmap.length && beatmap[nextNoteIndex].time <= currentTime + 1.5) {
    const { time, col } = beatmap[nextNoteIndex++];
    const x = columnsX[col];
    const note = this.add.rectangle(x, 0, 50, 20, 0xffffff);
    note.col = col;
    this.notesGroup.add(note);

    this.tweens.add({
      targets: note,
      y: hitZoneY,
      duration: (time - currentTime) * 1000,
      ease: 'Linear',
      onComplete: () => note.destroy()
    });
  }

  // Checa input e julga acertos
  if (Phaser.Input.Keyboard.JustDown(this.keys.A)) handleHit.call(this, 0);
  if (Phaser.Input.Keyboard.JustDown(this.keys.S)) handleHit.call(this, 1);
  if (Phaser.Input.Keyboard.JustDown(this.keys.D)) handleHit.call(this, 2);
  if (Phaser.Input.Keyboard.JustDown(this.keys.F)) handleHit.call(this, 3);
}

function handleHit(colIndex) {
  const notes = this.notesGroup.getChildren().filter(n => n.col === colIndex);
  if (!notes.length) return miss.call(this);

  notes.sort((a, b) => Math.abs(a.y - hitZoneY) - Math.abs(b.y - hitZoneY));
  const note = notes[0];
  const dy = Math.abs(note.y - hitZoneY);

  let result, points;
  if (dy < perfectThres)      { result = 'Perfect'; points = 100; }
  else if (dy < goodThres)    { result = 'Good';    points = 50; }
  else                         { return miss.call(this); }

  console.log(`${result} (dy=${dy.toFixed(1)})`);
  this.score += points;
  this.combo += 1;
  this.scoreText.setText('PONTOS: ' + this.score);
  this.comboText.setText('COMBO: ' + this.combo);
  note.destroy();
}

function miss() {
  console.log('Miss');
  this.combo = 0;
  this.comboText.setText('COMBO: ' + this.combo);
}
