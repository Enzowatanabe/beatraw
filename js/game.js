// === Configuração Phaser ===
const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#2d2d2d',
  scene: { preload, create, update }
};

new Phaser.Game(config);

let columnsX;         // posições X fixas para A,S,D,F
let hitZoneY;         // Y da hit-zone
let perfectThres;     // limiar em px para Perfect
let goodThres;        // limiar em px para Good

function preload() {
  // nenhum asset ainda
}

function create() {
  // 1) Hit-zone (área de acerto)
  hitZoneY = 550;
  const graphics = this.add.graphics();
  graphics.lineStyle(2, 0xff0000);
  graphics.strokeRect(100, hitZoneY - 15, 600, 30);

  // 2) Colunas e teclas
  columnsX = [200, 300, 400, 500];
  this.keys = this.input.keyboard.addKeys('A,S,D,F');

  // 3) Parâmetros de julgamento
  perfectThres = 10;   // <10px → Perfect
  goodThres    = 30;   // <30px → Good

  // 4) Score e combo
  this.score = 0;
  this.combo = 0;
  this.scoreText = this.add.text(10, 10, 'PONTOS: 0', { fontSize: '24px', color: '#fff' });
  this.comboText = this.add.text(10, 40, 'COMBO: 0', { fontSize: '24px', color: '#fff' });

  console.log('Game iniciado — aperte A, S, D ou F');

  // 5) Grupo de notas
  this.notesGroup = this.add.group();

  // 6) Spawn de notas a cada 2s
  this.time.addEvent({
    delay: 2000,
    callback: spawnNote,
    callbackScope: this,
    loop: true
  });
}

function update() {
  // Ao apertar cada tecla, chama handleHit() com o índice da coluna
  if (Phaser.Input.Keyboard.JustDown(this.keys.A)) handleHit.call(this, 0);
  if (Phaser.Input.Keyboard.JustDown(this.keys.S)) handleHit.call(this, 1);
  if (Phaser.Input.Keyboard.JustDown(this.keys.D)) handleHit.call(this, 2);
  if (Phaser.Input.Keyboard.JustDown(this.keys.F)) handleHit.call(this, 3);
}

// Cria e anima cada nota em uma coluna aleatória
function spawnNote() {
  const col = Phaser.Math.Between(0, 3);
  const x = columnsX[col];
  const note = this.add.rectangle(x, 0, 50, 20, 0xffffff);
  note.col = col;  // guarda a coluna
  this.notesGroup.add(note);

  this.tweens.add({
    targets: note,
    y: hitZoneY,
    duration: 3000,
    ease: 'Linear',
    onComplete: () => note.destroy()
  });
}

// Lógica de detecção de acerto
function handleHit(colIndex) {
  const notes = this.notesGroup.getChildren()
    .filter(n => n.col === colIndex);

  if (!notes.length) {
    console.log('Miss (nenhuma nota)');
    this.combo = 0;
    this.comboText.setText('COMBO: ' + this.combo);
    return;
  }

  // Encontra a nota mais próxima da hit-zone
  notes.sort((a, b) => Math.abs(a.y - hitZoneY) - Math.abs(b.y - hitZoneY));
  const note = notes[0];
  const dy = Math.abs(note.y - hitZoneY);

  let result, points;
  if (dy < perfectThres) {
    result = 'Perfect';
    points = 100;
  } else if (dy < goodThres) {
    result = 'Good';
    points = 50;
  } else {
    result = 'Miss';
    points = 0;
  }

  console.log(result + ` (dy=${dy.toFixed(1)})`);

  // Atualiza score e combo
  if (points > 0) {
    this.score += points;
    this.combo += 1;
  } else {
    this.combo = 0;
  }

  this.scoreText.setText('PONTOS: ' + this.score);
  this.comboText.setText('COMBO: ' + this.combo);

  // Destrói a nota, seja hit ou miss distante
  note.destroy();
}
