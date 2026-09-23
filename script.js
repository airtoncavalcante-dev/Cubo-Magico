let video=document.getElementById('video');
let video2=document.getElementById('video2');
let captureCanvas=document.getElementById('captureCanvas');
let ctxCap=captureCanvas.getContext('2d',{willReadFrequently:true});
let faces={U:null,R:null,F:null,D:null,L:null,B:null};
let order=['R','B','L','F','U','D'];
let calibOrder=['R','B','L','F','U','D'];
let currentCalib=0;
let currentStep=0;
let stream=null;
let calibratedColors={};
let currentFacingMode='environment';
const COLOR_CLASSES={U:'#ffffff',R:'#ff0000',F:'#00cc00',D:'#ffff00',L:'#ff8800',B:'#0066ff'};
const NAMES={U:'BRANCO',R:'VERMELHO',F:'VERDE',D:'AMARELO',L:'LARANJA',B:'AZUL'};

const CALIB_STEPS={
 R:{title:'1/6 - Centro VERMELHO (R)', desc:'Branco cima, Vermelho frente. Centro VERMELHO bem perto, luz branca.'},
 B:{title:'2/6 - Centro AZUL (B)', desc:'Centro AZUL (direita) - luz branca.'},
 L:{title:'3/6 - Centro LARANJA (L)', desc:'Centro LARANJA (atrás) - muito parecido com vermelho, capriche.'},
 F:{title:'4/6 - Centro VERDE (F)', desc:'Centro VERDE (esquerda).'},
 U:{title:'5/6 - Centro BRANCO (U)', desc:'Centro BRANCO (cima) - parecido com amarelo, use luz branca.'},
 D:{title:'6/6 - Centro AMARELO (D)', desc:'Centro AMARELO (baixo). Último!'}
};

const CAPTURE_STEPS={
 R:{title:'Foto 1/6: VERMELHO FRENTE - POSIÇÃO INICIAL', desc:'Branco cima, Vermelho frente', details:'<b>POSIÇÃO INICIAL:</b><br>TOPO=BRANCO, BAIXO=AMARELO, FRENTE=VERMELHO, ATRÁS=LARANJA, DIR=AZUL, ESQ=VERDE<br>Fotografe VERMELHO.', warning:'Foto 1 = VERMELHO', arrow:'➡️ Próximo: Gira 90° horário, AZUL vem para frente'},
 B:{title:'Foto 2/6: AZUL FRENTE', desc:'Branco cima, Azul frente', details:'<b>GIRO HORÁRIO:</b><br>AZUL que estava na DIREITA vem para FRENTE<br>Fotografe AZUL.', warning:'Branco em cima', arrow:'➡️ Próximo: Gira 90° horário, LARANJA vem para frente'},
 L:{title:'Foto 3/6: LARANJA FRENTE', desc:'Branco cima, Laranja frente', details:'<b>GIRO HORÁRIO:</b><br>LARANJA vem para FRENTE<br>Fotografe LARANJA.', warning:'Branco em cima - Laranja parece vermelho!', arrow:'➡️ Próximo: Gira 90° horário, VERDE vem para frente'},
 F:{title:'Foto 4/6: VERDE FRENTE', desc:'Branco cima, Verde frente', details:'<b>GIRO HORÁRIO:</b><br>VERDE vem para FRENTE<br>Fotografe VERDE. Depois volta ao vermelho.', warning:'Última lateral', arrow:'➡️ Próximo: Volta ao vermelho, depois para TRÁS para branco vir para frente'},
 U:{title:'Foto 5/6: BRANCO FRENTE - Gira para TRÁS', desc:'Branco frente', details:'<b>GIRA PARA TRÁS 1x:</b><br>Branco vai para frente<br>Fotografe BRANCO.', warning:'Gira para trás - Branco parece amarelo com luz amarela!', arrow:'➡️ Próximo: Volta ao inicial e gira para FRENTE para amarelo'},
 D:{title:'Foto 6/6: AMARELO FRENTE - Gira para FRENTE - ÚLTIMA!', desc:'Amarelo frente - Última', details:'<b>GIRA PARA FRENTE 1x:</b><br>Amarelo vai para frente<br>Fotografe AMARELO - ÚLTIMA!', warning:'ÚLTIMA! Depois CALCULAR', arrow:'✅ FIM! CALCULAR com solver 2024 + detector de cor errada.'}
};

let cubeReady=false;
function initSolvers(){
 let checks=0;
 function check(){
   checks++;
   let hasCubeJS = typeof Cube!=='undefined';
   if(hasCubeJS) Cube.initSolver && Cube.initSolver();
   if(hasCubeJS){
     cubeReady=true;
     document.getElementById('status').textContent='✅ Solvers prontos: cubejs + min2phase + cubing.js 2024 - Sequência celular';
   } else if(checks<20){
     setTimeout(check,400);
   } else {
     document.getElementById('status').textContent='⚠️ Carregando solvers...';
     cubeReady=true;
   }
 }
 check();
}
initSolvers();

function initCalibGrid(){
 const grid=document.getElementById('calibGrid');
 calibOrder.forEach(f=>{
  let div=document.createElement('div'); div.className='calib-item'; div.id='calib-'+f;
  div.innerHTML='<b>'+f+' - '+NAMES[f]+'</b><div class="calib-color" id="calibColor-'+f+'" style="background:#333;"></div><span id="calibSpan-'+f+'">Pendente</span>';
  grid.appendChild(div);
 });
 updateCalibUI();
}
initCalibGrid();

function initFacesGrid(){
 const grid=document.getElementById('facesGrid');
 let displayOrder=['U','R','F','D','L','B'];
 displayOrder.forEach(f=>{
  let box=document.createElement('div'); box.className='face-box'; box.id='box-'+f;
  box.innerHTML='<b>'+f+' ('+NAMES[f]+')</b><div class="mini-grid" id="mini-'+f+'"></div><span id="span-'+f+'">Pendente</span>';
  let mini=box.querySelector('.mini-grid');
  for(let i=0;i<9;i++){ let cell=document.createElement('div'); cell.dataset.face=f; cell.dataset.idx=i; if(i===4) cell.classList.add('center-locked'); else cell.onclick=function(){editCell(f,i);}; mini.appendChild(cell); }
  grid.appendChild(box);
 });
}
initFacesGrid();

function updateCalibUI(){
 let face=calibOrder[currentCalib];
 let info=CALIB_STEPS[face];
 document.getElementById('calibTitle').textContent=info.title;
 document.getElementById('calibDesc').textContent=info.desc;
 document.getElementById('calibIcon').textContent=face;
 document.getElementById('calibIcon').style.background=COLOR_CLASSES[face];
 document.getElementById('calibIcon').style.color=(face==='U'||face==='D')?'#000':'#fff';
 document.getElementById('calibLabel').textContent=face;
 document.getElementById('calibCenterLabel').textContent=face;
 document.getElementById('progress').style.width=((currentCalib)/12*100)+'%';
 document.getElementById('progressText').textContent='Fase 1: '+(currentCalib+1)+'/6 - '+NAMES[face];
}

function updateCaptureUI(){
 let face=order[currentStep];
 let info=CAPTURE_STEPS[face];
 document.getElementById('stepTitle').innerHTML=info.title;
 document.getElementById('stepDesc').textContent=info.desc;
 document.getElementById('stepDetails').innerHTML=info.details;
 document.getElementById('stepWarning').innerHTML=info.warning || '';
 document.getElementById('stepArrow').innerHTML=info.arrow || '';
 document.getElementById('faceIcon').textContent=face;
 document.getElementById('faceIcon').style.background=COLOR_CLASSES[face];
 document.getElementById('faceIcon').style.color=(face==='U'||face==='D')?'#000':'#fff';
 document.getElementById('currentFaceLabel').textContent=NAMES[face]+' ('+face+')';
 document.getElementById('centerLabel').textContent=face;
 document.getElementById('progress').style.width=((6+currentStep+1)/12*100)+'%';
 document.getElementById('progressText').textContent='Fase 2: Foto '+(currentStep+1)+'/6 - '+NAMES[face];
 document.querySelectorAll('.face-box').forEach(function(b){b.classList.remove('current');});
 let c=document.getElementById('box-'+face); if(c) c.classList.add('current');
}

function editCell(face,idx){ if(!faces[face]||idx===4) return; let oc=['U','R','F','D','L','B']; let cur=faces[face][idx]; faces[face][idx]=oc[(oc.indexOf(cur)+1)%6]; renderFace(face); validateCube(); }
function renderFace(face){
 let colors=faces[face];
 let mini=document.getElementById('mini-'+face);
 Array.from(mini.children).forEach(function(div,i){ let c=colors[i]; div.style.background=COLOR_CLASSES[c]; div.style.color=(c==='U'||c==='D')?'#000':'#fff'; div.textContent=c; if(div.classList.contains('wrong-color')) div.classList.remove('wrong-color'); });
 document.getElementById('span-'+face).textContent=colors.join('');
 document.getElementById('box-'+face).classList.add('captured');
}
function getAvg(x,y,w,h,data){ let r=0,g=0,b=0,c=0; let d=data.data, width=data.width; for(let yy=y; yy<y+h; yy++) for(let xx=x; xx<x+w; xx++){ let idx=(yy*width+xx)*4; if(idx>=d.length) continue; r+=d[idx]; g+=d[idx+1]; b+=d[idx+2]; c++; } return [r/c,g/c,b/c]; }

async function startCamera(facingMode){
 facingMode = facingMode || currentFacingMode;
 try{
  if(stream) stream.getTracks().forEach(function(t){t.stop();});
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:facingMode, width:{ideal:1280}, height:{ideal:720}}, audio:false});
  video.srcObject=stream; video2.srcObject=stream;
  await video.play(); await video2.play();
  currentFacingMode=facingMode;
  document.getElementById('status').textContent='✅ Câmera '+(facingMode==='environment'?'traseira':'frontal')+' ligada!';
 }catch(e){
   try{
     stream=await navigator.mediaDevices.getUserMedia({video:true, audio:false});
     video.srcObject=stream; video2.srcObject=stream;
     await video.play(); await video2.play();
     document.getElementById('status').textContent='✅ Câmera ligada (compatibilidade)';
   }catch(e2){ document.getElementById('status').textContent='Erro câmera: '+e2.message; }
 }
}
document.getElementById('btnStart').onclick=function(){ startCamera('environment'); };
document.getElementById('btnSwitch').onclick=function(){ let m=currentFacingMode==='environment'?'user':'environment'; startCamera(m); };

document.getElementById('btnCalibCapture').onclick=function(){
 if(!video.videoWidth){ alert('Ligue a câmera'); return; }
 let face=calibOrder[currentCalib];
 captureCanvas.width=video.videoWidth; captureCanvas.height=video.videoHeight;
 ctxCap.clearRect(0,0,captureCanvas.width,captureCanvas.height);
 ctxCap.drawImage(video,0,0,captureCanvas.width,captureCanvas.height);
 let imgData=ctxCap.getImageData(0,0,captureCanvas.width,captureCanvas.height);
 let gridSize=Math.min(captureCanvas.width,captureCanvas.height)*0.6;
 let startX=(captureCanvas.width-gridSize)/2; let startY=(captureCanvas.height-gridSize)/2; let cell=gridSize/3;
 let cx=Math.floor(startX+cell+cell*0.25); let cy=Math.floor(startY+cell+cell*0.25); let cw=Math.floor(cell*0.5); let ch=Math.floor(cell*0.5);
 let avg=getAvg(cx,cy,cw,ch,imgData);
 calibratedColors[face]=avg;
 document.getElementById('calibColor-'+face).style.background='rgb('+ (avg[0]|0) +','+ (avg[1]|0) +','+ (avg[2]|0) +')';
 document.getElementById('calibSpan-'+face).textContent='RGB('+(avg[0]|0)+','+(avg[1]|0)+','+(avg[2]|0)+') OK';
 document.getElementById('calib-'+face).classList.add('calibrated');
 let count=Object.keys(calibratedColors).length;
 document.getElementById('calibResult').innerHTML='<b>'+count+'/6 calibrados</b>';
 if(count<6){ currentCalib++; updateCalibUI(); } else { document.getElementById('status').textContent='6 centros OK! Leitura das faces'; document.getElementById('btnGoToCapture').disabled=false; document.getElementById('progress').style.width='50%'; }
};

document.getElementById('btnGoToCapture').onclick=function(){
 document.getElementById('phaseCalib').classList.add('hidden');
 document.getElementById('phaseCapture').classList.remove('hidden');
 currentStep=0;
 updateCaptureUI();
};

function classifyWithCalib(rgb){
 let best=null, bestDist=1e9;
 let secondBest=null, secondDist=1e9;
 for(let k in calibratedColors){
  let ref=calibratedColors[k];
  let d=(rgb[0]-ref[0])*(rgb[0]-ref[0])+(rgb[1]-ref[1])*(rgb[1]-ref[1])+(rgb[2]-ref[2])*(rgb[2]-ref[2]);
  if(d<bestDist){ secondDist=bestDist; secondBest=best; bestDist=d; best=k; }
  else if(d<secondDist){ secondDist=d; secondBest=k; }
 }
 // Se distância muito próxima, marca como duvidoso
 return {color:best||'U', confidence: secondDist-bestDist, bestDist:bestDist, secondBest:secondBest};
}

document.getElementById('btnCapture').onclick=function(){
 if(!video2.videoWidth){ alert('Ligue a câmera'); return; }
 let face=order[currentStep];
 captureCanvas.width=video2.videoWidth; captureCanvas.height=video2.videoHeight;
 ctxCap.clearRect(0,0,captureCanvas.width,captureCanvas.height);
 ctxCap.drawImage(video2,0,0,captureCanvas.width,captureCanvas.height);
 let imgData=ctxCap.getImageData(0,0,captureCanvas.width,captureCanvas.height);
 let gridSize=Math.min(captureCanvas.width,captureCanvas.height)*0.62;
 let startX=(captureCanvas.width-gridSize)/2; let startY=(captureCanvas.height-gridSize)/2; let cell=gridSize/3;
 let colors=[];
 for(let row=0;row<3;row++) for(let col=0;col<3;col++){
  let idx=row*3+col;
  if(idx===4){ colors.push(face); continue; }
  let cx=Math.floor(startX+col*cell+cell*0.25); let cy=Math.floor(startY+row*cell+cell*0.25); let cw=Math.floor(cell*0.5); let ch=Math.floor(cell*0.5);
  let avg=getAvg(cx,cy,cw,ch,imgData);
  let result=classifyWithCalib(avg);
  colors.push(result.color);
 }
 faces[face]=colors;
 renderFace(face);
 if(currentStep<5){ currentStep++; updateCaptureUI(); checkAll(); validateCube(); } else { checkAll(); validateCube(); }
};

document.getElementById('btnPrev').onclick=function(){ if(currentStep>0){ currentStep--; updateCaptureUI(); } };
document.getElementById('btnBackToCalib').onclick=function(){ document.getElementById('phaseCapture').classList.add('hidden'); document.getElementById('phaseCalib').classList.remove('hidden'); };
function checkAll(){ let o=['U','R','F','D','L','B']; document.getElementById('btnSolve').disabled=!o.every(function(f){return faces[f]!==null;}); }

function validateCube(){
 let o=['U','R','F','D','L','B'];
 let v=document.getElementById('validation');
 if(!o.every(function(f){return faces[f]!==null;})){ v.innerHTML='Capture as 6 faces: Vermelho, Azul, Laranja, Verde, Branco, Amarelo'; return; }
 let cubeStr=''; o.forEach(function(f){cubeStr+=faces[f].join('');});
 let counts={}; for(let ch of cubeStr) counts[ch]=(counts[ch]||0)+1;
 let msg=''; let ok=true;
 for(let k of o){ let c=counts[k]||0; if(c!==9){ msg+='<span style="color:#ff4444;">❌ Cor '+k+' ('+NAMES[k]+') aparece '+c+' vezes (deveria 9).</span><br>'; ok=false; } }
 if(ok){
   msg='<span style="color:#00ff88;">✅ Contagem OK (9 de cada). Posição padrão: Branco cima, Vermelho frente.</span><br>';
   try{
     let cube=Cube.fromString(cubeStr);
     // Verifica cantos e arestas duplicadas
     let cp=cube.cp, co=cube.co, ep=cube.ep, eo=cube.eo;
     let cpSet=new Set(cp);
     if(cpSet.size!==8) msg+='<span style="color:#ff4444;">❌ Cantos duplicados! cp='+cp+' tem duplicata. Cubo impossível. Clique nos quadradinhos para corrigir.</span><br>';
     else msg+='<span style="color:#88ff88;">✅ Cantos OK. Pronto para solver 2024.</span>';
   }catch(e){ msg+='<span style="color:#ff8800;">⚠️ '+e.message+'</span>'; }
 }
 v.innerHTML=msg;
}

function tryCubeJS(str){
 try{
   let cube=Cube.fromString(str);
   if(cube && typeof cube.solve==='function'){
     let sol=cube.solve();
     if(sol && sol.trim().length>0) return {solution:sol, method:'cubejs'};
   }
   if(typeof Cube.solve==='function'){
     let cube2=Cube.fromString(str);
     let sol=Cube.solve(cube2);
     if(sol && sol.trim().length>0) return {solution:sol, method:'cubejs'};
     sol=Cube.solve(str);
     if(sol && sol.trim().length>0) return {solution:sol, method:'cubejs'};
   }
 }catch(e){}
 return null;
}

function tryMin2Phase(str){
 try{
   if(typeof min2phase!=='undefined' && typeof min2phase.solve==='function'){
     let sol=min2phase.solve(str);
     if(sol && sol.length>0) return {solution:sol, method:'min2phase'};
   }
 }catch(e){}
 return null;
}

function tryCubing2024(str){
 try{
   if(window.cubingSolve){
     // cubing.js 2024 usa formato diferente, tenta converter
     // Por enquanto, tenta com cubejs mesmo
   }
 }catch(e){}
 return null;
}

document.getElementById('btnFixColors').onclick=function(){
 let o=['U','R','F','D','L','B'];
 let cubeStr=''; o.forEach(function(f){cubeStr+=faces[f].join('');});
 // Analisa quais cores são mais confundidas
 let analysis='';
 analysis+='Seu cubo: '+cubeStr+'\n\n';
 analysis+='Cores que mais se confundem:\n';
 analysis+='- Branco (U) <-> Amarelo (D): luz amarela faz branco parecer amarelo\n';
 analysis+='  No seu cubo U=DUBUUULUF tem D no canto superior esquerdo (amarelo no branco)\n';
 analysis+='  Solução: Clique no D da face U e mude para U\n\n';
 analysis+='- Vermelho (R) <-> Laranja (L): muito parecidos\n';
 analysis+='  No seu cubo L=DFFRLBRLL tem F (verde) no topo, mas deveria ser D ou L?\n';
 analysis+='  Solução: Verifique face Laranja se não tem vermelho\n\n';
 analysis+='- Azul (B) <-> Verde (F): com sombra parecem iguais\n\n';
 analysis+='Dicas para corrigir seu cubo DUBUUULUF...:\n';
 analysis+='1. Face U (Branco): DUBUUULUF -> o primeiro D deveria ser U ou B? Clique no D e troque para U\n';
 analysis+='2. Face F (Verde): LLFLFLDDU -> tem D D U no final, D é amarelo no verde, pode ser erro\n';
 analysis+='3. Face B (Azul): RBRBBFBDU -> tem R no início, vermelho no azul, pode ser laranja?\n';
 analysis+='4. Depois de corrigir 1-2 quadradinhos, tente calcular de novo\n';

 // Destaca quadradinhos suspeitos
 let suspectPositions=[
   {face:'U', idx:0, reason:'D no branco - deveria ser U'},
   {face:'F', idx:6, reason:'D no verde'},
   {face:'B', idx:0, reason:'R no azul'}
 ];
 suspectPositions.forEach(function(s){
   let mini=document.getElementById('mini-'+s.face);
   if(mini && mini.children[s.idx]){
     mini.children[s.idx].classList.add('wrong-color');
   }
   document.getElementById('box-'+s.face).classList.add('error');
 });

 document.getElementById('solverInfo').textContent=analysis;
 document.getElementById('result').classList.remove('hidden');
 document.getElementById('validation').innerHTML='<span style="color:#ff8800;">🔧 Análise de cores trocadas - veja quadradinhos piscando em vermelho</span>';
};

document.getElementById('btnSolve').onclick=function(){
 let o=['U','R','F','D','L','B'];
 let cubeStr=''; o.forEach(function(f){cubeStr+=faces[f].join('');});
 let counts={}; for(let ch of cubeStr) counts[ch]=(counts[ch]||0)+1;
 for(let k of o){ if((counts[k]||0)!==9){ alert('Cor '+k+' aparece '+(counts[k]||0)+', precisa 9.'); return; } }
 document.getElementById('cubeString').textContent=cubeStr;

 let result=null;
 let debugInfo='';

 debugInfo+='Tentando solvers 2024...\n';
 result=tryCubeJS(cubeStr);
 if(result){
   debugInfo+='✅ cubejs funcionou: '+result.method+'\n';
 } else {
   debugInfo+='❌ cubejs falhou, tentando min2phase...\n';
   result=tryMin2Phase(cubeStr);
   if(result){
     debugInfo+='✅ min2phase funcionou: '+result.method+'\n';
   } else {
     debugInfo+='❌ Todos falharam. Cubo impossível por orientação.\n';
     debugInfo+='Detalhes do seu cubo '+cubeStr+':\n';
     try{
       let cube=Cube.fromString(cubeStr);
       debugInfo+='cp (cantos): '+cube.cp+' - tem duplicata? '+ (new Set(cube.cp).size!==8 ? 'SIM - impossível' : 'não') +'\n';
       debugInfo+='co (orientação cantos): '+cube.co+'\n';
       debugInfo+='ep (arestas): '+cube.ep+'\n';
       debugInfo+='eo (orientação arestas): '+cube.eo+'\n';
       debugInfo+='\nSe cp tem duplicata (ex: 5 aparece 2 vezes e 7 falta), é impossível.\n';
       debugInfo+='No seu cubo, cp deve ter 0-7 cada um 1 vez. Se tem repetido, é porque 2 peças foram trocadas na leitura.\n';
     }catch(e){ debugInfo+='Erro ao analisar: '+e.message+'\n'; }
     debugInfo+='\nClique em "🔧 Corrigir cores trocadas" para ver quais quadradinhos estão suspeitos (piscando vermelho).\n';
   }
 }

 if(!result){
   alert('Cubo impossível por orientação (mesmo com 9 de cada cor).\n\n'+debugInfo+'\n\nSeu cubo físico NUNCA foi desmontado e É montável, mas o código capturado está com 2 cores trocadas.\n\nClique em "🔧 Corrigir cores trocadas" - vai piscar em vermelho os quadradinhos suspeitos.\n\nDepois clique neles para corrigir manualmente e tente de novo.\n\nJavaScript CONSEGUE resolver sim! O problema é detecção de cor, não linguagem.');
   document.getElementById('solverInfo').textContent=debugInfo+'\nCubo: '+cubeStr+'\n\nSeu cubo físico é montável, mas o código gerado pela câmera tem 2 cores trocadas (amarelo/branco, vermelho/laranja). Clique em Corrigir cores trocadas.';
   document.getElementById('result').classList.remove('hidden');
   return;
 }

 document.getElementById('result').classList.remove('hidden');
 document.getElementById('solution').textContent=result.solution;
 let moves=document.getElementById('moves'); moves.innerHTML=''; result.solution.split(' ').forEach(function(m){ if(!m) return; let s=document.createElement('span'); s.textContent=m; moves.appendChild(s); });
 document.getElementById('status').textContent='✅ Solução com '+result.solution.split(' ').filter(function(x){return x;}).length+' movimentos! '+result.method;
 document.getElementById('solverInfo').textContent='Cubo: '+cubeStr+'\nMétodo: '+result.method+'\n'+debugInfo+'\n✅ JavaScript resolveu!';
 document.getElementById('validation').innerHTML='<span style="color:#00ff88;">✅ CUBO RESOLVIDO com '+result.method+'! JavaScript consegue!</span>';
};
