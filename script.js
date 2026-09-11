/* =========================================================
   THE INTERNET COURT
   Full Game Script
========================================================= */


/* ================= HELPERS ================= */

const $ = id => document.getElementById(id);

const clamp = (num, min, max) =>
  Math.max(min, Math.min(max, num));


/* ================= STATE ================= */

const state = {

  severity: 55,

  crime: "",

  caseNo: 2841,

  sound: true,

  playerHP: 100,

  bossHP: 100,

  bossMaxHP: 100,

  shots: 0,

  hits: 0,

  gameRunning: false,

  gameWon: false,

  keys: {},

  playerX: 100,

  playerY: 250,

  bossX: 0,

  bossY: 250,

  bullets: [],

  enemyBullets: [],

  powerups: [],

  history: JSON.parse(
    localStorage.getItem("internetCourtHistory") || "[]"
  )

};


/* ================= AUDIO ================= */

let audioCtx = null;

function playTone(type) {

  if (!state.sound) return;

  try {

    audioCtx ||= new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

    const sounds = {

      shoot: [180, .045, "square"],

      hit: [90, .08, "sawtooth"],

      damage: [55, .12, "square"],

      enemy: [110, .06, "triangle"],

      power: [520, .12, "sine"],

      rage: [45, .25, "sawtooth"],

      win: [700, .2, "sine"],

      lose: [70, .3, "sawtooth"]

    };

    const sound =
      sounds[type] ||
      [220, .05, "sine"];

    const osc =
      audioCtx.createOscillator();

    const gain =
      audioCtx.createGain();

    osc.frequency.value = sound[0];

    osc.type = sound[2];

    gain.gain.setValueAtTime(
      sound[1],
      audioCtx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      .001,
      audioCtx.currentTime + .16
    );

    osc.connect(gain);

    gain.connect(audioCtx.destination);

    osc.start();

    osc.stop(
      audioCtx.currentTime + .17
    );

  } catch (error) {}

}


/* ================= TOAST ================= */

function toast(text) {

  const element = $("toast");

  if (!element) return;

  element.textContent = text;

  element.classList.add("show");

  clearTimeout(element._timer);

  element._timer =
    setTimeout(
      () => element.classList.remove("show"),
      2600
    );

}


/* ================= SCREENS ================= */

function showScreen(id) {

  document
    .querySelectorAll(".screen")
    .forEach(screen =>
      screen.classList.remove("active")
    );

  $(id).classList.add("active");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* ================= EXAMPLES ================= */

const examples = [

  "I ate my friend's fries without asking.",

  "I left someone on read for three days.",

  "I lied about finishing my homework.",

  "I stole the last cookie.",

  "I accidentally broke something.",

  "I shared a secret I shouldn't have."

];


function loadExamples() {

  const row = $("exampleRow");

  if (!row) return;

  row.innerHTML = "";

  examples.forEach(example => {

    const button =
      document.createElement("button");

    button.className =
      "example-chip";

    button.textContent =
      example;

    button.addEventListener(
      "click",
      () => {

        $("crimeInput").value =
          example;

        updateLiveSeverity();

        $("crimeInput").focus();

      }
    );

    row.appendChild(button);

  });

}


/* ================= SEVERITY ================= */

function judgeCrime(text) {

  const t =
    text.toLowerCase().trim();

  let score = 5;


  /* FOOD */

  if (
    /\b(fries|snack|food|pizza|dessert|cookie|cake)\b/
      .test(t)
  ) score += 14;


  /* IGNORING */

  if (
    /\b(late|ignored|ignore|reply|replied|message|notification|ghost|ghosted)\b/
      .test(t) ||
    t.includes("left me on read") ||
    t.includes("left them on read")
  ) score += 16;


  /* LYING */

  if (
    /\b(lie|lied|lying|cheat|cheated|cheating|fake)\b/
      .test(t)
  ) score += 28;


  /* STEALING */

  if (
    /\b(steal|stole|stolen|rob|robbed)\b/.test(t) ||
    t.includes("take without")
  ) score += 38;


  /* SCHOOL */

  if (
    /\b(assignment|homework|exam|test|plagiar|copy)\b/
      .test(t) ||
    t.includes("cheated on exam")
  ) score += 30;


  /* PRIVACY */

  if (
    /\b(secret|screenshot|leak|expose|shared private)\b/
      .test(t)
  ) score += 22;


  /* DAMAGE */

  if (
    /\b(break|broke|damage|destroy|smash)\b/
      .test(t)
  ) score += 35;


  /* SERIOUS WORDS */

  if (
    /\b(threaten|threatened|attack|attacked|assault)\b/
      .test(t)
  ) score += 48;


  /*
     NOTE:
     We deliberately keep the game fictional
     and avoid graphic descriptions.
  */

  if (
    /\b(kill|killed|murder|murdered|weapon)\b/
      .test(t)
  ) score += 78;


  if (
    /\b(kidnap|kidnapped|hostage)\b/
      .test(t)
  ) score += 78;


  if (
    /\b(arson|burned down)\b/.test(t) ||
    t.includes("set fire")
  ) score += 78;


  /* SCHOOL CONTEXT */

  if (
    /\b(school|class|college)\b/
      .test(t)
  ) score += 5;


  /* EXTRA DRAMA */

  if (
    t.includes("whole season") ||
    t.includes("all night") ||
    t.includes("47 unread") ||
    t.includes("100 unread")
  ) score += 12;


  /* ACCIDENT */

  if (
    t.includes("accidentally") ||
    t.includes("by accident") ||
    t.includes("didn't mean to") ||
    t.includes("did not mean to")
  ) score -= 12;


  /* APOLOGY */

  if (
    /\b(sorry|apologized|apologise)\b/
      .test(t)
  ) score -= 5;


  /* LONG CONFESSION */

  if (t.length > 110)
    score += 8;


  /* FICTION */

  if (
    /\b(fictional|joke|roleplay|game|minecraft|gta)\b/
      .test(t)
  ) score -= 10;


  return clamp(score, 5, 100);

}


function severityInfo(value) {

  if (value <= 20)
    return "😇 Basically innocent";

  if (value <= 40)
    return "😐 Mildly questionable";

  if (value <= 60)
    return "🤨 Questionable";

  if (value <= 70)
    return "⚠️ Suspicious";

  if (value <= 85)
    return "🚨 Very suspicious";

  return "💀 BOSS LEVEL";

}


/* ================= LIVE METER ================= */

function updateLiveSeverity() {

  const text =
    $("crimeInput").value.trim();

  const value =
    text ? judgeCrime(text) : 55;

  $("liveSeverityValue")
    .textContent =
    value + "/100";

  $("liveSeverityFill")
    .style.width =
    value + "%";

  $("liveSeverityLabel")
    .textContent =
    severityInfo(value);


  if (!text) {

    $("liveSeverityHint")
      .textContent =
      "Type your confession...";

  }

  else if (value > 85) {

    $("liveSeverityHint")
      .textContent =
      "💀 BOSS BATTLE UNLOCKED";

  }

  else if (value > 70) {

    $("liveSeverityHint")
      .textContent =
      "😡 The Judge is getting angry...";

  }

  else if (value > 50) {

    $("liveSeverityHint")
      .textContent =
      "😐 The court is suspicious...";

  }

  else {

    $("liveSeverityHint")
      .textContent =
      "😇 You're probably fine...";

  }


  /*
     IMPORTANT:
     Do NOT use generic "warning" or "danger"
     classes here because the game already has
     a .warning class for its visual warning text.
  */

  $("liveSeverityFill")
    .classList.toggle(
      "severity-danger",
      value > 80
    );

  $("liveSeverityFill")
    .classList.toggle(
      "severity-warning",
      value > 60 && value <= 80
    );

}


/* ================= JUDGES ================= */

const judges = [

  {
    name: "THE HONORABLE JUDGE",
    avatar: "🧑‍⚖️",
    line: "I have seen worse. Probably."
  },

  {
    name: "JUDGE SIDE-EYE",
    avatar: "👩‍⚖️",
    line: "You really thought nobody would notice?"
  },

  {
    name: "JUDGE BRUH",
    avatar: "🧑‍⚖️",
    line: "Bro... explain yourself."
  },

  {
    name: "JUDGE CHAOS",
    avatar: "⚖️",
    line: "Interesting confession. Very interesting."
  }

];


/* ================= TRIAL ================= */

function openTrial() {

  state.crime =
    $("crimeInput").value.trim();

  if (!state.crime) {

    toast(
      "⚠️ You need to confess something first."
    );

    $("crimeInput").focus();

    return;

  }


  state.severity =
    judgeCrime(state.crime);


  $("caseNumber")
    .textContent =
    "#" + (state.caseNo + 1);

  $("crimeDisplay")
    .textContent =
    `"${state.crime}"`;

  $("trialSeverity")
    .textContent =
    state.severity + "/100";

  $("severityBadge")
    .textContent =
    "⚖️ " + state.severity + "/100";

  $("severityMeterFill")
    .style.width =
    state.severity + "%";


  const judge =
    judges[
      Math.floor(
        Math.random() *
        judges.length
      )
    ];

  $("judgeName")
    .textContent =
    judge.name;

  $("judgeAvatar")
    .textContent =
    judge.avatar;

  $("judgeLine")
    .textContent =
    `"${judge.line}"`;


  createEvidence();

  createRuling();

  showScreen("trialScreen");

}


/* ================= EVIDENCE ================= */

function createEvidence() {

  const evidence = [

    "The defendant's own confession.",

    "The Internet Court's extremely questionable algorithm.",

    "A suspicious amount of evidence."

  ];

  $("evidence1")
    .textContent =
    evidence[0];

  $("evidence2")
    .textContent =
    evidence[1];

  $("evidence3")
    .textContent =
    evidence[2];

}


/* ================= RULING ================= */

function createRuling() {

  const value =
    state.severity;


  if (value <= 30) {

    $("rulingTitle")
      .textContent =
      "JUDGE'S RULING";

    $("rulingText")
      .textContent =
      "Honestly? This is barely a crime. The court is disappointed, not furious.";

    $("courtThought")
      .textContent =
      "The judge is trying very hard to look serious.";

  }

  else if (value <= 60) {

    $("rulingTitle")
      .textContent =
      "JUDGE'S RULING";

    $("rulingText")
      .textContent =
      "Suspicious behaviour detected. The court would like an explanation.";

    $("courtThought")
      .textContent =
      "The judge has raised one eyebrow.";

  }

  else if (value <= 85) {

    $("rulingTitle")
      .textContent =
      "JUDGE'S RULING";

    $("rulingText")
      .textContent =
      "This confession has officially crossed into questionable territory.";

    $("courtThought")
      .textContent =
      "The court is becoming increasingly concerned.";

  }

  else {

    $("rulingTitle")
      .textContent =
      "🚨 EXTREME RULING";

    $("rulingText")
      .textContent =
      "THE COURT HAS HAD ENOUGH. PREPARE FOR THE BOSS BATTLE.";

    $("courtThought")
      .textContent =
      "The judge has stood up. This is not good.";

  }

}


/* ================= BOSS PROFILE ================= */

function getBossProfile() {

  if (state.severity >= 86) {

    return {
      name: "SUPREME JUDGE",
      hp: 220,
      emoji: "🧑‍⚖️"
    };

  }

  if (state.severity >= 71) {

    return {
      name: "ANGRY JUDGE",
      hp: 170,
      emoji: "😡⚖️"
    };

  }

  return {
    name: "JUDGE",
    hp: 120,
    emoji: "🧑‍⚖️"
  };

}


/* ================= START GAME ================= */

function startGame() {

  const boss =
    getBossProfile();

  state.playerHP = 100;

  state.bossMaxHP =
    boss.hp;

  state.bossHP =
    boss.hp;

  state.shots = 0;

  state.hits = 0;

  state.gameRunning = true;

  state.gameWon = false;

  state.bullets = [];

  state.enemyBullets = [];

  state.powerups = [];

  state.playerX = 100;

  state.playerY = 250;

  state.bossX = 0;

  state.bossY = 250;


  $("bossLabel")
    .textContent =
    boss.name;

  $("boss")
    .textContent =
    boss.emoji;

  $("bossDialogue")
    .textContent =
    state.severity >= 86
      ? "YOU SHOULD HAVE STOPPED AT 80. 😡"
      : "THE COURT IS NOW IN SESSION.";


  $("phaseLabel")
    .textContent =
    "ROUND 1";

  $("comboLabel")
    .textContent =
    "0 HITS";


  showScreen("gameScreen");

  updateBars();

  gameLoop();

  enemyLoop();

  powerupLoop();

}


/* ================= BOSS VISUAL ================= */

function updateBossVisual() {

  const ratio =
    state.bossHP /
    state.bossMaxHP;

  const boss =
    $("boss");


  boss.classList.toggle(
    "rage",
    ratio <= .5
  );

  boss.classList.toggle(
    "low-hp",
    ratio <= .3
  );


  if (ratio <= .2) {

    boss.textContent =
      "🤬⚖️";

    $("bossDialogue")
      .textContent =
      "🤬 OBJECTION! YOU ARE ANNOYING ME!";

    playTone("rage");

  }

  else if (ratio <= .5) {

    boss.textContent =
      "😡⚖️";

    $("bossDialogue")
      .textContent =
      "😡 THE COURT IS GETTING ANGRY!";

  }

  else {

    boss.textContent =
      getBossProfile().emoji;

  }

}


/* ================= BARS ================= */

function updateBars() {

  const playerRatio =
    state.playerHP / 100;

  const bossRatio =
    state.bossHP /
    state.bossMaxHP;


  $("playerHpBar")
    .style.width =
    clamp(playerRatio * 100, 0, 100) + "%";

  $("bossHpBar")
    .style.width =
    clamp(bossRatio * 100, 0, 100) + "%";


  $("playerHpText")
    .textContent =
    Math.max(0, Math.round(state.playerHP))
    + " HP";


  $("bossHpText")
    .textContent =
    Math.max(0, Math.round(state.bossHP))
    + " HP";


  $("comboLabel")
    .textContent =
    state.hits + " HITS";


  updateBossVisual();


  if (state.severity >= 86) {

    if (bossRatio <= .5) {

      $("phaseLabel")
        .textContent =
        "⚠️ FINAL PHASE";

    }

  }

}


/* ================= SHOOTING ================= */

function shoot() {

  if (!state.gameRunning)
    return;


  const bullet =
    document.createElement("div");

  bullet.className =
    "projectile";


  bullet.style.left =
    state.playerX + 55 + "px";

  bullet.style.top =
    state.playerY + 30 + "px";


  $("projectiles")
    .appendChild(bullet);


  state.bullets.push({

    el: bullet,

    x: state.playerX + 55,

    y: state.playerY + 30

  });


  state.shots++;

  playTone("shoot");

}


/* ================= ENEMY SHOOT ================= */

function enemyShoot() {

  if (!state.gameRunning)
    return;


  const arena =
    $("arena");


  const bullet =
    document.createElement("div");

  bullet.className =
    "projectile enemy-projectile";


  const startX =
    arena.clientWidth - 130;

  const startY =
    state.bossY + 30;


  /*
     AIM AT PLAYER
     Instead of always moving horizontally,
     calculate a direction from the boss
     to the player's current position.
  */

  const targetX =
    state.playerX + 25;

  const targetY =
    state.playerY + 30;


  const dx =
    targetX - startX;

  const dy =
    targetY - startY;


  const distance =
    Math.sqrt(
      dx * dx +
      dy * dy
    ) || 1;


  const speed = 7;


  const vx =
    (dx / distance) * speed;

  const vy =
    (dy / distance) * speed;


  bullet.style.left =
    startX + "px";

  bullet.style.top =
    startY + "px";


  $("projectiles")
    .appendChild(bullet);


  state.enemyBullets.push({

    el: bullet,

    x: startX,

    y: startY,

    vx: vx,

    vy: vy

  });


  playTone("enemy");

}


/* ================= DAMAGE NUMBER ================= */

function damageNumber(
  x,
  y,
  amount
) {

  const element =
    document.createElement("div");

  element.className =
    "damage-number";

  element.textContent =
    "-" + amount;

  element.style.left =
    x + "px";

  element.style.top =
    y + "px";


  $("damageLayer")
    .appendChild(element);


  setTimeout(
    () => element.remove(),
    700
  );

}


/* ================= GAME LOOP ================= */

function gameLoop() {

  if (!state.gameRunning)
    return;


  movePlayer();

  moveBullets();

  moveEnemyBullets();

  updateBars();

  checkGameEnd();


  requestAnimationFrame(
    gameLoop
  );

}


/* ================= PLAYER MOVEMENT ================= */

function movePlayer() {

  const arena =
    $("arena");


  const speed = 5;


  if (
    state.keys["w"] ||
    state.keys["arrowup"]
  ) {

    state.playerY -= speed;

  }


  if (
    state.keys["s"] ||
    state.keys["arrowdown"]
  ) {

    state.playerY += speed;

  }


  if (
    state.keys["a"] ||
    state.keys["arrowleft"]
  ) {

    state.playerX -= speed;

  }


  if (
    state.keys["d"] ||
    state.keys["arrowright"]
  ) {

    state.playerX += speed;

  }


  state.playerX =
    clamp(
      state.playerX,
      10,
      arena.clientWidth - 90
    );


  state.playerY =
    clamp(
      state.playerY,
      120,
      arena.clientHeight - 100
    );


  $("player").style.left =
    state.playerX + "px";

  $("player").style.top =
    state.playerY + "px";

}


/* ================= BULLETS ================= */

function moveBullets() {

  const arena =
    $("arena");


  state.bullets.forEach(
    bullet => {

      bullet.x += 10;

      bullet.el.style.left =
        bullet.x + "px";


      const bossX =
        arena.clientWidth - 130;


      const bossY =
        state.bossY;


      if (
        Math.abs(bullet.x - bossX) < 50 &&
        Math.abs(bullet.y - bossY) < 60
      ) {

        const damage =
          state.severity >= 86
            ? 9
            : 12;


        state.bossHP -=
          damage;

        state.hits++;


        damageNumber(
          bossX,
          bossY,
          damage
        );


        bullet.el.remove();

        state.bullets =
          state.bullets.filter(
            b => b !== bullet
          );


        playTone("hit");

      }


      if (
        bullet.x >
        arena.clientWidth
      ) {

        bullet.el.remove();

        state.bullets =
          state.bullets.filter(
            b => b !== bullet
          );

      }

    }
  );

}


/* ================= ENEMY BULLETS ================= */

function moveEnemyBullets() {

  state.enemyBullets.forEach(
    bullet => {

      /*
         Move using the calculated X/Y
         velocity so the projectile actually
         travels toward the player.
      */

      bullet.x += bullet.vx;

      bullet.y += bullet.vy;


      bullet.el.style.left =
        bullet.x + "px";

      bullet.el.style.top =
        bullet.y + "px";


      if (
        Math.abs(
          bullet.x - state.playerX
        ) < 40 &&
        Math.abs(
          bullet.y - state.playerY
        ) < 60
      ) {

        state.playerHP -= 8;


        damageNumber(
          state.playerX,
          state.playerY,
          8
        );


        bullet.el.remove();

        state.enemyBullets =
          state.enemyBullets.filter(
            b => b !== bullet
          );


        playTone("damage");

      }


      if (
        bullet.x < -50 ||
        bullet.x > $("arena").clientWidth + 50 ||
        bullet.y < 80 ||
        bullet.y > $("arena").clientHeight + 50
      ) {

        bullet.el.remove();

        state.enemyBullets =
          state.enemyBullets.filter(
            b => b !== bullet
          );

      }

    }
  );

}


/* ================= ENEMY LOOP ================= */

function enemyLoop() {

  if (!state.gameRunning)
    return;


  enemyShoot();


  const delay =
    state.bossHP /
    state.bossMaxHP <= .5
      ? 700
      : 1200;


  setTimeout(
    enemyLoop,
    delay
  );

}


/* ================= POWERUPS ================= */

function powerupLoop() {

  if (!state.gameRunning)
    return;


  if (
    Math.random() < .4
  ) {

    spawnPowerup();

  }


  setTimeout(
    powerupLoop,
    4500
  );

}


function spawnPowerup() {

  const arena =
    $("arena");


  const power =
    document.createElement("div");

  power.className =
    "powerup";

  power.textContent =
    "⚡";


  const x =
    Math.random() *
    (arena.clientWidth - 80);

  const y =
    150 +
    Math.random() *
    (arena.clientHeight - 220);


  power.style.left =
    x + "px";

  power.style.top =
    y + "px";


  $("powerups")
    .appendChild(power);


  state.powerups.push({
    el: power,
    x,
    y
  });


  playTone("power");

}


/* ================= GAME END ================= */

function checkGameEnd() {

  if (
    state.bossHP <= 0
  ) {

    endGame(true);

    return;

  }


  if (
    state.playerHP <= 0
  ) {

    endGame(false);

  }

}


function endGame(won) {

  if (!state.gameRunning)
    return;


  state.gameRunning = false;

  state.gameWon = won;


  playTone(
    won ? "win" : "lose"
  );


  saveCase(won);

  showResult(won);

}


/* ================= RESULT ================= */

function showResult(won) {

  showScreen("resultScreen");


  if (won) {

    $("resultIcon")
      .textContent =
      "🏆";

    $("verdictTitle")
      .textContent =
      "NOT GUILTY";

    $("verdictText")
      .textContent =
      "Against all odds, you defeated the court. The Internet Court officially has no idea what just happened.";

    $("xpValue")
      .textContent =
      "+" +
      (500 + state.severity * 5);

    $("achievementBox")
      .innerHTML =
      "🏆 <span>Achievement unlocked: COURTROOM MENACE</span>";

  }

  else {

    $("resultIcon")
      .textContent =
      "💀";

    $("verdictTitle")
      .textContent =
      "GUILTY";

    $("verdictText")
      .textContent =
      "The judge has defeated you. The court recommends reconsidering your questionable decisions.";

    $("xpValue")
      .textContent =
      "+100";

    $("achievementBox")
      .innerHTML =
      "📜 <span>Achievement unlocked: Sent to Court</span>";

  }


  const accuracy =
    state.shots > 0
      ? Math.round(
          state.hits /
          state.shots *
          100
        )
      : 0;


  $("accuracyValue")
    .textContent =
    accuracy + "%";


  $("severityResult")
    .textContent =
    state.severity;

}


/* ================= HISTORY ================= */

function saveCase(won) {

  state.caseNo++;


  const item = {

    caseNo:
      state.caseNo,

    crime:
      state.crime,

    severity:
      state.severity,

    result:
      won
        ? "NOT GUILTY"
        : "GUILTY",

    date:
      new Date().toLocaleString()

  };


  state.history.unshift(item);

  state.history =
    state.history.slice(0, 20);


  localStorage.setItem(
    "internetCourtHistory",
    JSON.stringify(
      state.history
    )
  );

}


function renderHistory() {

  const list =
    $("historyList");


  if (!state.history.length) {

    list.innerHTML =
      `<p style="color:#777">
        No cases yet. Your questionable decisions are currently undocumented.
      </p>`;

    return;

  }


  list.innerHTML =
    state.history.map(
      item => `

        <div class="history-item">

          <b>
            CASE #${item.caseNo}
          </b>

          <span>
            "${escapeHtml(item.crime)}"
          </span>

          <small>
            Severity: ${item.severity}/100
            • ${item.result}
            <br>
            ${item.date}
          </small>

        </div>

      `
    ).join("");

}


function escapeHtml(text) {

  return text
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


/* ================= HISTORY DRAWER ================= */

function openHistory() {

  renderHistory();

  $("historyDrawer")
    .classList.add("open");

  $("drawerBackdrop")
    .classList.add("show");

}


function closeHistory() {

  $("historyDrawer")
    .classList.remove("open");

  $("drawerBackdrop")
    .classList.remove("show");

}


/* ================= NEW CASE ================= */

function newCase() {

  state.gameRunning = false;

  state.crime = "";

  state.severity = 55;

  $("crimeInput")
    .value = "";

  updateLiveSeverity();

  $("previewCase")
    .textContent =
    "#" + (state.caseNo + 1);

  showScreen("homeScreen");

}


/* ================= SOUND ================= */

function toggleSound() {

  state.sound =
    !state.sound;


  $("soundToggle")
    .textContent =
    state.sound
      ? "🔊 Sound On"
      : "🔇 Sound Off";

}


/* ================= EVENTS ================= */

$("crimeInput")
  .addEventListener(
    "input",
    updateLiveSeverity
  );


$("submitCrime")
  .addEventListener(
    "click",
    openTrial
  );


$("trialAction")
  .addEventListener(
    "click",
    () => {

      if (
        state.severity <= 30
      ) {

        state.gameRunning =
          false;

        saveCase(true);

        showResult(true);

      }

      else {

        startGame();

      }

    }
  );


$("newCase")
  .addEventListener(
    "click",
    newCase
  );


$("soundToggle")
  .addEventListener(
    "click",
    toggleSound
  );


$("historyOpen")
  .addEventListener(
    "click",
    openHistory
  );


$("historyResult")
  .addEventListener(
    "click",
    openHistory
  );


$("historyClose")
  .addEventListener(
    "click",
    closeHistory
  );


$("drawerBackdrop")
  .addEventListener(
    "click",
    closeHistory
  );


$("brandHome")
  .addEventListener(
    "click",
    () => {

      state.gameRunning =
        false;

      showScreen("homeScreen");

    }
  );


/* ================= KEYBOARD ================= */

document.addEventListener(
  "keydown",
  event => {

    const target =
      event.target;


    /*
      IMPORTANT:
      Text boxes get normal keyboard behaviour.
      This allows spaces and normal typing.
    */

    const typing =
      target &&
      (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );


    if (typing)
      return;


    const key =
      event.key.toLowerCase();


    /*
      WASD + ARROW KEYS
    */

    if (
      key === "w" ||
      key === "a" ||
      key === "s" ||
      key === "d" ||
      key === "arrowup" ||
      key === "arrowdown" ||
      key === "arrowleft" ||
      key === "arrowright"
    ) {

      event.preventDefault();

      state.keys[key] =
        true;

    }


    /*
      SPACE = SHOOT
    */

    if (event.code === "Space") {

      event.preventDefault();

      shoot();

    }

  }
);


document.addEventListener(
  "keyup",
  event => {

    const target =
      event.target;


    const typing =
      target &&
      (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );


    if (typing)
      return;


    const key =
      event.key.toLowerCase();


    state.keys[key] =
      false;

  }
);


/* ================= MOUSE SHOOT ================= */

$("arena")
  .addEventListener(
    "click",
    event => {

      shoot();

    }
  );


/* ================= INITIALIZE ================= */

loadExamples();

updateLiveSeverity();

$("previewCase")
  .textContent =
  "#" + (state.caseNo + 1);