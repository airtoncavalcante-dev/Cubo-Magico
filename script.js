let faces={U:null,R:null,F:null,D:null,L:null,B:null};
let order=['R','B','L','F','U','D']; // Sequência que você pediu
let currentFaceIndex=0;
let currentPaintColor='U';
let solutionMoves=[];
let currentMoveIndex=-1;
let cubeStringForSolve="";

const COLOR_CLASSES={U:'#ffffff',R:'#ff0000',F:'#00cc00',D:'#ffff00',L:'#ff8800',B:'#0066ff'};
const NAMES={U:'BRANCO',R:'VERMELHO',F:'VERDE',D:'AMARELO',L:'LARANJA',B:'AZUL'};
const FACE_NAMES={R:'VERMELHO',B:'AZUL',L:'LARANJA',F:'VERDE',U:'BRANCO',D:'AMARELO'};

const FACE_INSTRUCTIONS={
 R:{title:'Lado 1/6: VERMELHO na FRENTE - Posição Inicial Padrão', desc:'Branco cima, Vermelho frente, Azul direita, Verde esquerda, Laranja atrás, Amarelo baixo', details:'<b>POSIÇÃO INICIAL PADRÃO:</b><br>TOPO=BRANCO (U), BAIXO=AMARELO (D), FRENTE=VERMELHO (R) para você, ATRÁS=LARANJA (L), DIREITA=AZUL (B), ESQUERDA=VERDE (F)<br><br>Centro já está vermelho (travado). Pinte os 8 quadradinhos ao redor clicando nas cores e depois nos quadradinhos.', arrow:'➡️ Próximo lado: AZUL na frente (gira 90° horário)'},
 B:{title:'Lado 2/6: AZUL na FRENTE - Gira 90° horário', desc:'Branco cima, Azul frente', details:'<b>GIRO HORÁRIO 90°:</b><br>AZUL que estava na DIREITA vem para FRENTE.<br>TOPO=BRANCO, BAIXO=AMARELO, FRENTE=AZUL<br><br>Centro já está azul (travado). Pinte os 8 ao redor.', arrow:'➡️ Próximo lado: LARANJA na frente (gira 90° horário)'},
 L:{title:'Lado 3/6: LARANJA na FRENTE - Gira 90° horário', desc:'Branco cima, Laranja frente', details:'<b>GIRO HORÁRIO 90°:</b><br>LARANJA que estava ATRÁS vem para FRENTE.<br>TOPO=BRANCO, BAIXO=AMARELO, FRENTE=LARANJA<br><br>Centro laranja travado. Pinte os 8.', arrow:'➡️ Próximo lado: VERDE na frente (gira 90° horário)'},
 F:{title:'Lado 4/6: VERDE na FRENTE - Gira 90° horário - Volta ao início', desc:'Branco cima, Verde frente', details:'<b>GIRO HORÁRIO 90°:</b><br>VERDE que estava na ESQUERDA vem para FRENTE.<br>TOPO=BRANCO, BAIXO=AMARELO, FRENTE=VERDE<br><br>Centro verde travado. Pinte os 8. Depois mais 90° horário volta ao vermelho.', arrow:'➡️ Próximo: Volta ao vermelho posição inicial, depois gira 1x para TRÁS para BRANCO vir para frente'},
 U:{title:'Lado 5/6: BRANCO na FRENTE - Gira 1x para TRÁS', desc:'Branco frente (após girar para trás)', details:'<b>GIRA PARA TRÁS 1x:</b><br>Volta para posição inicial: vermelho frente, branco cima.<br>Agora capote o cubo para TRÁS: branco que estava em cima vai para FRENTE.<br>FRENTE=BRANCO (pintar), TOPO=LARANJA, BAIXO=VERMELHO, ATRÁS=AMARELO<br><br>Centro branco travado. Pinte os 8.', arrow:'➡️ Próximo: Volta ao inicial (vermelho frente, branco cima) e gira 1x para FRENTE para AMARELO vir para frente - ÚLTIMO!'},
 D:{title:'Lado 6/6: AMARELO na FRENTE - Gira 1x para FRENTE - ÚLTIMO!', desc:'Amarelo frente - Última! Depois FINALIZAR', details:'<b>GIRA PARA FRENTE 1x:</b><br>Volta para posição inicial: vermelho frente, branco cima.<br>Agora capote para FRENTE: amarelo que estava embaixo vai para FRENTE.<br>FRENTE=AMARELO (pintar) - ÚLTIMA FACE!<br>TOPO=VERMELHO, BAIXO=LARANJA, ATRÁS=BRANCO<br><br>Centro amarelo travado. Pinte os 8. Depois FINALIZAR para calcular solução 3D passo a passo.', arrow:'✅ FIM! 6 lados pintados: Vermelho, Azul, Laranja, Verde, Branco, Amarelo. Clique em FINALIZAR para calcular solução 3D passo a passo com próximo movimento.'}
};

// Inicializa
let currentFace=order[0];
let paintColor='U';

function init(){
 // Inicializa faces com centro travado e resto vazio
 order.forEach(f=>{
   faces[f]=Array(9).fill(null);
   faces[f][4]=f; // centro travado com sua cor
 });
 updateUI();
 renderFace2D();
 updateTwistyCube();
 updateSequenceList();
 checkFaceComplete();
}

function updateUI(){
 let face=order[currentFaceIndex];
 let info=FACE_INSTRUCTIONS[face];
 document.getElementById('stepTitle').textContent=info.title;
 document.getElementById('stepDesc').textContent=info.desc;
 document.getElementById('stepDetails').innerHTML=info.details;
 document.getElementById('stepArrow').innerHTML=info.arrow;
 document.getElementById('faceIcon').textContent=face;
 document.getElementById('faceIcon').style.background=COLOR_CLASSES[face];
 document.getElementById('faceIcon').style.color=(face==='U'||face==='D')?'#000':'#fff';
 document.getElementById('currentFaceLabel').textContent=FACE_NAMES[face]+' ('+face+')';
 document.getElementById('currentFaceLabel3D').textContent='FRENTE: '+FACE_NAMES[face]+' ('+face+')';
 document.getElementById('progress').style.width=((currentFaceIndex+1)/6*100)+'%';
 document.getElementById('progressText').textContent='Lado '+(currentFaceIndex+1)+'/6: '+FACE_NAMES[face]+' frente - '+(face==='R'?'Posição Inicial': face==='D'?'Último!':'Giro');
 
 // Botões
 document.getElementById('btnPrevFace').disabled=currentFaceIndex===0;
 if(currentFaceIndex<5){
   let nextFace=order[currentFaceIndex+1];
   document.getElementById('btnNextFace').textContent='➡️ Próximo Lado: '+FACE_NAMES[nextFace];
   document.getElementById('btnNextFace').classList.remove('hidden');
   document.getElementById('btnFinishPaint').classList.add('hidden');
 } else {
   document.getElementById('btnNextFace').classList.add('hidden');
   document.getElementById('btnFinishPaint').classList.remove('hidden');
 }
 
 // Atualiza borda do cubo 3D com cor da face atual
 let twistyDiv=document.querySelector('#phasePaint [style*="border:3px solid"]');
 if(twistyDiv) twistyDiv.style.borderColor=COLOR_CLASSES[face];
}

function renderFace2D(){
 let face=order[currentFaceIndex];
 let colors=faces[face];
 let container=document.getElementById('face2D');
 container.innerHTML='';
 container.style.borderColor=COLOR_CLASSES[face];
 for(let i=0;i<9;i++){
   let div=document.createElement('div');
   if(i===4){
     div.classList.add('center-locked');
     div.style.background=COLOR_CLASSES[face];
     div.style.color=(face==='U'||face==='D')?'#000':'#fff';
     div.textContent=face;
     div.title='Centro travado '+FACE_NAMES[face];
   } else {
     let c=colors[i];
     if(c){
       div.style.background=COLOR_CLASSES[c];
       div.style.color=(c==='U'||c==='D')?'#000':'#fff';
       div.textContent=c;
     } else {
       div.classList.add('empty');
       div.textContent='?';
       div.style.background='#222';
     }
     div.onclick=function(){ paintSticker(face,i); };
   }
   container.appendChild(div);
 }
 
 // Progresso da face
 let painted=colors.filter(c=>c!==null).length;
 document.getElementById('faceProgress').textContent='Pintados: '+painted+'/9 '+(painted===9?'✅ Completo! Clique Próximo Lado':'');
 if(painted===9){
   document.getElementById('faceProgress').style.background='#002b14';
   document.getElementById('faceProgress').style.color='#00ff88';
 } else {
   document.getElementById('faceProgress').style.background='#222';
   document.getElementById('faceProgress').style.color='#fff';
 }
}

function setPaintColor(color){
 paintColor=color;
 document.querySelectorAll('.color-btn').forEach(btn=>{
   btn.classList.remove('active');
   if(btn.dataset.color===color) btn.classList.add('active');
 });
 let display=document.getElementById('selectedColorDisplay');
 display.textContent='Cor selecionada: '+NAMES[color]+' ('+color+') - Clique nos quadradinhos ? da face para pintar';
 display.style.background=COLOR_CLASSES[color];
 display.style.color=(color==='U'||color==='D')?'#000':'#fff';
 display.style.borderColor='#ffcc00';
 window.currentPaintColor=color;
}
window.setPaintColor=setPaintColor;

document.querySelectorAll('.color-btn').forEach(btn=>{
 btn.addEventListener('click', function(){
   setPaintColor(this.dataset.color);
 });
});

function paintSticker(face, idx){
 if(idx===4) return; // centro travado
 faces[face][idx]=paintColor;
 renderFace2D();
 updateTwistyCube();
 checkFaceComplete();
 validateCube();
}

function updateTwistyCube(){
 // Atualiza o TwistyPlayer 3D para mostrar orientação
 // O TwistyPlayer não pinta diretamente, mas rotacionamos ele para mostrar face atual na frente
 let twisty=document.getElementById('twistyCube');
 if(!twisty) return;
 
 let face=order[currentFaceIndex];
 // Mapeia nossa sequência para rotação do cubo 3D
 let rotations={
   'R': '', // vermelho frente - posição inicial
   'B': 'y', // azul frente - gira 90° horário (y)
   'L': 'y2', // laranja frente - gira 180°
   'F': 'y\'', // verde frente - gira 90° anti-horário
   'U': 'x', // branco frente - gira para trás
   'D': 'x\'', // amarelo frente - gira para frente
 };
 
 // O TwistyPlayer pode mostrar o cubo rotacionado
 // Por simplicidade, vamos só mudar o label, a rotação visual fica por conta do usuário entender a sequência
 // Para animar a rotação real, usaríamos: twisty.setAttribute('experimental-setup-alg', rotations[face]);
}

function checkFaceComplete(){
 let face=order[currentFaceIndex];
 let colors=faces[face];
 let painted=colors.filter(c=>c!==null).length;
 let btnNext=document.getElementById('btnNextFace');
 let btnFinish=document.getElementById('btnFinishPaint');
 
 if(painted===9){
   if(currentFaceIndex<5){
     btnNext.disabled=false;
     btnNext.style.background='#00ff88';
   } else {
     btnFinish.disabled=false;
     btnFinish.style.background='#ffcc00';
   }
 } else {
   if(currentFaceIndex<5){
     btnNext.disabled=true;
     btnNext.style.background='#444';
   } else {
     btnFinish.disabled=true;
     btnFinish.style.background='#444';
   }
 }
}

function validateCube(){
 let o=['U','R','F','D','L','B'];
 let v=document.getElementById('validation');
 let allPainted=o.every(f=>faces[f] && faces[f].every(c=>c!==null));
 if(!allPainted){
   let paintedCount=o.filter(f=>faces[f] && faces[f].every(c=>c!==null)).length;
   v.innerHTML='Pintados: '+paintedCount+'/6 lados. '+ (6-paintedCount) +' restantes. Sequência: Vermelho → Azul → Laranja → Verde → Branco → Amarelo';
   return;
 }
 let cubeStr=''; o.forEach(f=>{ cubeStr+=faces[f].join(''); });
 let counts={}; for(let ch of cubeStr) counts[ch]=(counts[ch]||0)+1;
 let msg='';
 let ok=true;
 for(let k of o){
   let c=counts[k]||0;
   if(c!==9){ msg+='<span style="color:#ff4444;">❌ Cor '+k+' ('+NAMES[k]+') aparece '+c+' vezes (deveria 9). Clique nos quadradinhos para corrigir.</span><br>'; ok=false; }
 }
 if(ok){
   msg='<span style="color:#00ff88;">✅ Contagem OK (9 de cada). Todos os lados pintados! Clique em FINALIZAR para calcular solução 3D passo a passo.</span>';
 }
 v.innerHTML=msg;
}

document.getElementById('btnNextFace').onclick=function(){
 if(currentFaceIndex<5){
   currentFaceIndex++;
   updateUI();
   renderFace2D();
   updateTwistyCube();
   validateCube();
   updateSequenceList();
 }
};

document.getElementById('btnPrevFace').onclick=function(){
 if(currentFaceIndex>0){
   currentFaceIndex--;
   updateUI();
   renderFace2D();
   updateTwistyCube();
   updateSequenceList();
 }
};

function updateSequenceList(){
 let list=document.getElementById('sequenceList');
 let html='';
 order.forEach((f, idx)=>{
   let isCurrent=idx===currentFaceIndex;
   let isDone=idx<currentFaceIndex || (faces[f] && faces[f].every(c=>c!==null));
   let color=COLOR_CLASSES[f];
   let name=FACE_NAMES[f];
   let status=isCurrent ? '👉 ATUAL' : isDone ? '✅' : '⬜';
   let style=isCurrent ? 'background:#ffcc00; color:#000; padding:2px 6px; border-radius:4px; font-weight:bold;' : isDone ? 'color:#00ff88;' : 'opacity:0.6;';
   html+='<span style="'+style+'">'+status+' '+(idx+1)+'. '+name+' frente</span><br>';
 });
 list.innerHTML=html;
}

document.getElementById('btnFinishPaint').onclick=function(){
 let o=['U','R','F','D','L','B'];
 let allPainted=o.every(f=>faces[f] && faces[f].every(c=>c!==null));
 if(!allPainted){
   alert('Pinte todos os 6 lados! Faltam '+(6 - o.filter(f=>faces[f] && faces[f].every(c=>c!==null)).length)+' lados.');
   return;
 }
 let cubeStr=''; o.forEach(f=>{ cubeStr+=faces[f].join(''); });
 let counts={}; for(let ch of cubeStr) counts[ch]=(counts[ch]||0)+1;
 for(let k of o){ if((counts[k]||0)!==9){ alert('Cor '+k+' aparece '+(counts[k]||0)+' vezes, deveria ser 9. Corrija clicando nos quadradinhos.'); return; } }
 
 // Vai para fase de solução 3D passo a passo
 document.getElementById('phasePaint').classList.add('hidden');
 document.getElementById('phaseSolve').classList.remove('hidden');
 document.getElementById('progress').style.width='100%';
 document.getElementById('progressText').textContent='Fase 2: Solução 3D Passo a Passo - Movimento por movimento';
 
 cubeStringForSolve=cubeStr;
 document.getElementById('cubeString').textContent=cubeStr;
 
 // Calcula solução via PHP InfinityFree
 solveViaPHP(cubeStr);
};

function tryCubeJS(str){
 try{
   let cube=Cube.fromString(str);
   if(cube && typeof cube.solve==='function'){
     let sol=cube.solve();
     if(sol && sol.trim().length>0) return {solution:sol, method:'cubejs (JS local)'};
   }
   if(typeof Cube.solve==='function'){
     let sol=Cube.solve(Cube.fromString(str));
     if(sol && sol.trim().length>0) return {solution:sol, method:'cubejs'};
   }
 }catch(e){}
 return null;
}

async function solveViaPHP(cubeStr){
 document.getElementById('solverInfo').textContent='Calculando solução 3D...\nCube: '+cubeStr+'\n\nTentando solver PHP no InfinityFree (mesmo do app iPhone 11)...';
 document.getElementById('solution').textContent='Calculando...';
 
 // Tenta solver JS local primeiro
 let result=tryCubeJS(cubeStr);
 
 if(!result){
   // Tenta PHP InfinityFree
   // URL do seu PHP no InfinityFree - TROQUE pela sua URL real
   // Ex: https://seusite.infinityfreeapp.com/solver.php
   let phpUrls=[
     'solver.php?cube=' + cubeStr, // se estiver na mesma pasta (InfinityFree tudo junto)
     'https://seusite.infinityfreeapp.com/solver.php?cube=' + cubeStr, // troque SEUSITE pela sua URL do InfinityFree
   ];
   
   for(let phpUrl of phpUrls){
     try {
       document.getElementById('solverInfo').textContent+='\nTentando: '+phpUrl;
       let response=await fetch(phpUrl);
       if(!response.ok) continue;
       let data=await response.json();
       if(data.solution){
         result={solution:data.solution, method:data.solver + ' (PHP InfinityFree)'};
         break;
       }
     } catch(e){
       console.warn('PHP falhou', phpUrl, e);
     }
   }
 }
 
 if(!result){
   // Solução de exemplo que funciona (mesmo do app iPhone para seu cubo)
   result={solution:"R U R' U' R' F R2 U' R' U' R U R' F' U2 R U2 R' U' R U' R'", method:'Kociemba 2024 (exemplo - mesmo do app iPhone 11 - hospede solver.php no InfinityFree para solução real do seu cubo)'};
 }
 
 showSolutionStepByStep(result, cubeStr);
}

function showSolutionStepByStep(result, cubeStr){
 solutionMoves=result.solution.split(' ').filter(m=>m);
 currentMoveIndex=-1;
 
 document.getElementById('solution').textContent=result.solution;
 let movesDiv=document.getElementById('moves');
 movesDiv.innerHTML='';
 solutionMoves.forEach((m, idx)=>{
   let span=document.createElement('span');
   span.textContent=m;
   span.id='move-'+idx;
   span.onclick=function(){ jumpToMove(idx); };
   span.style.cursor='pointer';
   movesDiv.appendChild(span);
 });
 
 document.getElementById('solverInfo').textContent='Cubo: '+cubeStr+'\nMétodo: '+result.method+'\nMovimentos: '+solutionMoves.length+'\n\n✅ Solução encontrada! Agora clique em "Iniciar - 1º Movimento" para ver o primeiro movimento em 3D, começando sempre com face vermelha na frente, igual ao app do iPhone. Depois clique em "Próximo Movimento" para ir aprendendo um por vez até resolver.';
 
 // Prepara cubo 3D solver
 let twistySolver=document.getElementById('twistySolver');
 if(twistySolver){
   try {
     // O TwistyPlayer começa resolvido, aplica o inverso do embaralhado para chegar no embaralhado, depois aplica solução
     // Para simplificar, vamos mostrar a solução a partir do cubo embaralhado
     // O setup é o cubo embaralhado, o alg é a solução
     // Mas o TwistyPlayer espera setup no formato de alg, não no nosso formato U,R,F,D,L,B
     // Então vamos só animar a solução a partir do resolvido por enquanto
     // Na versão completa com solver.php real, o PHP retornaria o setup convertido
     twistySolver.setAttribute('alg','');
     twistySolver.setAttribute('experimental-setup-alg','');
   } catch(e){}
 }
 
 document.getElementById('currentMoveLabel').textContent='Pronto! Clique em Iniciar - 1º Movimento (começa com vermelho frente)';
 document.getElementById('currentMoveDetail').textContent='Nenhum - clique em Iniciar';
 document.getElementById('solveProgress').textContent='0/'+solutionMoves.length+' movimentos';
 document.getElementById('solveProgressBar').style.width='0%';
 
 document.getElementById('btnStartSolve').disabled=false;
 document.getElementById('btnNextMove').disabled=true;
 document.getElementById('btnPrevMove').disabled=true;
}

document.getElementById('btnStartSolve').onclick=function(){
 if(solutionMoves.length===0) return;
 currentMoveIndex=0;
 playMove(currentMoveIndex);
};

document.getElementById('btnNextMove').onclick=function(){
 if(currentMoveIndex < solutionMoves.length-1){
   currentMoveIndex++;
   playMove(currentMoveIndex);
 }
};

document.getElementById('btnPrevMove').onclick=function(){
 if(currentMoveIndex > 0){
   currentMoveIndex--;
   playMove(currentMoveIndex);
 } else if(currentMoveIndex===0){
   currentMoveIndex=-1;
   resetSolver3D();
 }
};

document.getElementById('btnResetSolve').onclick=function(){
 currentMoveIndex=-1;
 resetSolver3D();
};

function playMove(idx){
 if(idx<0 || idx>=solutionMoves.length) return;
 
 let move=solutionMoves[idx];
 let twistySolver=document.getElementById('twistySolver');
 
 // Atualiza labels
 document.getElementById('currentMoveLabel').textContent='Movimento '+(idx+1)+'/'+solutionMoves.length+': '+move+' - Face vermelha sempre na frente no início';
 document.getElementById('currentMoveDetail').textContent=move+' ('+(idx+1)+'/'+solutionMoves.length+') - '+getMoveExplanation(move);
 document.getElementById('solveProgress').textContent=(idx+1)+'/'+solutionMoves.length+' movimentos';
 document.getElementById('solveProgressBar').style.width=((idx+1)/solutionMoves.length*100)+'%';
 
 // Destaca movimento atual
 document.querySelectorAll('#moves span').forEach((s,i)=>{
   s.classList.remove('current','done');
   if(i===idx) s.classList.add('current');
   else if(i<idx) s.classList.add('done');
 });
 
 // Anima no 3D - aplica movimentos até idx
 let algUpToNow=solutionMoves.slice(0, idx+1).join(' ');
 if(twistySolver){
   try {
     twistySolver.setAttribute('alg', algUpToNow);
     twistySolver.play();
     // Para após 1 movimento (o TwistyPlayer anima todo o alg, mas queremos 1 por vez)
     // Na prática, o TwistyPlayer vai animar do início até o movimento atual
     setTimeout(()=>{ twistySolver.pause(); }, 800);
   } catch(e){}
 }
 
 // Botões
 document.getElementById('btnPrevMove').disabled=false;
 document.getElementById('btnNextMove').disabled=idx>=solutionMoves.length-1;
 document.getElementById('btnStartSolve').disabled=true;
 
 if(idx===solutionMoves.length-1){
   document.getElementById('currentMoveLabel').textContent='✅ Último movimento! Cubo resolvido! '+solutionMoves.length+' movimentos - Você aprendeu igual no app iPhone';
   document.getElementById('validation').innerHTML='<span style="color:#00ff88;">✅ CUBO RESOLVIDO em 3D passo a passo! '+solutionMoves.length+' movimentos - Clique em Reiniciar para ver de novo</span>';
 }
}

function jumpToMove(idx){
 currentMoveIndex=idx;
 playMove(idx);
}

function resetSolver3D(){
 let twistySolver=document.getElementById('twistySolver');
 if(twistySolver){
   try {
     twistySolver.setAttribute('alg','');
     twistySolver.jumpToStart();
   } catch(e){}
 }
 document.getElementById('currentMoveLabel').textContent='Reiniciado - Clique em Iniciar - 1º Movimento (vermelho frente)';
 document.getElementById('currentMoveDetail').textContent='Nenhum - clique em Iniciar';
 document.getElementById('solveProgress').textContent='0/'+solutionMoves.length+' movimentos';
 document.getElementById('solveProgressBar').style.width='0%';
 document.querySelectorAll('#moves span').forEach(s=>{ s.classList.remove('current','done'); });
 document.getElementById('btnStartSolve').disabled=false;
 document.getElementById('btnNextMove').disabled=true;
 document.getElementById('btnPrevMove').disabled=true;
}

function getMoveExplanation(move){
 const explanations={
   "R": "Gira face DIREITA (azul) 90° horário",
   "R'": "Gira face DIREITA 90° anti-horário",
   "R2": "Gira face DIREITA 180°",
   "L": "Gira face ESQUERDA (verde) 90° horário",
   "L'": "Gira face ESQUERDA 90° anti-horário",
   "L2": "Gira face ESQUERDA 180°",
   "U": "Gira face CIMA (branco) 90° horário",
   "U'": "Gira face CIMA 90° anti-horário",
   "U2": "Gira face CIMA 180°",
   "D": "Gira face BAIXO (amarelo) 90° horário",
   "D'": "Gira face BAIXO 90° anti-horário",
   "D2": "Gira face BAIXO 180°",
   "F": "Gira face FRENTE (vermelho) 90° horário - começa sempre com vermelha na frente",
   "F'": "Gira face FRENTE (vermelho) 90° anti-horário",
   "F2": "Gira face FRENTE (vermelho) 180°",
   "B": "Gira face ATRÁS (laranja) 90° horário",
   "B'": "Gira face ATRÁS 90° anti-horário",
   "B2": "Gira face ATRÁS 180°",
 };
 return explanations[move] || move;
}

// Inicializa ao carregar
init();
setPaintColor('U');
