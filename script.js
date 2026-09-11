const $ = id => document.getElementById(id);
const state = {
  severity: 55, crime: "", caseNo: Number(localStorage.getItem("courtCaseNo") || 2840),
  sound: localStorage.getItem("courtSound") !== "off", playing: false,
  player: {x: 90, y: 250}, boss: {x: 850, y: 250}, playerHP: 100, bossHP: 100, bossMaxHP: 100,
  shots: 0, hits: 0, bullets: [], enemyBullets: [], powerups: [], keys: {}, lastShot: 0,
  enemyClock: 0, powerClock: 0, boostUntil: 0, shieldUntil: 0, animationId: null, lastTime: 0
};
const examples=["I ate my friend's fries without asking.","I replied three days later and said 'just saw this'.","I watched one episode and finished the whole season.","I opened the fridge even though I knew it was empty.","I said 'you too' when someone said happy birthday.","I have 47 unread notifications."];
const lowVerdicts=["You are technically innocent. Emotionally, however, we have concerns.","Not guilty. But please make better decisions.","The court finds you 12% suspicious.","Case dismissed due to lack of common sense.","You have been warned. The internet is watching.","Innocent… for now.","The court sees no crime here. Just questionable taste."];
const mediumVerdicts=["Guilty of being unnecessarily chaotic.","You knew exactly what you were doing. That is the problem.","The evidence is weak. Your decision-making is weaker.","Guilty. Sentence: think about what you've done.","The court cannot legally punish you, so we're judging you instead.","You are hereby sentenced to one hour of reconsidering your life choices.","Technically legal. Spiritually criminal.","Your defense was somehow worse than the crime."];
const highVerdicts=["GUILTY. Even the Judge is disappointed.","The court has reviewed your case and collectively sighed.","This was not a mistake. This was a decision.","Your honor would like to know: WHY?","Guilty on all counts of being an absolute menace.","The prosecution had evidence. Your own choices were the strongest evidence.","Sentence: You must explain yourself to everyone.","The court has run out of patience."];
const extremeVerdicts=["GUILTY. Call the Supreme Judge.","This case has exceeded the court's emotional bandwidth.","You have committed a crime so unnecessary that it deserves its own boss battle.","The Judge has personally entered the arena.","Normal punishment is no longer sufficient.","Congratulations. You unlocked Courtroom Chaos Mode.","The law has been consulted. The law is confused.","You weren't supposed to get this far."];
const judgeLines=[
  "BRO… WHY WOULD YOU DO THAT? 😭",
  "I EXPECTED BETTER FROM YOU. 💀",
  "THIS IS WHAT YOU CHOSE TO DO?! 😭",
  "THE COURT IS… CONCERNED. 😐⚖️",
  "I'M NOT EVEN MAD. I'M JUST DISAPPOINTED. 🗿",
  "THAT'S YOUR CRIME?! 😂",
  "YOU MADE ME COME TO COURT FOR THIS?! 💀",
  "OBJECTION — THAT'S ACTUALLY HILARIOUS. 😂",
  "BRO GOT ARRESTED BY HIS OWN DECISIONS. 😭",
  "THE JURY IS LAUGHING. 😭",
  "I NEED TO READ THAT AGAIN. 🤨",
  "YOUR HONOR HAS QUESTIONS. MANY QUESTIONS. 🤨",
  "THE LAW DOES NOT COVER THIS. 💀",
  "OH. SO YOU CHOSE CHAOS. 😈",
  "YOU KNEW EXACTLY WHAT YOU WERE DOING. 💀",
  "THE COURT HAS LOST ITS PATIENCE. 😤",
  "ENOUGH. YOU'RE GOING TO THE ARENA. 🔥",
  "NORMAL PUNISHMENT IS NO LONGER ENOUGH. 💀",
  "BRO HIT 100/100. 💀💀💀",
  "YOU REALLY MAXED OUT THE CRIME METER?! 😭",
  "THIS IS NOT A TRIAL ANYMORE. 💀",
  "CALL THE SUPREME JUDGE. NOW. 🚨⚖️",
  "YOU SHOULD HAVE STOPPED AT 80. ☠️"
];
const bossLines=[
  "YOU DARE APPEAL THE VERDICT?! 😈⚖️",
  "OBJECTION DENIED. COMMON SENSE SUSTAINED. 💀",
  "YOUR DEFENSE IS ADORABLE. 😭",
  "ENOUGH PAPERWORK. LET'S SETTLE THIS IN COURT. 🔨🔥",
  "YOU COULD HAVE SIMPLY BEHAVED. 😐",
  "THE COURT IS NOW IN SESSION!!! ⚖️🔥",
  "I HEREBY SENTENCE YOU… TO BATTLE. 💀",
  "NICE TRY, COUNSELOR. 😭",
  "HAVE YOU SEEN YOUR AIM?! 💀🎯",
  "THAT'S THE BEST DEFENSE YOU'VE GOT?! 😭",
  "CONTEMPT OF COURT!!! 🚨⚖️",
  "ORDER IN THE COURT!!! 🔨",
  "YOU SHOULD'VE JUST SAID SORRY. 💀",
  "THE JURY WANTS TO KNOW WHAT YOU WERE THINKING. 🤨"
];
const winLines=["The defendant has defeated the justice system. Terrifying.","NOT GUILTY. The Judge has been respectfully demolished.","Case dismissed. Please don't make us regret this.","You won. This court will be reviewing its hiring process.","Justice has been served… slightly incorrectly.","The defendant survives another day."];
const loseLines=["GUILTY. The Judge remains undefeated.","Your argument has been rejected. So has your aim.","Court adjourned. You lost.","Justice wins. Skill issue detected.","The Judge has filed a complaint against your gaming ability.","Perhaps next time, consider hiring a lawyer."];
function pick(a){return a[Math.floor(Math.random()*a.length)]}function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active')}function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function sevInfo(v){if(v<=30)return'Innocent 😇';if(v<=60)return'Questionable 😐';if(v<=80)return'Bad Decision 😈';return'Absolutely Unhinged 💀'}
function randomCrime(){return pick(examples)}
examples.slice(0,4).forEach(text=>{const b=document.createElement('button');b.className='example';b.textContent=text;b.onclick=()=>{$('crimeInput').value=text;$('crimeInput').focus()};$('exampleRow').appendChild(b)});
function judgeCrime(text){
  const t=text.toLowerCase().trim();
  let score=12;
  const rules=[
    {words:['fries','snack','food','pizza','dessert','cookie','cake'],pts:14},
    {words:['late','ignored','reply','replied','message','notification','ghost','left me on read'],pts:16},
    {words:['lie','lied','lying','cheat','cheated','cheating','fake'],pts:28},
    {words:['steal','stole','stolen','rob','robbed','take without'],pts:38},
    {words:['assignment','homework','exam','test','plagiar','copy','cheated on exam'],pts:30},
    {words:['secret','screenshot','leak','expose','shared private'],pts:22},
    {words:['break','broke','damage','destroy','smash'],pts:35},
    {words:['threaten','threatened','hurt','harm','attack','attacked','assault'],pts:48},
    {words:['kill','killed','murder','murdered','dead','weapon'],pts:78},
    {words:['kidnap','kidnapped','hostage'],pts:78},
    {words:['arson','burned down','set fire'],pts:78},
    {words:['school','class','college'],pts:5},
    {words:['whole season','all night','47 unread','100 unread'],pts:12},
    {words:['accidentally','by accident','didn\'t mean to','did not mean to'],pts:-12},
    {words:['sorry','apologized','apologise','apologized'],pts:-5}
  ];
  rules.forEach(r=>{ if(r.words.some(w=>t.includes(w))) score+=r.pts; });
  if(t.length>110) score+=8;
  if(/fiction|joke|roleplay|in a game|in minecraft|in gta/.test(t)) score-=10;
  return clamp(score,5,100);
}
function judgeReason(score,text){
  const t=text.toLowerCase();
  if(/steal|stole|cheat|cheated|plagiar|copy/.test(t)) return 'The court has detected intentional chaos. That is NOT helping your case. 💀';
  if(score>80) return 'The Judge has reviewed the evidence… and personally requested a boss fight. 🚨⚖️';
  if(score>60) return 'Hmm. Technically survivable… but the court is VERY disappointed. 😭';
  if(score>30) return 'Questionable behaviour detected. The Judge will allow you to defend yourself. 🤨';
  return 'Honestly? Barely a crime. The court has concerns, but we will let this slide. 😭';
}
$('submitCrime').onclick=()=>{
  state.crime=$('crimeInput').value.trim()||randomCrime();
  state.severity=judgeCrime(state.crime);
  state.caseNo++;localStorage.setItem('courtCaseNo',state.caseNo);
  $('caseNumber').textContent='#'+state.caseNo;
  $('crimeDisplay').textContent='“'+state.crime+'”';
  $('trialSeverity').textContent=state.severity+'/100';
  $('trialSeverity').dataset.value=state.severity;
  $('severityMeterFill').style.width=state.severity+'%';
  $('severityBadge').textContent='⚖️ '+state.severity+'/100 • '+sevInfo(state.severity);
  $('rulingTitle').textContent=state.severity>80?'🚨 SUPREME JUDGE RULING':state.severity>60?'😈 JUDGE RULING':'😇 JUDGE RULING';
  $('rulingText').textContent=judgeReason(state.severity,state.crime);
  $('judgeName').textContent=state.severity>80?'THE SUPREME JUDGE':state.severity>60?'THE HONORABLE JUDGE':'THE FRIENDLY JUDGE';
  $('judgeLine').textContent=pick(judgeLines);
  $('evidence1').textContent='The Judge analyzed your exact statement and found '+state.severity+' points of questionable energy.';
  $('evidence2').textContent=judgeReason(state.severity,state.crime);
  $('evidence3').textContent=state.severity>85?'Sentence recommendation: survive the Supreme Court. 💀':state.severity>60?'Sentence recommendation: prepare to defend yourself. 🔥':'Sentence recommendation: learn from this and move on. 😌';
  $('courtThought').textContent='⚖️ JUDGE\'S VERDICT: '+judgeReason(state.severity,state.crime);
  $('trialAction').innerHTML=state.severity<=30?'⚖️ HEAR THE VERDICT  <span>→</span>':'🔥 FACE THE JUDGE  <span>→</span>';
  $('trialAction').dataset.mode=state.severity<=30?'verdict':'fight';
  showScreen('trialScreen');setTimeout(()=>sayBoss('MY RULING: '+pick(judgeLines)),650);toast('The Judge analyzed your statement. Severity: '+state.severity+'/100');
};
document.querySelectorAll('.evidence-card').forEach(c=>c.onclick=()=>{c.animate([{transform:'scale(.98)'},{transform:'translateY(-4px)'}],{duration:180,fill:'forwards'})});
$('trialAction').onclick=()=>$('trialAction').dataset.mode==='verdict'?simpleVerdict():startGame();
function simpleVerdict(){showResult('NOT GUILTY',pick(lowVerdicts),'⚖️',120,'N/A',false,'🏆 <span>Achievement unlocked: FIRST OFFENSE</span>')}
function bossProfile(){if(state.severity>85)return{hp:200,name:'SUPREME JUDGE'};if(state.severity>70)return{hp:160,name:'THE JUDGE'};return{hp:120,name:'HONORABLE JUDGE'}}
function startGame(){const bp=bossProfile();state.playing=true;state.playerHP=100;state.bossMaxHP=bp.hp;state.bossHP=bp.hp;state.player={x:90,y:250};state.boss={x:900,y:250};state.shots=state.hits=0;state.bullets=[];state.enemyBullets=[];state.powerups=[];state.enemyClock=state.powerClock=0;state.boostUntil=state.shieldUntil=0;state.lastTime=performance.now();$('bossLabel').textContent=bp.name;$('phaseLabel').textContent=state.severity>85?'PHASE 1':'ROUND 1';updateBars();showScreen('gameScreen');sayBoss(pick(bossLines));state.animationId=requestAnimationFrame(loop)}
document.onkeydown=e=>{
  const target=e.target;
  const typing=target && (target.tagName==='INPUT'||target.tagName==='TEXTAREA'||target.isContentEditable);
  if(typing) return;
  state.keys[e.key.toLowerCase()]=true;
  if([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
  if(state.playing&&e.code==='Space') shoot();
};
document.onkeyup=e=>{
  const target=e.target;
  const typing=target && (target.tagName==='INPUT'||target.tagName==='TEXTAREA'||target.isContentEditable);
  if(typing) return;
  state.keys[e.key.toLowerCase()]=false;
};$('arena').onclick=e=>{if(state.playing)shoot()};
function shoot(){const now=performance.now(),cool=state.boostUntil>now?90:180;if(now-state.lastShot<cool)return;state.lastShot=now;state.shots++;state.bullets.push({x:state.player.x+38,y:state.player.y+10,vx:10})}
function enemyShoot(){const dx=state.player.x-state.boss.x,dy=state.player.y-state.boss.y,len=Math.hypot(dx,dy)||1;state.enemyBullets.push({x:state.boss.x,y:state.boss.y+10,vx:dx/len*5.2,vy:dy/len*5.2});if(state.severity>85&&Math.random()<.35){state.enemyBullets.push({x:state.boss.x,y:state.boss.y+10,vx:-5,vy:2.7});state.enemyBullets.push({x:state.boss.x,y:state.boss.y+10,vx:-5,vy:-2.7})}}
function loop(t){if(!state.playing)return;const dt=Math.min(32,t-state.lastTime);state.lastTime=t;update(dt,t);render();state.animationId=requestAnimationFrame(loop)}
function update(dt,time){const a=$('arena'),w=a.clientWidth,h=a.clientHeight,s=state.boostUntil>time?7:5;if(state.keys.w||state.keys.arrowup)state.player.y-=s;if(state.keys.s||state.keys.arrowdown)state.player.y+=s;if(state.keys.a||state.keys.arrowleft)state.player.x-=s;if(state.keys.d||state.keys.arrowright)state.player.x+=s;state.player.x=clamp(state.player.x,20,w-70);state.player.y=clamp(state.player.y,45,h-55);state.boss.x=w-100;state.boss.y+=(state.player.y-state.boss.y)*.012+Math.sin(time/450)*.8;state.bullets.forEach(b=>b.x+=b.vx);state.enemyBullets.forEach(b=>{b.x+=b.vx;b.y+=b.vy});
state.bullets=state.bullets.filter(b=>{if(b.x>w)return false;if(Math.hypot(b.x-state.boss.x,b.y-state.boss.y)<42){const d=state.boostUntil>time?14:8;state.bossHP-=d;state.hits++;floatingDamage(state.boss.x,state.boss.y,d);sayBoss(pick(['OBJECTION! ⚖️🔥','SUSTAINED! 😭','THAT’S ILLEGAL! 💀','DIRECT HIT! 🎯','HEY! WATCH THE ROBES! 😭','WHO TAUGHT YOU TO AIM?! 💀']));return false}return true});state.enemyBullets=state.enemyBullets.filter(b=>{if(b.x<0||b.x>w||b.y<0||b.y>h)return false;if(Math.hypot(b.x-state.player.x,b.y-state.player.y)<38){if(state.shieldUntil>time){sayBoss('LAWYER SHIELD! YOU CANNOT TOUCH THE DEFENDANT! 🛡️😤');return false}state.playerHP-=8;floatingDamage(state.player.x,state.player.y,8,true);return false}return true});state.enemyClock+=dt;state.powerClock+=dt;const gap=Math.max(320,900-state.severity*5);if(state.enemyClock>gap){state.enemyClock=0;enemyShoot();if(Math.random()<.3)sayBoss(pick(bossLines))}if(state.powerClock>5000){state.powerClock=0;state.powerups.push({x:100+Math.random()*(w-200),y:70+Math.random()*(h-140),type:pick(['⚡','🛡️','⭐']),expires:time+9000})}
state.powerups=state.powerups.filter(p=>{if(time>p.expires)return false;if(Math.hypot(p.x-state.player.x,p.y-state.player.y)<42){if(p.type==='⚡'){state.bossHP-=24;sayBoss('OBJECTION POWER ACTIVATED!!! ⚡⚖️🔥')}if(p.type==='🛡️'){state.playerHP=Math.min(100,state.playerHP+28);state.shieldUntil=time+3500;sayBoss('LAWYER SHIELD! YOU CANNOT TOUCH THE DEFENDANT! 🛡️😤')}if(p.type==='⭐'){state.boostUntil=time+5000;sayBoss('COURT BOOST!!! GO GO GO!!! ⭐🔥')}return false}return true});if(state.severity>85&&state.bossHP<state.bossMaxHP*.5&&$('phaseLabel').textContent!=='FINAL PHASE'){$('phaseLabel').textContent='FINAL PHASE';sayBoss('YOU SHOULD HAVE STOPPED AT 80.')}updateBars();if(state.bossHP<=0)endGame(true);else if(state.playerHP<=0)endGame(false)}
function render(){$('player').style.left=state.player.x+'px';$('player').style.top=state.player.y+'px';$('boss').style.left=state.boss.x+'px';$('boss').style.top=state.boss.y+'px';$('projectiles').innerHTML=[...state.bullets.map(b=>`<i class="bullet" style="left:${b.x}px;top:${b.y}px"></i>`),...state.enemyBullets.map(b=>`<i class="bullet enemy-bullet" style="left:${b.x}px;top:${b.y}px"></i>`)].join('');$('powerups').innerHTML=state.powerups.map(p=>`<span class="power" style="left:${p.x}px;top:${p.y}px">${p.type}</span>`).join('')}
function updateBars(){$('playerHpBar').style.width=Math.max(0,state.playerHP)+'%';$('bossHpBar').style.width=Math.max(0,state.bossHP/state.bossMaxHP*100)+'%';$('playerHpText').textContent=Math.max(0,Math.ceil(state.playerHP))+' HP';$('bossHpText').textContent=Math.max(0,Math.ceil(state.bossHP))+' HP';$('comboLabel').textContent=state.hits+' HITS'}
function floatingDamage(x,y,n,enemy=false){const d=document.createElement('div');d.className='damage-num';d.textContent=(enemy?'-':'+')+n;d.style.left=x+'px';d.style.top=y+'px';d.style.color=enemy?'#ff8294':'#ffe27e';$('damageLayer').appendChild(d);setTimeout(()=>d.remove(),750)}
function sayBoss(text){const box=$('bossDialogue');box.textContent=text;box.classList.remove('show');void box.offsetWidth;box.classList.add('show');if(state.sound&&'speechSynthesis'in window&&Math.random()<.12){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text.replace(/[⚖️🛡️⚡⭐]/g,''));u.rate=1.05;u.pitch=.65;u.volume=.3;window.speechSynthesis.speak(u)}}
function endGame(win){state.playing=false;if(state.animationId)cancelAnimationFrame(state.animationId);const acc=state.shots?Math.round(state.hits/state.shots*100):0;const xp=win?500+state.severity*2:100+state.severity;const line=win?pick(winLines):pick(loseLines);showResult(win?'NOT GUILTY':'GUILTY',line,win?'🏆':'⚖️',xp,acc+'%',true,win?(state.severity>85?'👑 <span>Achievement unlocked: SUPREME COURT SURVIVOR</span>':'🔥 <span>Achievement unlocked: JUDGE DESTROYER</span>'):'🥊 <span>Achievement unlocked: LEGAL TROUBLE</span>',win);saveHistory(win?'NOT GUILTY':'GUILTY',win);if(win)makeConfetti()}
function showResult(title,text,icon,xp,acc,hasCase,achievement,win=false){$('resultIcon').textContent=icon;$('verdictTitle').textContent=title;$('verdictTitle').style.color=win?'#8ee9a9':title==='NOT GUILTY'?'#8ee9a9':'#ff7286';$('verdictText').textContent=text;$('xpValue').textContent='+'+xp;$('accuracyValue').textContent=acc;$('severityResult').textContent=state.severity;$('achievementBox').innerHTML=achievement;showScreen('resultScreen')}
function saveHistory(verdict,win){const h=JSON.parse(localStorage.getItem('courtHistory')||'[]');h.unshift({caseNo:state.caseNo,crime:state.crime,severity:state.severity,verdict,win,date:new Date().toLocaleDateString()});localStorage.setItem('courtHistory',JSON.stringify(h.slice(0,10)))}
function openHistory(){renderHistory();$('historyDrawer').classList.add('open');$('drawerBackdrop').classList.add('open')};function closeHistory(){$('historyDrawer').classList.remove('open');$('drawerBackdrop').classList.remove('open')};function renderHistory(){const l=$('historyList'),h=JSON.parse(localStorage.getItem('courtHistory')||'[]');l.innerHTML=h.length?h.map(x=>`<article class="history-item"><header><span>CASE #${x.caseNo}</span><span>${x.date}</span></header><p>${escapeHtml(x.crime)}</p><footer><span>${x.verdict}</span><span>Severity ${x.severity}/100</span></footer></article>`).join(''):'<div class="history-item"><p>No cases yet.</p><footer>Your questionable history begins here.</footer></div>'};function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function makeConfetti(){$('confetti').innerHTML='';for(let i=0;i<48;i++){const c=document.createElement('i');c.className='conf';c.style.left=Math.random()*100+'%';c.style.animationDelay=Math.random()*.8+'s';c.style.transform=`rotate(${Math.random()*90}deg)`;c.style.background=['#f4c95d','#ff78bd','#6de7ff','#9a7cff','#8ee9a9'][Math.floor(Math.random()*5)];$('confetti').appendChild(c)}}
function toast(t){const x=$('toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1700)}
$('historyOpen').onclick=openHistory;$('historyResult').onclick=openHistory;$('historyClose').onclick=closeHistory;$('drawerBackdrop').onclick=closeHistory;$('brandHome').onclick=()=>{state.playing=false;showScreen('homeScreen')};$('newCase').onclick=()=>{state.playing=false;$('crimeInput').value='';state.severity=55;showScreen('homeScreen')};$('soundToggle').onclick=()=>{state.sound=!state.sound;localStorage.setItem('courtSound',state.sound?'on':'off');$('soundToggle').textContent=state.sound?'🔊 Sound On':'🔇 Sound Off';if(!state.sound&&'speechSynthesis'in window)window.speechSynthesis.cancel()};$('soundToggle').textContent=state.sound?'🔊 Sound On':'🔇 Sound Off';
