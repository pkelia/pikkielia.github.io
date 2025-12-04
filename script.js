// ------------------------------
// Replace the firebaseConfig object in initFirebase() with your project's config
// ------------------------------
function initFirebase(){
  // ==== REPLACE the following object with YOUR firebase config ====
  // Create a Firebase project (instructions below) and paste the config here.
  const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "SENDER_ID",
    appId: "APP_ID"
  };
  // ===== do not change below =====
  if(!window.firebase || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
}
initFirebase();

// ------------- Leaderboard read/write -------------
function saveScoreToFirebase(name, quiz, scoreText){
  try {
    const ref = firebase.database().ref('scores');
    const newRef = ref.push();
    newRef.set({
      name: name,
      quiz: quiz,
      score: scoreText,
      ts: Date.now()
    });
  } catch(e){ console.error('Firebase write error', e) }
}

function loadLeaderboardFromFirebase(limit=50){
  const body = document.getElementById('leaderboardBody');
  if(!body) return;
  body.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';

  const ref = firebase.database().ref('scores').orderByChild('ts').limitToLast(limit);
  ref.on('value', snapshot=>{
    const data = snapshot.val() || {};
    const rows = Object.keys(data).map(k => data[k]).sort((a,b)=> b.ts - a.ts);
    if(rows.length === 0){
      body.innerHTML = '<tr><td colspan="4">No scores yet</td></tr>'; return;
    }
    body.innerHTML = '';
    rows.forEach(r=>{
      const tr = document.createElement('tr');
      tr.innerHTML = <td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.quiz)}</td><td>${escapeHtml(r.score)}</td><td>${new Date(r.ts).toLocaleString()}</td>;
      body.appendChild(tr);
    });
  });
}

// Escape helper
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m] }) }

// ---------------- Quiz helper used by chapter pages ----------------
function startChapterQuiz(questionsArray, quizName){
  // UI elements
  const qContainer = document.getElementById('questionsContainer');
  const scoreEl = document.getElementById('score');
  qContainer.innerHTML = '';
  let score = 0, answered = 0, total = questionsArray.length;
  scoreEl.innerText = Score: ${score}/${total};

  questionsArray.forEach((item,qi)=>{
    const block = document.createElement('div');
    block.className = 'q-block';
    const q = document.createElement('div');
    q.className = 'quiz-question';
    q.innerText = item.q;
    block.appendChild(q);

    const optsWrap = document.createElement('div');
    optsWrap.className = 'options';
    item.options.forEach((opt,oi)=>{
      const optEl = document.createElement('div');
      optEl.className = 'option';
      optEl.innerText = opt;
      optEl.addEventListener('click', ()=>{
        // prevent double click
        if(optEl.classList.contains('selected')) return;
        // mark chosen
        optEl.classList.add('selected');
        answered++;
        if(oi === item.correct){
          optEl.classList.add('correct'); score++;
        } else {
          optEl.classList.add('wrong');
          // highlight correct
          const children = optsWrap.querySelectorAll('.option');
          if(children[item.correct]) children[item.correct].classList.add('correct');
        }
        scoreEl.innerText = Score: ${score}/${total};
      });
      optsWrap.appendChild(optEl);
    });

    block.appendChild(optsWrap);
    qContainer.appendChild(block);
  });

  // submit button handler: save to firebase and optionally open whatsapp
  const submitBtn = document.getElementById('submitScoreBtn');
  submitBtn.onclick = function(){
    const name = (document.getElementById('username') || {}).value || '';
    if(!name.trim()){ alert('Please enter your name'); return; }
    if(answered < total){
      if(!confirm('You have unanswered questions. Submit anyway?')) return;
    }
    const scoreText = ${score}/${total};
    saveScoreToFirebase(name, quizName, scoreText);
    alert('Score submitted. Thank you!');
    // open WhatsApp option (commented out — remove comment if you want auto send)
    /*
    const body = encodeURIComponent(Name: ${name}\nQuiz: ${quizName}\nScore: ${scoreText});
    window.open('https://wa.me/919398555790?text=' + body, '_blank');
    */
  };
}

// Load leaderboard on main index if present
document.addEventListener('DOMContentLoaded', ()=>{
  // If firebase initialized, load leaderboard
  try {
    if(window.firebase) loadLeaderboardFromFirebase();
  } catch(e){ console.log('No firebase yet', e) }
});