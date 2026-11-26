/* 🏠 보증금·원상복구 119 — UI 배선 */
(function () {
  'use strict';

  var E = window.DepositGuard;
  var D = window.DepositDocs;

  window.__errors = [];
  window.addEventListener('error', function (e) {
    window.__errors.push(String(e.message || e.error || 'error'));
  });
  window.addEventListener('unhandledrejection', function (e) {
    window.__errors.push('rejection: ' + String(e.reason));
  });

  var $ = function (id) { return document.getElementById(id); };
  var state = {
    result: null, input: null, steps: null,
    doc: null, docType: 'content', unlocked: false, fullText: ''
  };

  function digitsOnly(v) { return String(v).replace(/[^\d]/g, ''); }
  function comma(v) { return digitsOnly(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function val(id) { return ($(id) && $(id).value || '').trim(); }
  function num(id) { return parseInt(digitsOnly(val(id)) || '0', 10); }
  function dateVal(id) {
    var v = val(id);
    return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '';
  }
  function isoDaysAgo(n) {
    var d = new Date();
    d.setDate(d.getDate() - n);
    return iso(d);
  }
  function iso(d) {
    var m = String(d.getMonth() + 1), day = String(d.getDate());
    return d.getFullYear() + '-' + (m.length < 2 ? '0' + m : m) + '-' + (day.length < 2 ? '0' + day : day);
  }
  function todayKR() {
    var d = new Date();
    return String(d.getFullYear()) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── 입력 포맷 ── */
  function bindComma(el) {
    if (!el) return;
    el.addEventListener('input', function () {
      var atEnd = el.selectionStart === el.value.length;
      el.value = comma(el.value);
      if (atEnd) el.setSelectionRange(el.value.length, el.value.length);
    });
  }
  function bindDate(el) {
    if (!el) return;
    el.addEventListener('input', function () {
      var d = digitsOnly(el.value).slice(0, 8);
      var out = d;
      if (d.length > 4) out = d.slice(0, 4) + '-' + d.slice(4);
      if (d.length > 6) out = d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6);
      el.value = out;
    });
  }

  /* ── 토스트 ── */
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  /* ── 진단 입력 ── */
  function currentMode() {
    var checked = document.querySelector('input[name="mode"]:checked');
    return checked ? checked.value : 'studio';
  }

  function readItems() {
    var items = {};
    E.ITEM_ORDER.forEach(function (k) {
      var cb = $('item-' + k);
      if (cb && cb.checked) {
        var amt = $('amt-' + k);
        items[k] = amt ? (parseInt(digitsOnly(amt.value) || '0', 10) || true) : true;
      }
    });
    return items;
  }

  function readInput() {
    return {
      mode: currentMode(),
      deposit: num('deposit'),
      rent: num('rent'),
      endDate: dateVal('endDate'),
      moveOutDate: dateVal('moveOutDate'),
      notice: val('notice'),
      moveIn: val('moveIn'),
      moveOut: val('moveOut'),
      clause: val('clause'),
      landlord: val('landlord'),
      certSent: val('certSent'),
      injunction: val('injunction'),
      moldNotice: val('moldNotice'),
      holesMany: val('holesMany'),
      applianceAge: parseInt(val('applianceAge') || '0', 10) || 0,
      extra: num('extra'),
      items: readItems()
    };
  }

  function validInput(input) {
    return input.deposit > 0 && !!input.moveOutDate;
  }

  /* ── 결과 렌더 ── */
  function render(input, userAction) {
    var r = E.diagnose(input, new Date());
    var steps = E.timeline(r, new Date());
    state.result = r; state.input = input; state.steps = steps;

    $('scoreValue').innerHTML = r.score + '<small>점</small>';
    $('scoreRing').style.setProperty('--p', r.score);
    $('scoreLabel').textContent = r.level.label;
    $('scoreLabel').className = 'score-band tone-' + r.level.tone;
    $('scoreSub').textContent = r.claimTotal > 0 ? '부당 공제 방어 가능성' : '보증금 회수 가능성';
    $('resultVerdict').textContent = r.verdict;

    var rl = $('reasonList');
    rl.innerHTML = '';
    r.reasons.forEach(function (x) {
      var pct = Math.max(0, Math.min(100, Math.round((x.value / Math.max(1, x.max)) * 100)));
      var li = document.createElement('li');
      li.innerHTML =
        '<span class="r-label">' + escapeHtml(x.label) + '</span>' +
        '<span class="r-bar"><i style="width:' + pct + '%"></i></span>' +
        '<span class="r-val">' + (x.value > 0 ? '+' : '') + x.value + '</span>';
      rl.appendChild(li);
    });

    $('rDeposit').textContent = E.fmtWon(r.deposit);
    $('rClaim').textContent = E.fmtWon(r.claimTotal);
    $('rTenant').textContent = E.fmtWon(r.tenantBurden);
    $('rDefense').textContent = E.fmtWon(r.defense);
    $('rRecover').textContent = E.fmtWon(r.recoverable);
    $('rInterest').textContent = E.fmtWon(r.interest);
    $('rDelayDays').textContent = r.delayDays > 0 ? '(퇴거 후 ' + r.delayDays + '일)' : '(지연 없음)';
    $('rRateLabel').textContent = '연 5% 기준 · 소송에서는 송달 다음 날부터 연 12%';

    /* 항목별 표 */
    var tb = $('itemTableBody');
    tb.innerHTML = '';
    if (!r.rows.length) {
      var tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="4" class="empty-cell">공제 항목이 없습니다. 보증금 전액 미반환 유형으로 계산했습니다.</td>';
      tb.appendChild(tr);
    } else {
      r.rows.forEach(function (x) {
        var tr = document.createElement('tr');
        tr.className = x.reverse ? 'row-reverse' : '';
        tr.innerHTML =
          '<td class="it-name"><b>' + escapeHtml(x.label) + '</b><span>' + escapeHtml(x.cite || '') + '</span></td>' +
          '<td class="it-amount">' + E.fmtWon(x.amount) + '</td>' +
          '<td class="it-tenant">' + (x.reverse ? '—' : E.fmtWon(x.tenant)) + '</td>' +
          '<td class="it-defend">' + (x.reverse ? '+' + E.fmtWon(x.amount) + ' 반환' : E.fmtWon(x.defend)) + '</td>';
        tb.appendChild(tr);
      });
    }

    /* 칩 */
    var chipMode = $('chipMode');
    if (chipMode) chipMode.textContent = r.mode.label + ' · ' + r.mode.law;

    /* 위험 신호 */
    var fl = $('flagList');
    fl.innerHTML = '';
    if (r.flags.length) {
      fl.hidden = false;
      r.flags.forEach(function (f) {
        var s = document.createElement('span');
        s.className = 'flag ' + (f.tone || 'info');
        s.textContent = f.text;
        fl.appendChild(s);
      });
    } else { fl.hidden = true; }

    /* 타임라인 */
    var list = $('timelineList');
    list.innerHTML = '';
    steps.forEach(function (s) {
      var li = document.createElement('li');
      li.setAttribute('data-tone', s.tone);
      li.innerHTML =
        '<div class="t-when"><span class="t-d">' + s.d + '</span>' + E.fmtDate(s.date).replace(/^\d+년 /, '') + '</div>' +
        '<div><div class="t-title">' + escapeHtml(s.title) + '</div>' +
        '<p class="t-body">' + escapeHtml(s.body) + '</p></div>';
      list.appendChild(li);
    });

    /* 팁 */
    var tips = $('tipList');
    tips.innerHTML = '';
    r.tips.forEach(function (t) {
      var li = document.createElement('li');
      li.textContent = t;
      tips.appendChild(li);
    });

    /* 비용 */
    $('cCert').textContent = E.fmtWon(r.costs.contentCert);
    $('cInj').textContent = E.fmtWon(r.costs.injunction);
    $('cPOFee').textContent = E.fmtWon(r.costs.paymentOrderFee);
    $('cPOSvc').textContent = E.fmtWon(r.costs.paymentOrderService);
    $('cSCLabel').textContent = (r.isSmallClaim ? '소액심판' : '본안') + ' 인지 (전자)';
    $('cSCSvcLabel').textContent = (r.isSmallClaim ? '소액심판' : '본안') + ' 송달료';
    $('cSCFee').textContent = E.fmtWon(r.isSmallClaim ? r.costs.smallClaimFee : r.costs.civilFee);
    $('cSCSvc').textContent = E.fmtWon(r.isSmallClaim ? r.costs.smallClaimService : r.costs.civilService);
    $('cSum').textContent = E.fmtWon(r.costTotal);
    $('cRatio').textContent = r.claimForFee > 0 ? '청구액의 ' + (r.costRatio * 100).toFixed(1) + '%' : '';

    $('result').hidden = false;
    updateDocTypes();
    if (userAction) $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function runDiagnose(userAction) {
    var input = readInput();
    if (!input.deposit) { markError($('deposit'), '보증금을 입력해 주세요.'); return; }
    if (!input.moveOutDate) { markError($('moveOutDate'), '퇴거일(또는 예정일)을 입력해 주세요.'); return; }
    render(input, userAction);
  }

  function markError(el, msg) {
    if (!el) return;
    el.classList.add('input-error');
    el.focus();
    toast(msg);
    setTimeout(function () { el.classList.remove('input-error'); }, 2400);
  }

  var liveTimer = null;
  function scheduleLive() {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () {
      var input = readInput();
      if (validInput(input)) render(input, false);
    }, 280);
  }

  /* ── 모드별 필드 표시 ── */
  function syncModeUI() {
    var mode = E.MODES[currentMode()] || E.MODES.studio;
    Array.prototype.forEach.call(document.querySelectorAll('[data-mode-card]'), function (el) {
      el.classList.toggle('active', el.getAttribute('data-mode-card') === mode.key);
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-dorm-only]'), function (el) {
      el.hidden = !mode.dorm;
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-apt-only]'), function (el) {
      el.hidden = !(mode.key === 'apt' || mode.key === 'newapt');
    });
    var hint = $('modeHint');
    if (hint) hint.textContent = mode.desc + ' · ' + mode.law;
    updateDocTypes();
  }

  /* ── 유형 프리셋 6종 ── */
  var CASES = {
    '1': {
      mode: 'studio', deposit: 5000000, rent: 500000,
      endAgo: 30, outAgo: 14, notice: 'inTime', moveIn: 'part', moveOut: 'full',
      clause: 'generic', landlord: 'person', certSent: 'no', injunction: 'no',
      moldNotice: 'unknown', holesMany: 'no', applianceAge: 9,
      items: { wallpaper: 900000, floor: 600000 }
    },
    '2': {
      mode: 'studio', deposit: 10000000, rent: 450000,
      endAgo: 45, outAgo: 40, notice: 'inTime', moveIn: 'full', moveOut: 'full',
      clause: 'none', landlord: 'person', certSent: 'no', injunction: 'no',
      moldNotice: 'unknown', holesMany: 'no', applianceAge: 6,
      items: {}
    },
    '3': {
      mode: 'dorm', deposit: 300000, rent: 0,
      endAgo: 20, outAgo: 18, notice: 'agreed', moveIn: 'none', moveOut: 'part',
      clause: 'generic', landlord: 'school', certSent: 'no', injunction: 'no',
      moldNotice: 'unknown', holesMany: 'no', applianceAge: 0,
      items: { cleaning: 150000, facility: 250000 }
    },
    '4': {
      mode: 'studio', deposit: 8000000, rent: 550000,
      endAgo: 60, outAgo: 55, notice: 'inTime', moveIn: 'part', moveOut: 'full',
      clause: 'generic', landlord: 'person', certSent: 'no', injunction: 'no',
      moldNotice: 'no', holesMany: 'no', applianceAge: 11,
      items: { mold: 800000, wallpaper: 600000 }
    },
    '5': {
      mode: 'apt', deposit: 150000000, rent: 0,
      endAgo: 120, outAgo: 10, notice: 'renewed', moveIn: 'full', moveOut: 'full',
      clause: 'none', landlord: 'person', certSent: 'yes', injunction: 'no',
      moldNotice: 'unknown', holesMany: 'no', applianceAge: 7,
      items: {}
    },
    '6': {
      mode: 'newapt', deposit: 250000000, rent: 0,
      endAgo: 90, outAgo: 60, notice: 'inTime', moveIn: 'part', moveOut: 'full',
      clause: 'generic', landlord: 'company', certSent: 'no', injunction: 'no',
      moldNotice: 'yes', holesMany: 'no', applianceAge: 3,
      items: { mold: 500000, longterm: 480000 }, extra: 300000
    }
  };

  function applyCase(key) {
    var c = CASES[key];
    if (!c) return;
    var radio = document.querySelector('input[name="mode"][value="' + c.mode + '"]');
    if (radio) radio.checked = true;
    syncModeUI();
    $('deposit').value = comma(String(c.deposit));
    $('rent').value = c.rent ? comma(String(c.rent)) : '';
    $('endDate').value = isoDaysAgo(c.endAgo);
    $('moveOutDate').value = isoDaysAgo(c.outAgo);
    $('notice').value = c.notice;
    $('moveIn').value = c.moveIn;
    $('moveOut').value = c.moveOut;
    $('clause').value = c.clause;
    $('landlord').value = c.landlord;
    $('certSent').value = c.certSent;
    $('injunction').value = c.injunction;
    $('moldNotice').value = c.moldNotice;
    $('holesMany').value = c.holesMany;
    $('applianceAge').value = c.applianceAge || '';
    $('extra').value = c.extra ? comma(String(c.extra)) : '';
    E.ITEM_ORDER.forEach(function (k) {
      var cb = $('item-' + k), amt = $('amt-' + k);
      var v = c.items && c.items[k];
      if (cb) cb.checked = !!v;
      if (amt) amt.value = v ? comma(String(v)) : '';
      var row = $('row-' + k);
      if (row) row.classList.toggle('on', !!v);
    });
    render(readInput(), false);
    $('diagnose').scrollIntoView({ behavior: 'smooth', block: 'start' });
    toast('사례 ' + key + ' 값으로 채웠습니다 — 숫자를 고쳐 보세요');
  }

  /* ── 공유 ── */
  function shareResult() {
    if (!state.input) return;
    var url = location.origin + location.pathname + '?' + E.encodeInput(state.input) + '#diagnose';
    copyText(url, '결과 링크를 복사했습니다');
  }

  function copyText(text, msg) {
    function done() { toast(msg); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { window.__errors.push('copy 실패'); }
      document.body.removeChild(ta);
    }
  }

  /* ── 인쇄 ── */
  function printBlock(title, text, sub) {
    var area = $('printArea');
    area.innerHTML = '';
    var head = document.createElement('div');
    head.className = 'doc-print-head';
    head.innerHTML = '<span>' + escapeHtml(title) + '</span><span>' + escapeHtml(sub || '법률 자문 아님 · 문서 작성 보조') + '</span>';
    var body = document.createElement('div');
    body.className = 'doc-print';
    body.textContent = text;
    area.appendChild(head);
    area.appendChild(body);
    window.print();
  }

  function printReport() {
    if (!state.result) return;
    printBlock('보증금·원상복구 진단 리포트', D.report(state.input, state.result, state.steps), '참고 계산 · 법률 자문 아님');
  }

  /* ── 문서 ── */
  function readDocInput() {
    return {
      docType: val('docType') || 'content',
      tenantName: val('tenantName'),
      tenantAddress: val('tenantAddress'),
      tenantContact: val('tenantContact'),
      tenantEmail: val('tenantEmail'),
      landlordName: val('landlordName'),
      landlordAddress: val('landlordAddress'),
      propertyAddress: val('propertyAddress'),
      contractDate: dateVal('contractDate'),
      endDate: dateVal('docEndDate'),
      moveOutDate: dateVal('docMoveOutDate'),
      certDate: dateVal('certDate'),
      deposit: num('docDeposit'),
      rent: num('docRent'),
      extra: num('docExtra'),
      account: val('account'),
      courtName: val('courtName'),
      dept: val('dept'),
      today: new Date(),
      docNo: (val('docType') === 'defect' ? 'DEF-' : 'DEP-') + todayKR() + '-' + String(Math.floor(Math.random() * 9000) + 1000)
    };
  }

  function buildDiagInput(d) {
    var base = state.input ? JSON.parse(JSON.stringify(state.input)) : readInput();
    base.deposit = d.deposit || base.deposit;
    base.endDate = d.endDate || base.endDate;
    base.moveOutDate = d.moveOutDate || base.moveOutDate;
    if (d.extra) base.extra = d.extra;
    base.mode = base.mode || currentMode();
    return base;
  }

  function buildDoc(d) {
    var diag = buildDiagInput(d);
    var r = E.diagnose(diag, d.today);
    state.lastResult = r;
    if (d.docType === 'injunction') return D.injunction(d, r);
    if (d.docType === 'payment') return D.paymentOrder(d, r);
    if (d.docType === 'dorm') return D.dormObjection(d, r);
    if (d.docType === 'defect') return D.defectRequest(d, r);
    return D.contentCert(d, r);
  }

  var DOC_TITLES = {
    content: '내용증명 초안',
    injunction: '임차권등기명령 신청서 초안',
    payment: '지급명령 신청서 초안',
    dorm: '기숙사 변상 이의신청서 초안',
    defect: '하자보수 요청서 초안'
  };

  var DOC_PLACEHOLDER = '문서를 생성하면 이곳에 초안이 나옵니다.\n\n· 내용증명: 공제 항목별 이의 + 반환 기한 + 법적 조치 예고\n· 임차권등기명령 신청서: 신청 취지 · 소명자료 · 비용\n· 지급명령 신청서: 청구취지 · 청구원인 · 산정 근거\n· 기숙사 변상 이의신청서: 규정·감가상각 근거 요구\n· 하자보수 요청서: 수선의무 · 15일 이내 계획 통보 요구';

  function invalidateDoc(msg) {
    state.fullText = '';
    state.unlocked = false;
    $('docPreview').textContent = DOC_PLACEHOLDER;
    $('docLock').hidden = true;
    $('copyDoc').disabled = true;
    $('downloadDoc').disabled = true;
    $('printDoc').disabled = true;
    $('docState').textContent = msg || '대기 중';
    $('docState').className = 'doc-state';
    $('docMeta').textContent = '왼쪽 빈칸을 채우고 "문서 생성"을 누르세요.';
  }

  function updateDocTypes() {
    var sel = $('docType');
    if (!sel) return;
    var before = sel.value;
    var mode = state.input ? state.input.mode : currentMode();
    Array.prototype.forEach.call(sel.options, function (o) {
      var v = o.value;
      if (v === 'injunction') o.hidden = (mode === 'dorm');
      if (v === 'dorm') o.hidden = (mode !== 'dorm');
      if (v === 'defect') o.hidden = (mode !== 'newapt');
    });
    if (mode === 'dorm' && (sel.value === 'injunction' || sel.value === 'content')) sel.value = 'dorm';
    if (mode !== 'dorm' && sel.value === 'dorm') sel.value = 'content';
    if (mode !== 'newapt' && sel.value === 'defect') sel.value = 'content';
    if (sel.value !== before) invalidateDoc('문서 종류가 바뀌었습니다 — 다시 생성하세요');
  }

  function generateDoc() {
    var d = readDocInput();
    if (!d.deposit) {
      d.deposit = num('deposit');
      if (d.deposit) {
        $('docDeposit').value = comma(String(d.deposit));
      }
    }
    if (!d.endDate) { d.endDate = dateVal('endDate'); if (d.endDate) $('docEndDate').value = d.endDate; }
    if (!d.moveOutDate) { d.moveOutDate = dateVal('moveOutDate'); if (d.moveOutDate) $('docMoveOutDate').value = d.moveOutDate; }
    if (!d.deposit) { markError($('docDeposit'), '보증금을 입력해 주세요.'); return; }
    if (!d.tenantName || !d.landlordName) {
      toast('내 이름과 상대방 이름을 넣으면 문서가 완성됩니다');
    }
    state.doc = d;
    state.docType = d.docType;
    state.unlocked = false;
    state.fullText = buildDoc(d);

    var masked = state.fullText;
    if (d.tenantName) masked = masked.split(d.tenantName).join(D.maskName(d.tenantName));
    if (d.landlordName) masked = masked.split(d.landlordName).join(D.maskName(d.landlordName));
    if (d.tenantAddress) masked = masked.split(d.tenantAddress).join(D.maskAddress(d.tenantAddress));
    if (d.landlordAddress) masked = masked.split(d.landlordAddress).join(D.maskAddress(d.landlordAddress));
    if (d.propertyAddress) masked = masked.split(d.propertyAddress).join(D.maskAddress(d.propertyAddress));
    if (d.account) masked = masked.split(d.account).join('○○은행 ○○○-○○○-○○○○○○');

    $('docPreview').textContent = masked;
    $('docPanelTitle').textContent = DOC_TITLES[d.docType] || '문서 초안';
    $('docState').textContent = '미리보기 (개인정보 마스킹)';
    $('docState').className = 'doc-state ready';
    $('docLock').hidden = false;
    $('copyDoc').disabled = true;
    $('downloadDoc').disabled = true;
    $('printDoc').disabled = true;
    $('docMeta').textContent = '문서번호 ' + d.docNo + ' · 보증금 ' + E.fmtWon(d.deposit) + ' 기준';
    if (window.innerWidth < 980) $('docPreview').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function unlockDoc() {
    if (!state.fullText) return;
    state.unlocked = true;
    $('docPreview').textContent = state.fullText;
    $('docLock').hidden = true;
    $('docState').textContent = '전체 초안 (무료 공개)';
    $('copyDoc').disabled = false;
    $('downloadDoc').disabled = false;
    $('printDoc').disabled = false;
    toast('전체 초안을 열었습니다 — 복사·저장·인쇄 가능');
  }

  function fillFromDiagnosis() {
    if (state.input) {
      $('docDeposit').value = comma(String(state.input.deposit));
      $('docRent').value = state.input.rent ? comma(String(state.input.rent)) : '';
      $('docEndDate').value = state.input.endDate || '';
      $('docMoveOutDate').value = state.input.moveOutDate || '';
      $('docExtra').value = state.input.extra ? comma(String(state.input.extra)) : '';
      if (state.input.mode === 'dorm') $('docType').value = 'dorm';
    } else {
      $('docDeposit').value = $('deposit').value;
      $('docRent').value = $('rent').value;
      $('docEndDate').value = $('endDate').value;
      $('docMoveOutDate').value = $('moveOutDate').value;
      $('docExtra').value = $('extra').value;
    }
    $('docState').textContent = '진단값 적용됨';
    $('docState').className = 'doc-state ready';
    toast('진단 금액·날짜를 가져왔습니다');
  }

  function printDoc() {
    if (!state.fullText) return;
    var names = { content: '내용증명', injunction: '임차권등기명령 신청서', payment: '지급명령 신청서', dorm: '기숙사 변상 이의신청서', defect: '하자보수 요청서' };
    printBlock((names[state.docType] || '문서') + ' — 보증금·원상복구 119 초안', state.fullText);
  }

  function downloadDoc() {
    if (!state.fullText) return;
    var names = { content: '내용증명', injunction: '임차권등기명령신청서', payment: '지급명령신청서', dorm: '기숙사변상이의신청서', defect: '하자보수요청서' };
    var name = '보증금119_' + (names[state.docType] || '문서') + '_' + todayKR() + '.txt';
    var blob = new Blob(['\ufeff' + state.fullText], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast('파일로 저장했습니다');
  }

  function copyDoc() {
    if (!state.fullText) return;
    copyText(state.fullText, '문서 전체를 복사했습니다');
  }

  /* ── 결제 ── */
  function orderContext() {
    if (!state.result) return null;
    var r = state.result, i = state.input;
    var labels = r.rows.map(function (x) { return x.label; }).join(', ');
    return {
      mode: r.mode.label,
      deposit: r.deposit,
      claim: r.claimTotal,
      defense: r.defense,
      endDate: i.endDate,
      moveOutDate: i.moveOutDate,
      score: r.score,
      items: labels || '공제 항목 없음(전액 미반환)'
    };
  }

  function prefillOrderForm(planKey) {
    var p = window.DepositPay ? window.DepositPay.plan(planKey) : null;
    var sel = $('reqPackage');
    if (sel && p) {
      Array.prototype.forEach.call(sel.options, function (o) {
        if (o.value.indexOf(p.name) === 0) sel.value = o.value;
      });
    }
    var c = $('reqCase');
    var ctx = orderContext();
    if (c && !c.value.trim() && ctx) {
      c.value = '보증금 ' + E.fmtWon(ctx.deposit) + ' / 공제 통보 ' + E.fmtWon(ctx.claim) +
        ' / 방어 가능 ' + E.fmtWon(ctx.defense) + ' / ' + ctx.mode +
        ' / 퇴거일 ' + (ctx.moveOutDate || '-') + ' / 진단 ' + ctx.score + '점';
    }
  }

  function handlePay(channel, planKey) {
    var P = window.DepositPay;
    if (!P) return;
    if (P.has(channel, planKey)) {
      window.open(P.url(channel, planKey), '_blank', 'noopener');
      toast(P.CHANNELS[channel].name + ' 결제 페이지로 이동합니다');
      return;
    }
    prefillOrderForm(planKey);
    toast('결제 페이지 연결 전입니다 — 주문 내용을 아래에 채웠어요');
    var c = $('contact');
    if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updatePayButtons() {
    var P = window.DepositPay;
    if (!P) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-pay]'), function (btn) {
      var channel = btn.getAttribute('data-pay');
      var planKey = btn.getAttribute('data-plan');
      var p = P.plan(planKey);
      var price = p.price.toLocaleString('ko-KR') + '원';
      var ready = P.has(channel, planKey);
      if (channel === 'kmong') {
        btn.textContent = ready ? '크몽에서 결제 · ' + price : '주문 문의 · ' + price;
      } else {
        btn.textContent = ready ? '스마트스토어 결제' : '스마트스토어 준비 중';
      }
      btn.classList.toggle('pay-pending', !ready);
    });
  }

  /* ── 정적 호스팅 폼 → 메일 ── */
  function wireContactForm() {
    var form = $('contactForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = val('reqName'), contact = val('reqContact'), pkg = val('reqPackage'), cse = val('reqCase');
      if (!name || !contact) { toast('이름과 연락처(이메일)를 입력해 주세요'); return; }
      var to = (window.DEPOSIT_PAY && window.DEPOSIT_PAY.email) || '';
      var subject = '[문의] ' + pkg + ' — 보증금·원상복구 119';
      var body = '이름: ' + name + '\n연락처: ' + contact + '\n문의 상품: ' + pkg + '\n\n사건 요약:\n' + cse;
      location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      toast('메일 앱으로 문의 내용을 보냅니다');
    });
  }

  /* ── 초기화 ── */
  function prefillFromUrl() {
    var decoded = E.decodeInput(location.search);
    if (!decoded) return false;
    var radio = document.querySelector('input[name="mode"][value="' + decoded.mode + '"]');
    if (radio) radio.checked = true;
    syncModeUI();
    $('deposit').value = comma(String(decoded.deposit));
    $('rent').value = decoded.rent ? comma(String(decoded.rent)) : '';
    $('endDate').value = decoded.endDate;
    $('moveOutDate').value = decoded.moveOutDate;
    $('notice').value = decoded.notice;
    $('moveIn').value = decoded.moveIn;
    $('moveOut').value = decoded.moveOut;
    $('clause').value = decoded.clause;
    $('landlord').value = decoded.landlord;
    $('certSent').value = decoded.certSent;
    $('injunction').value = decoded.injunction;
    $('moldNotice').value = decoded.moldNotice;
    $('holesMany').value = decoded.holesMany;
    $('applianceAge').value = decoded.applianceAge || '';
    $('extra').value = decoded.extra ? comma(String(decoded.extra)) : '';
    E.ITEM_ORDER.forEach(function (k) {
      var cb = $('item-' + k), amt = $('amt-' + k);
      if (cb) cb.checked = !!decoded.items[k];
      if (amt && decoded.items[k]) amt.value = comma(String(decoded.items[k]));
      var row = $('row-' + k);
      if (row) row.classList.toggle('on', !!decoded.items[k]);
    });
    if (validInput(decoded)) render(decoded, false);
    return true;
  }

  function init() {
    ['deposit', 'rent', 'extra', 'docDeposit', 'docRent', 'docExtra'].forEach(function (id) { bindComma($(id)); });
    E.ITEM_ORDER.forEach(function (k) { bindComma($('amt-' + k)); });
    ['endDate', 'moveOutDate', 'contractDate', 'docEndDate', 'docMoveOutDate', 'certDate'].forEach(function (id) { bindDate($(id)); });

    if (!$('endDate').value) $('endDate').value = isoDaysAgo(30);
    if (!$('moveOutDate').value) $('moveOutDate').value = isoDaysAgo(7);

    Array.prototype.forEach.call(document.querySelectorAll('input[name="mode"]'), function (r) {
      r.addEventListener('change', function () { syncModeUI(); scheduleLive(); });
    });

    $('diagnoseForm').addEventListener('submit', function (e) { e.preventDefault(); runDiagnose(true); });

    $('resetForm').addEventListener('click', function () {
      $('deposit').value = ''; $('rent').value = ''; $('extra').value = '';
      $('endDate').value = isoDaysAgo(30);
      $('moveOutDate').value = isoDaysAgo(7);
      $('notice').value = 'inTime'; $('moveIn').value = 'part'; $('moveOut').value = 'full';
      $('clause').value = 'generic'; $('landlord').value = 'person';
      $('certSent').value = 'no'; $('injunction').value = 'no';
      $('moldNotice').value = 'unknown'; $('holesMany').value = 'no';
      $('applianceAge').value = '';
      E.ITEM_ORDER.forEach(function (k) {
        var cb = $('item-' + k), amt = $('amt-' + k), row = $('row-' + k);
        if (cb) cb.checked = false;
        if (amt) amt.value = '';
        if (row) row.classList.remove('on');
      });
      $('result').hidden = true;
      state.result = null; state.input = null;
      toast('입력값을 지웠습니다');
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-case]'), function (btn) {
      btn.addEventListener('click', function () { applyCase(btn.getAttribute('data-case')); });
    });

    E.ITEM_ORDER.forEach(function (k) {
      var cb = $('item-' + k);
      if (!cb) return;
      cb.addEventListener('change', function () {
        var row = $('row-' + k);
        if (row) row.classList.toggle('on', cb.checked);
        var amt = $('amt-' + k);
        if (cb.checked && amt && !amt.value) amt.value = comma(String(E.ITEMS[k].amount));
        scheduleLive();
      });
    });

    ['deposit', 'rent', 'endDate', 'moveOutDate', 'notice', 'moveIn', 'moveOut', 'clause',
      'landlord', 'certSent', 'injunction', 'moldNotice', 'holesMany', 'applianceAge', 'extra'].forEach(function (id) {
      var el = $(id);
      if (!el) return;
      el.addEventListener('input', scheduleLive);
      el.addEventListener('change', scheduleLive);
    });

    $('printReport').addEventListener('click', printReport);
    $('shareResult').addEventListener('click', shareResult);

    Array.prototype.forEach.call(document.querySelectorAll('[data-pay]'), function (btn) {
      btn.addEventListener('click', function () { handlePay(btn.getAttribute('data-pay'), btn.getAttribute('data-plan')); });
    });
    updatePayButtons();
    wireContactForm();

    $('docForm').addEventListener('submit', function (e) { e.preventDefault(); generateDoc(); });
    $('fillFromDiagnosis').addEventListener('click', fillFromDiagnosis);
    $('unlockDemo').addEventListener('click', unlockDoc);
    $('printDoc').addEventListener('click', printDoc);
    $('downloadDoc').addEventListener('click', downloadDoc);
    $('copyDoc').addEventListener('click', copyDoc);
    $('docType').addEventListener('change', function () {
      invalidateDoc('문서 종류가 바뀌었습니다 — 다시 생성하세요');
    });

    syncModeUI();
    if (!prefillFromUrl()) {
      var input = readInput();
      if (validInput(input)) render(input, false);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
