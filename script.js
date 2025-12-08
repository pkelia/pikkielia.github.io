// script.js — unified site + quiz behavior (single file)
// Real-time leaderboard (most recent first), Firestore + local fallback.

(function () {
  // ---------- Books array ----------
  const books = [
    {name:'Genesis(ఆదికాండము)', chapters:50, filePrefix:'genesis(ఆదికాండము)'},
    {name:'Exodus(నిర్గమకాండము)', chapters:40, filePrefix:'exodus(నిర్గమకాండము)'},
    {name:'Leviticus', chapters:27, filePrefix:'leviticus'},
    {name:'Numbers', chapters:36, filePrefix:'numbers'},
    {name:'Deuteronomy', chapters:34, filePrefix:'deuteronomy'},
    {name:'Joshua', chapters:24, filePrefix:'joshua'},
    {name:'Judges', chapters:21, filePrefix:'judges'},
    {name:'Ruth', chapters:4, filePrefix:'ruth'},
    {name:'1 Samuel', chapters:31, filePrefix:'1-samuel'},
    {name:'2 Samuel', chapters:24, filePrefix:'2-samuel'},
    {name:'1 Kings', chapters:22, filePrefix:'1-kings'},
    {name:'2 Kings', chapters:25, filePrefix:'2-kings'},
    {name:'1 Chronicles', chapters:29, filePrefix:'1-chronicles'},
    {name:'2 Chronicles', chapters:36, filePrefix:'2-chronicles'},
    {name:'Ezra', chapters:10, filePrefix:'ezra'},
    {name:'Nehemiah', chapters:13, filePrefix:'nehemiah'},
    {name:'Esther', chapters:10, filePrefix:'esther'},
    {name:'Job', chapters:42, filePrefix:'job'},
    {name:'Psalms', chapters:150, filePrefix:'psalms'},
    {name:'Proverbs', chapters:31, filePrefix:'proverbs'},
    {name:'Ecclesiastes', chapters:12, filePrefix:'ecclesiastes'},
    {name:'Song of Solomon', chapters:8, filePrefix:'song-of-solomon'},
    {name:'Isaiah', chapters:66, filePrefix:'isaiah'},
    {name:'Jeremiah', chapters:52, filePrefix:'jeremiah'},
    {name:'Lamentations', chapters:5, filePrefix:'lamentations'},
    {name:'Ezekiel', chapters:48, filePrefix:'ezekiel'},
    {name:'Daniel', chapters:12, filePrefix:'daniel'},
    {name:'Hosea', chapters:14, filePrefix:'hosea'},
    {name:'Joel', chapters:3, filePrefix:'joel'},
    {name:'Amos', chapters:9, filePrefix:'amos'},
    {name:'Obadiah', chapters:1, filePrefix:'obadiah'},
    {name:'Jonah', chapters:4, filePrefix:'jonah'},
    {name:'Micah', chapters:7, filePrefix:'micah'},
    {name:'Nahum', chapters:3, filePrefix:'nahum'},
    {name:'Habakkuk', chapters:3, filePrefix:'habakkuk'},
    {name:'Zephaniah', chapters:3, filePrefix:'zephaniah'},
    {name:'Haggai', chapters:2, filePrefix:'haggai'},
    {name:'Zechariah', chapters:14, filePrefix:'zechariah'},
    {name:'Malachi', chapters:4, filePrefix:'malachi'},
    {name:'Matthew', chapters:28, filePrefix:'matthew'},
    {name:'Mark', chapters:16, filePrefix:'mark'},
    {name:'Luke', chapters:24, filePrefix:'luke'},
    {name:'John', chapters:21, filePrefix:'john'},
    {name:'Acts', chapters:28, filePrefix:'acts'},
    {name:'Romans', chapters:16, filePrefix:'romans'},
    {name:'1 Corinthians', chapters:16, filePrefix:'1-corinthians'},
    {name:'2 Corinthians', chapters:13, filePrefix:'2-corinthians'},
    {name:'Galatians', chapters:6, filePrefix:'galatians'},
    {name:'Ephesians', chapters:6, filePrefix:'ephesians'},
    {name:'Philippians', chapters:4, filePrefix:'philippians'},
    {name:'Colossians', chapters:4, filePrefix:'colossians'},
    {name:'1 Thessalonians', chapters:5, filePrefix:'1-thessalonians'},
    {name:'2 Thessalonians', chapters:3, filePrefix:'2-thessalonians'},
    {name:'1 Timothy', chapters:6, filePrefix:'1-timothy'},
    {name:'2 Timothy', chapters:4, filePrefix:'2-timothy'},
    {name:'Titus', chapters:3, filePrefix:'titus'},
    {name:'Philemon', chapters:1, filePrefix:'philemon'},
    {name:'Hebrews', chapters:13, filePrefix:'hebrews'},
    {name:'James', chapters:5, filePrefix:'james'},
    {name:'1 Peter', chapters:5, filePrefix:'1-peter'},
    {name:'2 Peter', chapters:3, filePrefix:'2-peter'},
    {name:'1 John', chapters:5, filePrefix:'1-john'},
    {name:'2 John', chapters:1, filePrefix:'2-john'},
    {name:'3 John', chapters:1, filePrefix:'3-john'},
    {name:'Jude', chapters:1, filePrefix:'jude'},
    {name:'Revelation', chapters:22, filePrefix:'revelation'}
  ];

  // ---------- Utilities ----------
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function formatDate(d) {
    if (!d) return '';
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2,'0');
    const min = String(d.getMinutes()).padStart(2,'0');
    return `${dd}-${mm}-${yy} ${hh}:${min}`;
  }

  // ---------- LocalStorage fallback ----------
  function getLocalScores() {
    try { return JSON.parse(localStorage.getItem('christian_answer_scores') || '[]'); }
    catch (e) { return []; }
  }
  function saveLocalScore(entry) {
    try {
      const arr = getLocalScores();
      arr.push(entry);
      localStorage.setItem('christian_answer_scores', JSON.stringify(arr));
    } catch (e) { }
  }

  // ---------- Firebase Init ----------
  const firebaseConfig = {
    apiKey: "AIzaSyDn9ALeplhAD0BskOEpl0NIht7bF35HCSg",
    authDomain: "christian-answer-ac475.firebaseapp.com",
    databaseURL: "https://christian-answer-ac475-default-rtdb.firebaseio.com",
    projectId: "christian-answer-ac475",
    storageBucket: "christian-answer-ac475.firebasestorage.app",
    messagingSenderId: "117862103324",
    appId: "1:117862103324:web:9f1129da2c0267ffaee2d9"
  };

  let db = null;
  let unsubscribeRealtime = null;
  try {
    if (window.firebase) {
      if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
      if (firebase.firestore) db = firebase.firestore();
    }
  } catch (e) {}

  // ---------- Firestore Save (✔ FIXED) ----------
  async function saveScoreToFirestore(entry) {
    if (!db) throw new Error('Firestore not available');
    const doc = {
      name: entry.name || 'Guest',
      book: entry.book || 'Genesis',
      chapter: Number(entry.chapter) || 1,
      score: Number(entry.score) || 0,
      totalQuestions: Number(entry.totalQuestions) || 10,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    return db.collection('scores').add(doc);
  }

  // ---------- Realtime Leaderboard ----------
  function startRealtimeLeaderboard(limit = 50) {
    const el = document.getElementById('leaderboard');
    if (!el || !db) return;

    if (unsubscribeRealtime) unsubscribeRealtime();

    unsubscribeRealtime = db.collection('scores')
      .orderBy('createdAt','desc')
      .limit(limit)
      .onSnapshot(snapshot => {
        const arr = [];
        snapshot.forEach(doc => {
          const d = doc.data();
          arr.push({
            id: doc.id,
            name: d.name,
            book: d.book,
            chapter: d.chapter,
            score: d.score,
            totalQuestions: d.totalQuestions,
            createdAt: d.createdAt ? d.createdAt.toDate() : null
          });
        });
        renderFirestoreLeaderboard(arr);
      }, refreshLeaderboard);
  }

  function renderFirestoreLeaderboard(scores) {
    const el = document.getElementById('leaderboard');
    if (!el) return;
    if (!scores.length) { el.innerHTML = '<p>No scores yet</p>'; return; }
    el.innerHTML = '';
    scores.forEach((s,i)=>{
      const total=s.totalQuestions||10;
      el.innerHTML+=`
      <div class="leader-row">
        <div class="left">
          <div class="rank">${i+1}</div>
          <div class="meta"><strong>${escapeHtml(s.name)}</strong>
          <div>${escapeHtml(s.book)} ch ${escapeHtml(s.chapter)}</div></div>
        </div>
        <div class="score">
          <div>${escapeHtml(s.score)} / ${escapeHtml(total)}</div>
          <div style="font-size:12px;color:#666">${formatDate(s.createdAt)}</div>
        </div>
      </div>`;
    });
  }

  function renderLocalLeaderboard() {
    const el = document.getElementById('leaderboard');
    if (!el) return;
    const arr = getLocalScores();
    if (!arr.length) { el.innerHTML='<p>No scores yet</p>'; return; }
    arr.sort((a,b)=> new Date(b.date+" "+b.time)-new Date(a.date+" "+a.time));
    el.innerHTML='';
    arr.slice(0,50).forEach((s,i)=>{
      const total=s.totalQuestions||10;
      el.innerHTML+=`
      <div class="leader-row">
        <div class="left">
          <div class="rank">${i+1}</div>
          <div class="meta"><strong>${escapeHtml(s.name)}</strong>
          <div>${escapeHtml(s.book)} ch ${escapeHtml(s.chapter)}</div></div>
        </div>
        <div class="score">
          <div>${escapeHtml(s.score)} / ${escapeHtml(total)}</div>
          <div style="font-size:12px;color:#666">${escapeHtml(s.date)} ${escapeHtml(s.time)}</div>
        </div>
      </div>`;
    });
  }

  async function refreshLeaderboard(){
    if(db){
      startRealtimeLeaderboard();
    } else {
      renderLocalLeaderboard();
    }
  }
  window.refreshLeaderboard=refreshLeaderboard;

  // ---------- Save Score Wrapper ----------
  window.saveScore=async function(entry){
    try{
      if(db){
        await saveScoreToFirestore(entry);
        return;
      }
    }catch(e){}
    saveLocalScore({
      ...entry,
      date:new Date().toLocaleDateString(),
      time:new Date().toLocaleTimeString(),
    });
    refreshLeaderboard();
  };

  // ---------- Home Page Behaviors ----------
  document.addEventListener('DOMContentLoaded', () => {
    try{
      const bookSelect=document.getElementById('book-select');
      const chapterSelect=document.getElementById('chapter-select');

      if(bookSelect && chapterSelect){
        books.forEach((b,i)=>{
          const o=document.createElement('option');
          o.value=i;o.textContent=b.name;
          bookSelect.appendChild(o);
        });

        const populate=(idx)=>{
          const b=books[idx];
          chapterSelect.innerHTML='';
          for(let i=1;i<=b.chapters;i++){
            const o=document.createElement('option');
            o.value=i;o.textContent='Chapter '+i;
            chapterSelect.appendChild(o);
          }
        };
        populate(0);
        bookSelect.addEventListener('change',e=>populate(e.target.value));
      }

      const openBtn=document.getElementById('open-quiz');
      if(openBtn && bookSelect && chapterSelect){
        openBtn.addEventListener('click',(e)=>{
          e.preventDefault();
          const b=books[bookSelect.value];
          const chapter=chapterSelect.value;
          window.location.href=`${b.filePrefix}-chapter-${chapter}.html`;
        });
      }

      refreshLeaderboard();
    }catch(e){}
  });

  // ---------- QUIZ Logic ----------
  (function initQuiz(){
    if(!document.querySelector('.answer-option')) return;

    function getQuizInfo(){
      const f=(window.location.pathname.split('/').pop()||'');
      const m=f.match(/^(.+)-chapter-(\d+)\.html$/i);
      if(!m) return{book:"Unknown",chapter:0};
      const prefix=m[1];
      const chapter=Number(m[2]);
      let bookName=prefix;
      const found = books.find(b=>b.filePrefix===prefix);
      if(found) bookName=found.name;
      return {book:bookName,chapter};
    }

    const info=getQuizInfo();
    let finalScore=0;

    document.querySelectorAll('.answer-option').forEach(opt=>{
      opt.addEventListener('click',()=>{
        const q=opt.dataset.q;
        document.querySelectorAll(`.answer-option[data-q="${q}"]`)
          .forEach(o=>o.classList.remove('selected'));
        opt.classList.add('selected');
      });
    });

    function reveal(){
      document.querySelectorAll('.answer-option').forEach(opt=>{
        if(opt.dataset.correct==='true') opt.classList.add('correct');
        else if(opt.classList.contains('selected')) opt.classList.add('wrong');
        opt.style.pointerEvents='none';
      });
    }

    const submitBtn=document.getElementById('submit-btn');
    const saveBtn=document.getElementById('save-score-btn');
    const resultBox=document.querySelector('.result-box');
    const nameBox=document.querySelector('.name-box');

    if(submitBtn){
      submitBtn.addEventListener('click',()=>{
        const qs=new Set();
        document.querySelectorAll('.answer-option').forEach(o=>qs.add(o.dataset.q));
        const total=qs.size;
        finalScore=0;
        document.querySelectorAll('.answer-option').forEach(o=>{
          if(o.classList.contains('selected') && o.dataset.correct==='true') finalScore++;
        });
        reveal();
        resultBox.innerHTML=`Your Score: ${finalScore} / ${total}`;
        window.quizTotalQuestions=total;
        submitBtn.style.display='none';
        if(nameBox) nameBox.style.display='block';
      });
    }

    if(saveBtn){
      saveBtn.addEventListener('click',async()=>{
        const name=(document.getElementById('player-name')?.value.trim()||'Guest');
        const now=new Date();
        const entry={
          name,
          book:info.book,
          chapter:info.chapter,
          score:finalScore,
          totalQuestions:window.quizTotalQuestions,
          date:now.toLocaleDateString(),
          time:now.toLocaleTimeString()
        };
        await window.saveScore(entry);
        alert('Score saved successfully!');
        setTimeout(()=>window.location.href='index.html',700);
      });
    }

  })();

})();
