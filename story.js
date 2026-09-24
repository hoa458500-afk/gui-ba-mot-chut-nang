(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const story = $('#story'), cat = $('#kitten'), headline = $('#headline'), caption = $('#caption');
  const copy = $('.copy-area'), action = $('#main-action'), label = $('#action-label');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scenes = [
    {title:'Bà ơi,\ncó nắng gửi tới!', caption:'Có một bé mèo muốn chào bà buổi sáng.', eyebrow:'một lời chào bé xíu', duration:0},
    {title:'Suỵt…\nmèo vừa thức dậy.', caption:'Còn hơi ngái ngủ một xíu…', eyebrow:'buổi sáng bắt đầu rồi', duration:5200},
    {title:'Nghe nói bà\nchưa có nắng.', caption:'Nên mèo ôm cả mặt trời tới luôn.', eyebrow:'một chuyến giao hàng đặc biệt', duration:6200},
    {title:'Bà ơi,\nsáng rồi nè!', caption:'Một chiếc chào buổi sáng,\ngiao tận tay bà!', eyebrow:'mèo tới nơi rồi!', duration:7000},
    {title:'Nắng đã tới.\nBà nhận nha?', caption:'Bé mèo mang phần ấm áp nhất tới đây rồi.', eyebrow:'dành riêng cho buổi sáng của bà', duration:0},
    {title:'Hôm nay,\nmong bà thật vui.', caption:'Ăn sáng ngon một chút.\nGặp chuyện vui nhiều một chút.\nVà một ngày toàn những điều dễ thương.', eyebrow:'nắng gửi bà, vui cũng gửi bà', duration:0}
  ];
  let scene=0, elapsed=0, totalElapsed=0, lastTime=0, paused=false, sound=true, started=false;
  let petUntil=0, bubbleUntil=0, pets=0, receiveBusy=false, audioCtx, musicClock=0, noteIndex=0;
  const totalDuration=scenes.reduce((sum,s)=>sum+s.duration,0);
  const particles=[];
  const canvas=$('#sparkles'), ctx=canvas.getContext('2d');
  const sakura=window.createSakuraShower({back:$('#sakura-back'),front:$('#sakura-front'),imageUrl:'assets/sakura-petals.webp',reduced});
  let width=390,height=844, ratio=1;
  function resize(){ const rect=story.getBoundingClientRect();width=rect.width;height=rect.height;ratio=Math.min(window.devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx?.setTransform(ratio,0,0,ratio,0,0);sakura.resize(width,height,ratio); }
  resize();window.addEventListener('resize',resize);
  function setFrame(frame){const col=frame%4,row=Math.floor(frame/4);cat.style.setProperty('--col',col);cat.style.setProperty('--row',row);}
  function writeTitle(value){headline.replaceChildren(...value.split('\n').flatMap((line,i)=>i?[document.createElement('br'),document.createTextNode(line)]:[document.createTextNode(line)]));}
  function updateProgress(){
    const segments=$$('.progress span');
    segments.forEach((part,index)=>{let value=index<scene-1?100:0;if(index===scene-1)value=scenes[scene].duration?Math.min(elapsed/scenes[scene].duration*100,100):55;if(scene===5)value=100;part.style.setProperty('--p',`${value}%`);});
    $('.progress').setAttribute('aria-valuenow',String(scene===5?100:Math.min(95,Math.round(totalElapsed/totalDuration*90))));
  }
  function $$(selector){return Array.from(document.querySelectorAll(selector));}
  function setScene(next){
    scene=next;elapsed=0;story.dataset.scene=String(scene);story.classList.toggle('playing',scene>0&&scene<4);
    $('.playback').hidden=scene===0||scene===5;
    action.disabled=scene>0&&scene<4;
    $('.action-area').inert=scene>0&&scene<4;
    writeTitle(scenes[scene].title);caption.textContent=scenes[scene].caption;$('#eyebrow').textContent=scenes[scene].eyebrow;
    copy.classList.remove('changing');void copy.offsetWidth;copy.classList.add('changing');
    cat.setAttribute('aria-label',scene===0?'Đánh thức bé mèo và mở lời chào buổi sáng':scene===4?'Nhận nắng từ bé mèo':'Xoa đầu bé mèo');
    label.textContent=scene===0?'Mở một chút nắng':scene===4?'Nhận một chút nắng':'Xoa đầu mèo một cái';
    $('#hint').textContent=scene===4?'Bấm vào mặt trời cũng được nha.':'Một món quà nhỏ cho buổi sáng của bà.';
    $('#replay').hidden=scene!==5;
    $('#pause').hidden=scene===4;
    setFrame(scene===0?0:scene===1?1:scene===3?6:4);
    if(scene===3)burst(width*.5,height*.58,40);
    if(scene===5){setFrame(7);action.focus({preventScroll:true});}
    updateProgress();
  }
  function initAudio(){try{if(!audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioCtx=new AC();}if(audioCtx?.state==='suspended')audioCtx.resume().catch(()=>{});}catch{audioCtx=null;}}
  function tone(freq,duration=.6,volume=.025,delay=0,type='sine'){
    if(!sound||!audioCtx||audioCtx.state!=='running'||paused||document.hidden)return;
    try{const now=audioCtx.currentTime+delay,osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type=type;osc.frequency.value=freq;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.014);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+duration+.03);}catch{}
  }
  function chime(){[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,1.1,.045,i*.095));}
  function music(dt){
    if(!started||paused||scene===0)return;musicClock+=dt;
    if(musicClock>570){musicClock%=570;const melody=[523.25,0,659.25,783.99,659.25,0,587.33,0,523.25,659.25,880,783.99,659.25,0,587.33,0];const freq=melody[noteIndex%melody.length];if(freq)tone(freq,.95,.018);if(noteIndex%4===0)tone([130.81,174.61,196,130.81][Math.floor(noteIndex/4)%4],1.7,.017,0,'triangle');noteIndex++;}
  }
  function burst(x,y,count=45){if(reduced||!ctx)return;for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,speed=70+Math.random()*160;particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-65,life:2.2+Math.random()*1.8,maxLife:4,size:2+Math.random()*5,rotation:Math.random()*6.28,star:i%3===0});}}
  function dust(dt){
    if(!ctx)return;ctx.clearRect(0,0,width,height);
    if(!reduced&&scene>0&&Math.random()<dt*.016&&particles.length<70)particles.push({x:Math.random()*width,y:height*.65+Math.random()*height*.35,vx:Math.random()*10-5,vy:-15-Math.random()*15,life:3,maxLife:3,size:1+Math.random()*2,rotation:0,star:false});
    for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt/1000;if(p.life<=0){particles.splice(i,1);continue;}p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.vx*=Math.pow(.985,dt/16);if(p.star)p.vy+=dt*.025;ctx.save();ctx.globalAlpha=Math.min(1,p.life/1.1)*.85;ctx.translate(p.x,p.y);ctx.rotate(p.rotation+=dt*.001);ctx.fillStyle=p.star?'#ec9e24':'#fff8c9';ctx.shadowBlur=p.star?6:9;ctx.shadowColor='#ffce60';if(p.star){ctx.beginPath();for(let j=0;j<8;j++){const a=j*Math.PI/4,r=j%2?p.size*.3:p.size;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();}else{ctx.beginPath();ctx.arc(0,0,p.size,0,6.29);ctx.fill();}ctx.restore();}
  }
  function start(){initAudio();paused=false;started=true;receiveBusy=false;totalElapsed=0;musicClock=0;noteIndex=0;pets=0;petUntil=0;bubbleUntil=0;particles.length=0;sakura.reset();cat.classList.remove('petted');$('#bubble').classList.remove('visible');story.classList.remove('paused','sakura-active');$('#pause').setAttribute('aria-label','Tạm dừng hoạt cảnh');setScene(1);if(reduced){setScene(4);}tone(523.25,.7,.035);}
  function receive(){if(receiveBusy)return;receiveBusy=true;paused=false;story.classList.remove('paused');initAudio();chime();burst(width*.5,height*.57,85);$('.flash').classList.remove('burst');void $('.flash').offsetWidth;$('.flash').classList.add('burst');setScene(5);sakura.start();story.classList.add('sakura-active');petUntil=1500;receiveBusy=false;}
  function pet(){if(scene===0){start();return;}if(scene===4){receive();return;}initAudio();pets++;const lines=['Meo~ thích quá! ♡','Được xoa đầu là mèo vui cả sáng.','Thêm một chút vui, gửi bà nè!'];$('#bubble').textContent=lines[(pets-1)%lines.length];$('#bubble').classList.add('visible');bubbleUntil=2600;petUntil=1100;cat.classList.remove('petted');void cat.offsetWidth;cat.classList.add('petted');setFrame(7);burst(width*.5,height*.53,22);tone(783.99,.22,.028);tone(1046.5,.35,.022,.12);}
  action.addEventListener('click',()=>{if(scene===0)start();else if(scene===4)receive();else pet();});
  cat.addEventListener('click',pet);$('#replay').addEventListener('click',start);
  $('#skip').addEventListener('click',()=>{paused=false;story.classList.remove('paused');receive();});
  $('#sound').addEventListener('click',()=>{sound=!sound;$('#sound').setAttribute('aria-pressed',String(sound));$('#sound').setAttribute('aria-label',sound?'Tắt âm thanh':'Bật âm thanh');if(sound){initAudio();tone(659.25,.25,.025);}});
  $('#pause').addEventListener('click',()=>{paused=!paused;story.classList.toggle('paused',paused);$('#pause').setAttribute('aria-label',paused?'Tiếp tục hoạt cảnh':'Tạm dừng hoạt cảnh');if(!paused)initAudio();});
  document.addEventListener('visibilitychange',()=>{lastTime=performance.now();if(document.hidden){audioCtx?.suspend().catch(()=>{});}else if(sound&&!paused){audioCtx?.resume().catch(()=>{});}});
  if(window.matchMedia('(pointer:fine)').matches&&!reduced){story.addEventListener('pointermove',event=>{const rect=story.getBoundingClientRect();story.style.setProperty('--mx',`${((event.clientX-rect.left)/rect.width-.5)*-9}px`);story.style.setProperty('--my',`${((event.clientY-rect.top)/rect.height-.5)*-6}px`);});}
  const assets=['assets/morning.webp','assets/kitten.png','assets/sakura-petals.webp'];Promise.all(assets.map(src=>new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>resolve(false);image.src=src;}))).then(results=>{if(results.some(ok=>!ok))$('#hint').textContent='Hình chưa tải đủ. Bà tải lại trang giúp mèo nha.';});
  function tick(now){
    const dt=Math.min(lastTime?now-lastTime:0,80);lastTime=now;
    if(!paused&&!document.hidden){
      elapsed+=dt;music(dt);dust(dt);sakura.update(dt);
      if(petUntil>0){petUntil-=dt;if(petUntil<=0)cat.classList.remove('petted');}
      if(bubbleUntil>0){bubbleUntil-=dt;if(bubbleUntil<=0)$('#bubble').classList.remove('visible');}
      if(petUntil<=0){
        if(scene===1)setFrame(elapsed<2600?1:Math.floor(elapsed/190)%19===0?3:2);
        else if(scene===2)setFrame(Math.floor(elapsed/150)%22===0?5:4);
        else if(scene===3)setFrame(Math.floor(elapsed/1300)%3===0?5:6);
        else if(scene===4)setFrame(Math.floor(elapsed/180)%22===0?5:4);
        else if(scene===5)setFrame(Math.floor(elapsed/2400)%3===0?7:6);
      }
      if(scene>0&&scene<4){totalElapsed+=dt;updateProgress();if(elapsed>=scenes[scene].duration)setScene(scene+1);}
    }
    requestAnimationFrame(tick);
  }
  setScene(0);requestAnimationFrame(tick);
})();
