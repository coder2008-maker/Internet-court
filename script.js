/* =========================================================
   THE INTERNET COURT
   Full Game Script
   Powerups + Boss Phases + Dynamic Dialogue
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

  damageBoostActive: false,

  shieldActive: false,

  damageBoostTimer: null,

  shieldTimer: null,

  bossPhase: "normal",

  lastBossDialogue: "",

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

  const screen = $(id);

  if (!screen) return;

  screen.classList.add("active");

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

  "I shared a secret I shouldn't have.",

  "I copied my friend's homework.",

  "I forgot to reply for two days.",

  "I took someone's charger without asking.",

  "I blamed my friend for something I did.",

  "I skipped class and pretended I attended.",

  "I posted an embarrassing screenshot of my friend.",

  "I cheated in a game.",

  "I kept 47 notifications unread.",

  "I ate the food that wasn't mine."

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

    button.type = "button";

    button.textContent =
      example;

    button.addEventListener(
      "click",
      () => {

        const input = $("crimeInput");

        if (!input) return;

        input.value =
          example;

        updateLiveSeverity();

        input.focus();

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
     FICTIONAL GAME LOGIC
     Kept non-graphic.
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

  const input = $("crimeInput");

  if (!input) return;

  const text =
    input.value.trim();

  const value =
    text ? judgeCrime(text) : 55;

  const valueElement =
    $("liveSeverityValue");

  const fill =
    $("liveSeverityFill");

  const label =
    $("liveSeverityLabel");

  const hint =
    $("liveSeverityHint");

  if (valueElement)
    valueElement.textContent =
      value + "/100";

  if (fill) {

    fill.style.width =
      value + "%";

    fill.classList.toggle(
      "severity-danger",
      value > 80
    );

    fill.classList.toggle(
      "severity-warning",
      value > 60 && value <= 80
    );

  }

  if (label)
    label.textContent =
      severityInfo(value);


  if (!hint) return;


  if (!text) {

    hint.textContent =
      "Type your confession...";

  }

  else if (value > 85) {

    hint.textContent =
      "💀 BOSS BATTLE UNLOCKED";

  }

  else if (value > 70) {

    hint.textContent =
      "😡 The Judge is getting angry...";

  }

  else if (value > 50) {

    hint.textContent =
      "😐 The court is suspicious...";

  }

  else {

    hint.textContent =
      "😇 You're probably fine...";

  }

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

  const input = $("crimeInput");

  if (!input) return;

  state.crime =
    input.value.trim();

  if (!state.crime) {

    toast(
      "⚠️ You need to confess something first."
    );

    input.focus();

    return;

  }


  state.severity =
    judgeCrime(state.crime);


  if ($("caseNumber"))
    $("caseNumber")
      .textContent =
      "#" + (state.caseNo + 1);

  if ($("crimeDisplay"))
    $("crimeDisplay")
      .textContent =
      `"${state.crime}"`;

  if ($("trialSeverity"))
    $("trialSeverity")
      .textContent =
      state.severity + "/100";

  if ($("severityBadge"))
    $("severityBadge")
      .textContent =
      "⚖️ " + state.severity + "/100";

  if ($("severityMeterFill"))
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


  if ($("judgeName"))
    $("judgeName")
      .textContent =
      judge.name;

  if ($("judgeAvatar"))
    $("judgeAvatar")
      .textContent =
      judge.avatar;

  if ($("judgeLine"))
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

  if ($("evidence1"))
    $("evidence1")
      .textContent =
      evidence[0];

  if ($("evidence2"))
    $("evidence2")
      .textContent =
      evidence[1];

  if ($("evidence3"))
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


/* ================= BOSS DIALOGUE ================= */

const bossDialogues = {

  start: [
    "THE COURT IS NOW IN SESSION.",
    "YOU REALLY CHOSE TO FIGHT THE COURT?",
    "OBJECTION! THIS IS GETTING OUT OF HAND.",
    "THE INTERNET COURT HAS ENTERED COMBAT MODE."
  ],

  hit: [
    "OBJECTION! 😡",
    "THAT WAS UNNECESSARY!",
    "COURT DAMAGE DETECTED!",
    "YOU DARE ATTACK THE JUDGE?!"
  ],

  playerDamage: [
    "THE COURT STRIKES BACK.",
    "ORDER IN THE COURT!",
    "YOU SHOULD HAVE RUN.",
    "THE JUDGE HAS SPOKEN."
  ],

  phase2: [
    "😐 YOU'RE ACTUALLY DOING DAMAGE...",
    "FINE. THE COURT WILL TRY HARDER.",
    "THIS IS NOT HOW THE TRIAL WAS SUPPOSED TO GO."
  ],

  phase3: [
    "😡 ENOUGH!",
    "THE COURT IS DONE PLAYING.",
    "YOU HAVE MADE A TERRIBLE LEGAL DECISION."
  ],

  final: [
    "🤬 THIS IS YOUR FINAL WARNING!",
    "THE SUPREME COURT HAS AWAKENED!",
    "YOU WILL NOT DEFEAT THE INTERNET COURT!"
  ],

  defeat: [
    "WAIT... YOU ACTUALLY WON?!",
    "THE COURT HAS BEEN DEFEATED?!",
    "THIS CASE HAS GONE COMPLETELY OFF THE RAILS."
  ]

};


function bossSay(type) {

  const box =
    $("bossDialogue");

  if (!box) return;

  const lines =
    bossDialogues[type];

  if (!lines || !lines.length)
    return;

  let available =
    lines.filter(
      line => line !== state.lastBossDialogue
    );

  if (!available.length)
    available = lines;

  const line =
    available[
      Math.floor(
        Math.random() *
        available.length
      )
    ];

  state.lastBossDialogue =
    line;

  box.textContent =
    line;

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

  state.damageBoostActive = false;

  state.shieldActive = false;

  state.bossPhase = "normal";

  state.lastBossDialogue = "";

  state.playerX = 100;

  state.playerY = 250;

  state.bossX = 0;

  state.bossY = 250;


  clearTimeout(state.damageBoostTimer);

  clearTimeout(state.shieldTimer);


  const projectiles =
    $("projectiles");

  if (projectiles) {

    projectiles
      .querySelectorAll(
        ".projectile"
      )
      .forEach(
        el => el.remove()
      );

  }


  const powerupContainer =
    $("powerups");

  if (powerupContainer) {

    powerupContainer
      .querySelectorAll(
        ".powerup"
      )
      .forEach(
        el => el.remove()
      );

  }


  if ($("bossLabel"))
    $("bossLabel")
      .textContent =
      boss.name;

  if ($("boss"))
    $("boss")
      .textContent =
      boss.emoji;

  if ($("phaseLabel"))
    $("phaseLabel")
      .textContent =
      "ROUND 1";

  if ($("comboLabel"))
    $("comboLabel")
      .textContent =
      "0 HITS";


  bossSay("start");


  showScreen("gameScreen");

  updateBars();

  updatePlayerPowerVisual();

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

  if (!boss) return;


  boss.classList.toggle(
    "rage",
    ratio <= .5
  );

  boss.classList.toggle(
    "low-hp",
    ratio <= .3
  );


  /*
     PHASE 1
  */

  if (ratio > .75) {

    if (state.bossPhase !== "normal") {

      state.bossPhase =
        "normal";

      if ($("phaseLabel"))
        $("phaseLabel")
          .textContent =
          "ROUND 1";

    }

    boss.textContent =
      getBossProfile().emoji;

  }


  /*
     PHASE 2
  */

  else if (ratio > .5) {

    if (state.bossPhase !== "phase2") {

      state.bossPhase =
        "phase2";

      if ($("phaseLabel"))
        $("phaseLabel")
          .textContent =
          "⚠️ PHASE 2";

      bossSay("phase2");

      playTone("rage");

    }

    boss.textContent =
      "😡⚖️";

  }


  /*
     PHASE 3
  */

  else if (ratio > .25) {

    if (state.bossPhase !== "phase3") {

      state.bossPhase =
        "phase3";

      if ($("phaseLabel"))
        $("phaseLabel")
          .textContent =
          "🔥 PHASE 3";

      bossSay("phase3");

      playTone("rage");

    }

    boss.textContent =
      "🤬⚖️";

  }


  /*
     FINAL PHASE
  */

  else {

    if (state.bossPhase !== "final") {

      state.bossPhase =
        "final";

      if ($("phaseLabel"))
        $("phaseLabel")
          .textContent =
          "💀 FINAL PHASE";

      bossSay("final");

      playTone("rage");

    }

    boss.textContent =
      "👿⚖️";

  }

}


/* ================= BARS ================= */

function updateBars() {

  const playerRatio =
    state.playerHP / 100;

  const bossRatio =
    state.bossHP /
    state.bossMaxHP;


  if ($("playerHpBar"))
    $("playerHpBar")
      .style.width =
      clamp(
        playerRatio * 100,
        0,
        100
      ) + "%";

  if ($("bossHpBar"))
    $("bossHpBar")
      .style.width =
      clamp(
        bossRatio * 100,
        0,
        100
      ) + "%";


  if ($("playerHpText"))
    $("playerHpText")
      .textContent =
      Math.max(
        0,
        Math.round(state.playerHP)
      ) + " HP";


  if ($("bossHpText"))
    $("bossHpText")
      .textContent =
      Math.max(
        0,
        Math.round(state.bossHP)
      ) + " HP";


  if ($("comboLabel"))
    $("comboLabel")
      .textContent =
      state.hits + " HITS";


  updateBossVisual();

}


/* ================= PLAYER POWER VISUAL ================= */

function updatePlayerPowerVisual() {

  const player =
    $("player");

  if (!player) return;

  player.classList.toggle(
    "damage-boost",
    state.damageBoostActive
  );

  player.classList.toggle(
    "shield-active",
    state.shieldActive
  );

}


/* ================= SHOOTING ================= */

function shoot() {

  if (!state.gameRunning)
    return;


  const projectiles =
    $("projectiles");

  if (!projectiles)
    return;


  const bullet =
    document.createElement("div");

  bullet.className =
    "projectile";


  bullet.style.left =
    state.playerX + 55 + "px";

  bullet.style.top =
    state.playerY + 30 + "px";


  projectiles
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

  const projectiles =
    $("projectiles");

  if (!arena || !projectiles)
    return;


  const bullet =
    document.createElement("div");

  bullet.className =
    "projectile enemy-projectile";


  const startX =
    arena.clientWidth - 130;

  const startY =
    state.bossY + 30;


  /*
     BOSS GETS HARDER
     Higher phase = faster projectile.
  */

  let speed = 7;

  if (state.bossPhase === "phase2")
    speed = 8;

  if (state.bossPhase === "phase3")
    speed = 9;

  if (state.bossPhase === "final")
    speed = 10;


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


  const vx =
    (dx / distance) * speed;

  const vy =
    (dy / distance) * speed;


  bullet.style.left =
    startX + "px";

  bullet.style.top =
    startY + "px";


  projectiles
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

  const layer =
    $("damageLayer");

  if (!layer) return;


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


  layer
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

  checkPowerupCollection();

  updateBars();

  checkGameEnd();


  if (state.gameRunning) {

    requestAnimationFrame(
      gameLoop
    );

  }

}


/* ================= PLAYER MOVEMENT ================= */

function movePlayer() {

  const arena =
    $("arena");

  const player =
    $("player");

  if (!arena || !player)
    return;


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


  player.style.left =
    state.playerX + "px";

  player.style.top =
    state.playerY + "px";

}


/* ================= BULLETS ================= */

function moveBullets() {

  const arena =
    $("arena");

  if (!arena) return;


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
        Math.abs(
          bullet.x - bossX
        ) < 50 &&
        Math.abs(
          bullet.y - bossY
        ) < 60
      ) {

        let damage =
          state.severity >= 86
            ? 9
            : 12;


        /* ⚡ DOUBLE DAMAGE */

        if (
          state.damageBoostActive
        ) {

          damage *= 2;

        }


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


        if (
          Math.random() < .35
        ) {

          bossSay("hit");

        }


        return;

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

  const arena =
    $("arena");

  if (!arena) return;


  state.enemyBullets.forEach(
    bullet => {

      bullet.x += bullet.vx;

      bullet.y += bullet.vy;


      bullet.el.style.left =
        bullet.x + "px";

      bullet.el.style.top =
        bullet.y + "px";


      /*
         PLAYER HIT
      */

      if (
        Math.abs(
          bullet.x - state.playerX
        ) < 40 &&
        Math.abs(
          bullet.y - state.playerY
        ) < 60
      ) {

        /*
           🛡️ SHIELD
        */

        if (
          state.shieldActive
        ) {

          toast(
            "🛡️ SHIELD BLOCKED THE ATTACK!"
          );

          playTone("power");

          bullet.el.remove();

          state.enemyBullets =
            state.enemyBullets.filter(
              b => b !== bullet
            );

          return;

        }


        /*
           NORMAL DAMAGE
        */

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


        if (
          Math.random() < .35
        ) {

          bossSay(
            "playerDamage"
          );

        }


        return;

      }


      /*
         REMOVE BULLET OUTSIDE ARENA
      */

      if (
        bullet.x < -50 ||
        bullet.x >
          arena.clientWidth + 50 ||
        bullet.y < 80 ||
        bullet.y >
          arena.clientHeight + 50
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


  /*
     BOSS SHOOTS FASTER
     AS HP DROPS.
  */

  let delay = 1200;


  if (
    state.bossPhase === "phase2"
  ) {

    delay = 900;

  }


  if (
    state.bossPhase === "phase3"
  ) {

    delay = 650;

  }


  if (
    state.bossPhase === "final"
  ) {

    delay = 450;

  }


  setTimeout(
    enemyLoop,
    delay
  );

}


/* ================= POWERUPS ================= */

function powerupLoop() {

  if (!state.gameRunning)
    return;


  /*
     Random chance to spawn
  */

  if (
    Math.random() < .55
  ) {

    spawnPowerup();

  }


  setTimeout(
    powerupLoop,
    4000
  );

}


/* ================= SPAWN POWERUP ================= */

function spawnPowerup() {

  const arena =
    $("arena");

  const container =
    $("powerups");

  if (!arena || !container)
    return;


  const power =
    document.createElement("div");

  power.className =
    "powerup";


  /*
     1 = DOUBLE DAMAGE
     2 = SHIELD
     3 = HEAL
  */

  const types = [

    {
      type: "damage",
      emoji: "⚡"
    },

    {
      type: "shield",
      emoji: "🛡️"
    },

    {
      type: "heal",
      emoji: "❤️"
    }

  ];


  const chosen =
    types[
      Math.floor(
        Math.random() *
        types.length
      )
    ];


  power.textContent =
    chosen.emoji;


  power.dataset.type =
    chosen.type;


  const x =
    Math.max(
      20,
      Math.random() *
      (arena.clientWidth - 80)
    );


  const y =
    150 +
    Math.random() *
    Math.max(
      40,
      arena.clientHeight - 220
    );


  power.style.left =
    x + "px";

  power.style.top =
    y + "px";


  container
    .appendChild(power);


  state.powerups.push({

    el: power,

    x: x,

    y: y,

    type: chosen.type

  });


  playTone("power");


  /*
     Automatically disappear
     if ignored for 10 seconds.
  */

  setTimeout(
    () => {

      const index =
        state.powerups.findIndex(
          item =>
            item.el === power
        );

      if (index !== -1) {

        power.remove();

        state.powerups.splice(
          index,
          1
        );

      }

    },
    10000
  );

}


/* ================= POWERUP COLLECTION ================= */

function checkPowerupCollection() {

  if (
    !state.powerups.length
  )
    return;


  state.powerups.forEach(
    power => {

      /*
         Distance between
         player and powerup.
      */

      const dx =
        Math.abs(
          state.playerX -
          power.x
        );

      const dy =
        Math.abs(
          state.playerY -
          power.y
        );


      if (
        dx < 65 &&
        dy < 70
      ) {

        collectPowerup(power);

      }

    }
  );

}


/* ================= COLLECT POWERUP ================= */

function collectPowerup(power) {

  /*
     Make sure it still exists.
  */

  const index =
    state.powerups.indexOf(
      power
    );

  if (index === -1)
    return;


  /*
     REMOVE FROM SCREEN
  */

  if (power.el)
    power.el.remove();


  state.powerups.splice(
    index,
    1
  );


  /*
     ⚡ DOUBLE DAMAGE
  */

  if (
    power.type === "damage"
  ) {

    state.damageBoostActive =
      true;


    clearTimeout(
      state.damageBoostTimer
    );


    state.damageBoostTimer =
      setTimeout(
        () => {

          state.damageBoostActive =
            false;

          updatePlayerPowerVisual();

          toast(
            "⚡ Double Damage ended!"
          );

        },
        8000
      );


    updatePlayerPowerVisual();

    toast(
      "⚡ DOUBLE DAMAGE! Your shots deal 2× damage for 8 seconds!"
    );

    playTone("power");

  }


  /*
     🛡️ SHIELD
  */

  else if (
    power.type === "shield"
  ) {

    state.shieldActive =
      true;


    clearTimeout(
      state.shieldTimer
    );


    state.shieldTimer =
      setTimeout(
        () => {

          state.shieldActive =
            false;

          updatePlayerPowerVisual();

          toast(
            "🛡️ Shield expired!"
          );

        },
        8000
      );


    updatePlayerPowerVisual();

    toast(
      "🛡️ SHIELD ACTIVATED! You're protected for 8 seconds!"
    );

    playTone("power");

  }


  /*
     ❤️ HEAL
  */

  else if (
    power.type === "heal"
  ) {

    const oldHP =
      state.playerHP;


    state.playerHP =
      clamp(
        state.playerHP + 25,
        0,
        100
      );


    const healed =
      Math.round(
        state.playerHP - oldHP
      );


    if (healed > 0) {

      toast(
        "❤️ +25 HP! Courtroom recovery!"
      );

      playTone("power");

    }

    else {

      toast(
        "❤️ HP already full!"
      );

      playTone("power");

    }

  }

}


/* ================= GAME END ================= */

function checkGameEnd() {

  if (
    state.bossHP <= 0
  ) {

    state.bossHP = 0;

    endGame(true);

    return;

  }


  if (
    state.playerHP <= 0
  ) {

    state.playerHP = 0;

    endGame(false);

  }

}


function endGame(won) {

  if (!state.gameRunning)
    return;


  state.gameRunning = false;

  state.gameWon = won;


  clearTimeout(
    state.damageBoostTimer
  );

  clearTimeout(
    state.shieldTimer
  );


  if (won) {

    bossSay("defeat");

  }


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

  if (!list)
    return;


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

  return String(text)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");

}


/* ================= HISTORY DRAWER ================= */

function openHistory() {

  renderHistory();

  if ($("historyDrawer"))
    $("historyDrawer")
      .classList.add("open");

  if ($("drawerBackdrop"))
    $("drawerBackdrop")
      .classList.add("show");

}


function closeHistory() {

  if ($("historyDrawer"))
    $("historyDrawer")
      .classList.remove("open");

  if ($("drawerBackdrop"))
    $("drawerBackdrop")
      .classList.remove("show");

}


/* ================= NEW CASE ================= */

function newCase() {

  state.gameRunning = false;

  state.crime = "";

  state.severity = 55;

  state.damageBoostActive = false;

  state.shieldActive = false;

  state.bossPhase = "normal";


  clearTimeout(
    state.damageBoostTimer
  );

  clearTimeout(
    state.shieldTimer
  );


  const input =
    $("crimeInput");

  if (input)
    input.value = "";


  updateLiveSeverity();


  if ($("previewCase"))
    $("previewCase")
      .textContent =
      "#" + (state.caseNo + 1);


  showScreen("homeScreen");

}


/* ================= SOUND ================= */

function toggleSound() {

  state.sound =
    !state.sound;


  if ($("soundToggle"))
    $("soundToggle")
      .textContent =
      state.sound
        ? "🔊 Sound On"
        : "🔇 Sound Off";

}


/* ================= EVENTS ================= */

/*
   IMPORTANT:
   preventDefault() stops a form from
   reloading the page.
*/

const crimeInput =
  $("crimeInput");

if (crimeInput) {

  crimeInput
    .addEventListener(
      "input",
      updateLiveSeverity
    );

}


/* ================= START TRIAL ================= */

const submitCrime =
  $("submitCrime");

if (submitCrime) {

  submitCrime
    .addEventListener(
      "click",
      function(event) {

        event.preventDefault();

        event.stopPropagation();

        openTrial();

        return false;

      }
    );

}


/* ================= TRIAL ACTION ================= */

const trialAction =
  $("trialAction");

if (trialAction) {

  trialAction
    .addEventListener(
      "click",
      function(event) {

        event.preventDefault();

        event.stopPropagation();


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


        return false;

      }
    );

}


/* ================= NEW CASE ================= */

const newCaseButton =
  $("newCase");

if (newCaseButton) {

  newCaseButton
    .addEventListener(
      "click",
      function(event) {

        event.preventDefault();

        newCase();

      }
    );

}


/* ================= SOUND ================= */

const soundToggle =
  $("soundToggle");

if (soundToggle) {

  soundToggle
    .addEventListener(
      "click",
      toggleSound
    );

}


/* ================= HISTORY ================= */

const historyOpen =
  $("historyOpen");

if (historyOpen) {

  historyOpen
    .addEventListener(
      "click",
      openHistory
    );

}


const historyResult =
  $("historyResult");

if (historyResult) {

  historyResult
    .addEventListener(
      "click",
      openHistory
    );

}


const historyClose =
  $("historyClose");

if (historyClose) {

  historyClose
    .addEventListener(
      "click",
      closeHistory
    );

}


const drawerBackdrop =
  $("drawerBackdrop");

if (drawerBackdrop) {

  drawerBackdrop
    .addEventListener(
      "click",
      closeHistory
    );

}


/* ================= BRAND HOME ================= */

const brandHome =
  $("brandHome");

if (brandHome) {

  brandHome
    .addEventListener(
      "click",
      function(event) {

        event.preventDefault();

        state.gameRunning =
          false;

        showScreen("homeScreen");

      }
    );

}


/* ================= KEYBOARD ================= */

document.addEventListener(
  "keydown",
  event => {

    const target =
      event.target;


    /*
       IMPORTANT:
       Text boxes keep normal typing,
       including SPACE.
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

    if (
      event.code === "Space"
    ) {

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

const arena =
  $("arena");

if (arena) {

  arena
    .addEventListener(
      "click",
      event => {

        shoot();

      }
    );

}


/* ================= INITIALIZE ================= */

loadExamples();

updateLiveSeverity();


if ($("previewCase")) {

  $("previewCase")
    .textContent =
    "#" + (state.caseNo + 1);

}