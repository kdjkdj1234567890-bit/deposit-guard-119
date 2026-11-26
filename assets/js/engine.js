/* 🏠 보증금·원상복구 119 — 진단 엔진 v1
 * 주거 형태별(원룸·기숙사·아파트·신축) 원상복구비 공제 적정성 판정,
 * 방어 가능 금액, 지연이자, 절차 비용, 단계별 타임라인을 계산한다.
 * 모든 수치는 현행 법령·공개 판례를 기준으로 한 "예상치"이며 법률 자문이 아니다.
 */
(function (global) {
  'use strict';

  var RATE = {
    civil: 0.05,        // 민법 제379조 법정이율
    litigation: 0.12    // 소송촉진 등에 관한 특례법 제3조 (2019.6.1~)
  };

  var LIMITS = {
    smallClaim: 30000000,   // 소액사건심판법 제2조
    depositReport: 30000000 // 임차권등기·지급명령 실무 기준 안내용
  };

  var FEES = {
    servicePerTime: 5640,   // 송달료 1회 (2026.7.1~)
    contentCert: 4470,      // 내용증명 3통·등기 기준
    contentCertExtra: 320   // 1통 추가 시 대략
  };

  /* ── 주거 형태 ─────────────────────────────────────── */
  var MODES = {
    studio: {
      key: 'studio',
      label: '원룸 · 오피스텔',
      short: '원룸',
      desc: '1인 가구, 단기 계약이 많은 유형',
      law: '주택임대차보호법',
      dorm: false,
      defaultDeposit: 5000000
    },
    dorm: {
      key: 'dorm',
      label: '기숙사 · 쉐어하우스',
      short: '기숙사',
      desc: '학교·회사 숙사, 단기 퇴실',
      law: '민법 · 숙사 운영규정',
      dorm: true,
      defaultDeposit: 500000
    },
    apt: {
      key: 'apt',
      label: '아파트 · 빌라 전월세',
      short: '아파트',
      desc: '보증금이 큰 일반 임대차',
      law: '주택임대차보호법',
      dorm: false,
      defaultDeposit: 100000000
    },
    newapt: {
      key: 'newapt',
      label: '신축 아파트 · 입주 3년 이내',
      short: '신축',
      desc: '하자·관리비·장충금 분쟁',
      law: '주택임대차보호법 · 공동주택관리법',
      dorm: false,
      defaultDeposit: 200000000
    }
  };

  /* ── 청구 항목 ─────────────────────────────────────── */
  var ITEMS = {
    wallpaper: {
      label: '벽지 전체 교체',
      hint: '생활 얼룩·변색·들뜸',
      amount: 600000,
      share: 0.30,
      tone: 'good',
      basis: '통상의 손모는 차임에 반영된 비용이라 임차인 부담이 아닙니다. 임차인 과실이 증명된 부분만, 그것도 신품가가 아니라 감가상각을 뺀 금액으로 인정됩니다.',
      cite: '대법원 2019. 8. 30. 선고 2017다268142'
    },
    floor: {
      label: '장판 전체 교체',
      hint: '가구 눌림·생활 기스',
      amount: 550000,
      share: 0.30,
      tone: 'good',
      basis: '장판 눌림·변색은 정상 거주로 생기는 마모입니다. 전체 교체비가 아니라 손상 면적 비례 + 감가상각 후 금액만 다툼 대상입니다.',
      cite: '인천지방법원 2025. 7. 24. 선고 2024나60230'
    },
    cleaning: {
      label: '퇴실 청소비',
      hint: '전문 청소·폐기물 처리',
      amount: 150000,
      share: 0.40,
      tone: 'warn',
      basis: '특약이 있으면 일부 인정될 수 있지만, 실제 청소 전에 미리 공제하는 것은 인정되기 어렵고 통상 10만 원 안팎을 넘는 과다 청구는 깎입니다.',
      cite: '서울중앙지방법원 2025. 7. 25. 선고(보증금 1억 4천 전액 인용)'
    },
    mold: {
      label: '결로 · 곰팡이 도배·방제',
      hint: '겨울철 벽면 결로',
      amount: 400000,
      share: 0.25,
      tone: 'good',
      basis: '단열·방습 성능 미비로 생긴 결로·곰팡이는 건물 하자여서 임대인의 수선의무 영역입니다. 다만 하자를 알렸다는 통지 기록이 없으면 책임이 줄어듭니다.',
      cite: '민법 제623조 · 서울중앙지방법원 2014. 6. 20. 선고 2014나13609'
    },
    appliance: {
      label: '옵션 가전 · 보일러 노후 교체',
      hint: '에어컨·냉장고·보일러',
      amount: 300000,
      share: 0.10,
      tone: 'good',
      basis: '내용연수를 넘긴 설비의 고장·교체는 임대인 부담입니다. 임차인이 망가뜨린 사실이 증명되지 않으면 공제할 수 없습니다.',
      cite: '부산지방법원 2023. 9. 6. 선고 2022나71493'
    },
    holes: {
      label: '못자국 · 타공 보수',
      hint: '액자·시계·커튼 못',
      amount: 200000,
      share: 0.35,
      tone: 'warn',
      basis: '시계·액자를 건 정도의 못자국은 통상 사용 범위입니다. 개수가 과다하거나 허락 없이 벽 전체를 뚫은 경우에만 임차인 몫이 늘어납니다.',
      cite: '인천지방법원 2024나60230 · 서울중앙지방법원 2023나77742'
    },
    pet: {
      label: '반려동물 냄새 · 훼손',
      hint: '금지 특약 위반',
      amount: 300000,
      share: 0.75,
      tone: 'bad',
      basis: '반려동물 금지 특약을 어긴 사실이 사진·영상으로 확인되면 냄새 제거비 등이 실제로 인정됩니다.',
      cite: '서울북부지방법원 2026. 6. 23. 선고 2025가단104882'
    },
    smoke: {
      label: '실내 흡연',
      hint: '벽지·천장 착색',
      amount: 400000,
      share: 0.75,
      tone: 'bad',
      basis: '금연 특약 위반과 착색이 함께 증명되면 인정될 수 있습니다. 특약이 없으면 임대인이 증명해야 합니다.',
      cite: '민법 제654조 · 판례상 특약 해석'
    },
    facility: {
      label: '시설 · 비품 파손 변상',
      hint: '기숙사 침대·책상·문',
      amount: 200000,
      share: 0.65,
      tone: 'warn',
      basis: '파손 사실과 금액을 학교·관리자가 증명해야 합니다. 입주 전 상태 자료가 없으면 감가상각 후 금액만 인정됩니다.',
      cite: '민법 제750조 · 숙사 운영규정'
    },
    longterm: {
      label: '장기수선충당금 · 선수관리비 반환',
      hint: '내가 받을 돈 (공제 아님)',
      amount: 0,
      share: 0,
      reverse: true,
      tone: 'good',
      basis: '장기수선충당금은 원칙적으로 소유자가 부담합니다. 임차인이 관리비에 포함해 대신 냈으면 임대차 종료 시 돌려받을 수 있습니다.',
      cite: '공동주택관리법 제30조 · 같은 법 시행령 제31조 제8항'
    }
  };

  var ITEM_ORDER = ['wallpaper', 'floor', 'cleaning', 'mold', 'appliance', 'holes', 'pet', 'smoke', 'facility', 'longterm'];

  var NOTICE = {
    inTime:   { label: '만료 2개월 전까지 통지', short: '적법 통지', score: 10 },
    late:     { label: '2개월을 넘겨 통지', short: '늦은 통지', score: 0 },
    none:     { label: '통지하지 않음', short: '미통지', score: -8 },
    renewed:  { label: '묵시적 갱신 후 해지 통지', short: '묵시갱신', score: 4 },
    agreed:   { label: '합의 해지', short: '합의해지', score: 8 }
  };

  var MOVEIN = {
    full: { label: '입주 전 사진·체크리스트 있음', short: '입주 사진 있음', score: 18 },
    part: { label: '일부만 있음', short: '일부 사진', score: 8 },
    none: { label: '없음', short: '입주 사진 없음', score: -12 }
  };

  var MOVEOUT = {
    full: { label: '퇴거 사진·영상·인도 기록 있음', short: '퇴거 기록 있음', score: 12 },
    part: { label: '사진만 있음', short: '퇴거 사진', score: 6 },
    none: { label: '없음', short: '퇴거 기록 없음', score: -8 }
  };

  var CLAUSE = {
    none:     { label: '원상복구 특약 없음', short: '특약 없음', score: 6 },
    generic:  { label: '"원상복구" 포괄 문구', short: '포괄 특약', score: -2 },
    specific: { label: '벽지·장판 교체를 구체적으로 명시', short: '구체 특약', score: -10 }
  };

  var LANDLORD = {
    person:  { label: '개인 임대인', short: '개인', score: 0 },
    company: { label: '법인 · 임대사업자', short: '법인', score: 5 },
    school:  { label: '학교 · 기관(기숙사)', short: '학교', score: -5 }
  };

  /* ── 유틸 ─────────────────────────────────────────── */
  function toDate(v) {
    if (v instanceof Date) return new Date(v.getFullYear(), v.getMonth(), v.getDate());
    if (typeof v === 'string') {
      var s = v.trim();
      if (/^\d{8}$/.test(s)) return new Date(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
      var p = s.split(/[-.\/]/);
      if (p.length === 3) return new Date(+p[0], +p[1] - 1, +p[2]);
      var d = new Date(s);
      return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return null;
  }

  function daysBetween(from, to) {
    var a = toDate(from), b = toDate(to);
    if (!a || !b) return 0;
    return Math.floor((b - a) / 86400000);
  }

  function addDays(base, n) {
    var d = toDate(base || new Date());
    d.setDate(d.getDate() + n);
    return d;
  }

  function fmtDate(d) {
    var x = toDate(d);
    if (!x) return '○○년 ○○월 ○○일';
    return x.getFullYear() + '년 ' + (x.getMonth() + 1) + '월 ' + x.getDate() + '일';
  }

  function fmtDot(d) {
    var x = toDate(d);
    if (!x) return '○○. ○. ○.';
    return x.getFullYear() + '. ' + (x.getMonth() + 1) + '. ' + x.getDate() + '.';
  }

  function fmtWon(n) {
    n = Math.round(n || 0);
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원';
  }

  function fmtNum(n) {
    return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function interest(principal, annualRate, days) {
    if (!principal || days <= 0) return 0;
    return Math.floor(principal * annualRate * days / 365);
  }

  /* 민사소송 등 인지법 제2조 */
  function filingFee(claim) {
    var fee;
    if (claim < 10000000) fee = claim * 0.005;
    else if (claim < 100000000) fee = claim * 0.0045 + 5000;
    else if (claim < 1000000000) fee = claim * 0.004 + 55000;
    else fee = claim * 0.0035 + 555000;
    fee = Math.floor(fee / 100) * 100;
    return Math.max(1000, fee);
  }

  function eFilingFee(claim) { return Math.max(1000, Math.floor((filingFee(claim) * 0.9) / 100) * 100); }
  function paymentOrderFee(claim) { return Math.max(1000, Math.floor((filingFee(claim) / 10) / 100) * 100); }
  function serviceFee(times) { return 2 * times * FEES.servicePerTime; }

  function band(score) {
    if (score >= 80) return { key: 'very-high', label: '매우 높음', tone: 'good' };
    if (score >= 65) return { key: 'high', label: '높음', tone: 'good' };
    if (score >= 50) return { key: 'mid', label: '보통', tone: 'warn' };
    if (score >= 35) return { key: 'low', label: '낮음', tone: 'bad' };
    return { key: 'very-low', label: '매우 낮음', tone: 'bad' };
  }

  /* 항목별 임차인 부담 비율 */
  function itemShare(key, input, ctx) {
    var it = ITEMS[key];
    if (!it || it.reverse) return 0;
    var share = it.share;
    var why = [];

    if (input.moveIn === 'none') { share += 0.15; why.push('입주 전 상태를 보여줄 자료가 없어 불리합니다'); }
    else if (input.moveIn === 'part') { share += 0.06; }
    if (input.moveOut === 'full') { share -= 0.08; why.push('퇴거 기록이 있어 훼손 시점을 가릴 수 있습니다'); }
    else if (input.moveOut === 'none') { share += 0.06; why.push('퇴거 기록이 없어 상태 입증이 어렵습니다'); }

    if (input.clause === 'specific') { share += 0.12; why.push('계약서에 해당 항목이 구체적으로 적혀 있습니다'); }
    else if (input.clause === 'none') { share -= 0.05; why.push('원상복구 특약이 없습니다'); }

    if (key === 'mold') {
      if (input.moldNotice === 'yes') { share -= 0.10; why.push('결로·곰팡이를 임대인에게 알린 기록이 있습니다'); }
      else if (input.moldNotice === 'no') { share += 0.20; why.push('하자를 알리지 않아 민법 제634조 통지의무 위반이 문제됩니다'); }
    }

    if (key === 'holes') {
      if (input.holesMany === 'yes') { share = Math.max(share, 0.6); why.push('못자국이 과다해 통상 사용 범위를 넘을 수 있습니다'); }
      else { share = Math.min(share, 0.3); why.push('못자국 개수·위치가 통상 사용 범위로 보입니다'); }
    }

    if (key === 'appliance' && (+input.applianceAge || 0) >= 8) {
      share = 0.05; why.push('내용연수를 넘긴 설비라 노후 교체로 봅니다');
    }

    if (key === 'cleaning' && input.clause === 'none') { share = Math.min(share, 0.3); }

    if (ctx && ctx.dorm) {
      if (key === 'facility') { share += 0.05; why.push('숙사 규정상 변상 기준이 별도로 적용됩니다'); }
      if (key === 'cleaning') { share += 0.10; why.push('숙사는 퇴사 청소비를 규정으로 정한 경우가 많습니다'); }
    }

    share = clamp(share, 0, 0.95);
    return { share: share, why: why };
  }

  /* ── 진단 ─────────────────────────────────────────── */
  function diagnose(input, today) {
    today = toDate(today || new Date());
    var mode = MODES[input.mode] || MODES.studio;
    var deposit = Math.max(0, Math.round(+input.deposit || 0));
    var rent = Math.max(0, Math.round(+input.rent || 0));
    var extra = Math.max(0, Math.round(+input.extra || 0));

    var checked = input.items || {};
    var rows = [];
    var claimTotal = 0, tenantBurden = 0, reverseTotal = 0;

    ITEM_ORDER.forEach(function (key) {
      var it = ITEMS[key];
      if (!checked[key]) return;
      var raw = checked[key];
      var amt = raw === true ? it.amount : Math.max(0, Math.round(+raw || 0));
      if (it.reverse) {
        reverseTotal += amt;
        rows.push({
          key: key, label: it.label, amount: amt, share: 0,
          tenant: 0, defend: amt, reverse: true,
          basis: it.basis, cite: it.cite, why: ['내가 돌려받을 돈으로 계산했습니다'], tone: 'good'
        });
        return;
      }
      var s = itemShare(key, input, { dorm: mode.dorm });
      var tenant = Math.round(amt * s.share);
      if (key === 'cleaning') tenant = Math.min(tenant, 150000);
      claimTotal += amt;
      tenantBurden += tenant;
      rows.push({
        key: key, label: it.label, amount: amt, share: s.share,
        tenant: tenant, defend: amt - tenant, reverse: false,
        basis: it.basis, cite: it.cite, why: s.why, tone: it.tone
      });
    });

    claimTotal += extra;
    tenantBurden += 0; // 기타는 임대인 입증 대상으로 보고 전액 다툼
    if (extra > 0) {
      rows.push({
        key: 'extra', label: '기타 공제 항목', amount: extra, share: 0, tenant: 0, defend: extra,
        basis: '항목·금액·산정 근거를 임대인이 문서로 설명하지 않으면 공제할 수 없습니다. 먼저 내역서를 요구하세요.',
        cite: '대법원 1995. 7. 25. 선고 95다14664', why: ['내역 요구 대상입니다'], reverse: false, tone: 'good'
      });
    }

    var defense = Math.max(0, claimTotal - tenantBurden);
    var netUnpaid = Math.max(0, deposit - tenantBurden); // 실제로 돌려받아야 할 보증금
    var recoverable = netUnpaid + reverseTotal;           // 청구로 돌려받을 수 있는 총액

    /* 지연이자 — 인도일 다음 날부터 */
    var base = input.moveOutDate || input.endDate;
    var delayDays = base ? Math.max(0, daysBetween(base, today)) : 0;
    var interestNow = interest(netUnpaid + reverseTotal, RATE.civil, delayDays);

    /* 점수 */
    var notice = NOTICE[input.notice] || NOTICE.inTime;
    var movein = MOVEIN[input.moveIn] || MOVEIN.none;
    var moveout = MOVEOUT[input.moveOut] || MOVEOUT.none;
    var clause = CLAUSE[input.clause] || CLAUSE.none;
    var landlord = LANDLORD[input.landlord] || LANDLORD.person;

    var reasons = [
      { label: '입주 전 상태 자료', value: movein.score, max: 18, note: movein.short },
      { label: '퇴거 기록', value: moveout.score, max: 12, note: moveout.short },
      { label: '계약 종료 통지', value: notice.score, max: 10, note: notice.short },
      { label: '원상복구 특약', value: clause.score, max: 6, note: clause.short },
      { label: '상대방 유형', value: landlord.score, max: 5, note: landlord.short }
    ];

    var score = 50;
    reasons.forEach(function (x) { score += x.value; });

    if (input.certSent === 'yes') { score += 8; reasons.push({ label: '내용증명 발송', value: 8, max: 8, note: '발송 기록 있음' }); }
    else { score -= 4; reasons.push({ label: '내용증명 발송', value: -4, max: 8, note: '미발송' }); }

    if (input.injunction === 'yes') { score += 10; reasons.push({ label: '임차권등기', value: 10, max: 10, note: '등기 완료' }); }

    if (input.moldNotice === 'yes') { score += 5; reasons.push({ label: '하자 통지 기록', value: 5, max: 5, note: '통지 확인' }); }
    else if (input.moldNotice === 'no' && checked.mold) { score -= 6; reasons.push({ label: '하자 통지 기록', value: -6, max: 5, note: '통지 없음' }); }

    if (mode.dorm) { score -= 8; reasons.push({ label: '주거 형태', value: -8, max: 6, note: '주임법 적용 밖' }); }
    else if (mode.key === 'newapt') { score += 2; }
    if (landlord.key === 'company') score += 2;

    var ratio = deposit > 0 ? claimTotal / deposit : 0;
    if (ratio >= 0.3) { score += 6; reasons.push({ label: '공제 비율', value: 6, max: 6, note: '보증금의 ' + Math.round(ratio * 100) + '%' }); }
    if (tenantBurden > deposit) { score -= 4; reasons.push({ label: '공제가 보증금 초과', value: -4, max: 6, note: '추가 부담 위험' }); }

    score = clamp(Math.round(score), 5, 97);
    var level = band(score);

    var verdict;
    if (input.endDate && daysBetween(today, input.endDate) > 0) {
      verdict = '아직 계약이 끝나기 전입니다. 지금 사진과 통지 기록을 남겨 두면 방어력이 크게 올라갑니다.';
    } else if (score >= 80) {
      verdict = '지금 바로 내용증명을 보내세요. 공제 내역을 뒤집을 근거가 충분합니다.';
    } else if (score >= 65) {
      verdict = '내용증명부터 시작하세요. 사진·통지 기록 몇 가지만 보강하면 충분히 방어됩니다.';
    } else if (score >= 50) {
      verdict = '공제 내역서와 입주 전 자료를 먼저 확보한 뒤 내용증명 → 지급명령 순서가 안전합니다.';
    } else if (score >= 35) {
      verdict = '증거 보강이 먼저입니다. 지금은 협의로 정리하고, 기록이 모이면 다시 진단해 보세요.';
    } else {
      verdict = '입증 자료가 부족합니다. 임대인의 공제 내역서 요구와 사진 확보부터 시작하세요.';
    }

    /* 비용 */
    var claimForFee = Math.max(1000, netUnpaid + reverseTotal);
    var isSmall = claimForFee <= LIMITS.smallClaim;
    var costs = {
      contentCert: FEES.contentCert,
      eCert: FEES.contentCert + 1000,
      injunction: 46840,
      injunctionPaper: 47040,
      paymentOrderFee: paymentOrderFee(claimForFee),
      paymentOrderService: serviceFee(6),
      smallClaimFee: eFilingFee(claimForFee),
      smallClaimService: serviceFee(10),
      civilFee: eFilingFee(claimForFee),
      civilService: serviceFee(15)
    };
    var costTotal = costs.contentCert + costs.paymentOrderFee + costs.paymentOrderService +
      (isSmall ? costs.smallClaimFee + costs.smallClaimService : costs.civilFee + costs.civilService);
    var costRatio = claimForFee > 1000 ? costTotal / claimForFee : 0;

    var tips = [];
    if (input.moveOut !== 'full') tips.push('퇴거 당일 방마다 영상을 찍고, 도어락 비밀번호·열쇠를 넘긴 시각을 문자로 남기세요. 인도 시점이 지연이자의 출발점입니다.');
    if (input.moveIn === 'none') tips.push('입주 전 사진이 없어도 중개사무소 매물 사진, 통신사 설치 기사 방문 기록, 이사업체 견적 사진으로 대체할 수 있습니다.');
    if (checked.mold && input.moldNotice !== 'yes') tips.push('결로·곰팡이는 발견 즉시 임대인에게 사진과 함께 알려야 합니다(민법 제634조). 지금이라도 통지하고 답변을 받아 두세요.');
    if (checked.wallpaper || checked.floor) tips.push('벽지·장판은 "전체 교체"가 아니라 손상 부위 비례 + 감가상각 후 금액만 다툼 대상입니다. 임대인에게 시공 견적서와 시공 전 사진을 요구하세요.');
    if (input.notice === 'none') tips.push('갱신거절 통지를 놓쳤다면 묵시적 갱신이 되었을 수 있습니다. 이 경우 해지 통지를 하고 3개월 뒤 종료되므로, 그 기간을 계산해 일정을 잡으세요.');
    if (mode.dorm) tips.push('기숙사는 주택임대차보호법이 적용되지 않는 경우가 많아 임차권등기명령을 쓸 수 없습니다. 대신 숙사 운영규정의 변상 기준과 감가상각을 근거로 이의신청서를 내고, 답변이 없으면 학교 민원 → 한국소비자원 조정 순으로 가세요.');
    if (checked.longterm) tips.push('장기수선충당금은 관리사무소에서 납부확인서를 발급받아 임대인에게 첨부하세요. 관리규약으로 임차인 부담을 정했더라도 반환 청구 근거는 남습니다.');
    if (mode.key === 'newapt') tips.push('신축 아파트 하자는 임대인에게 알리는 동시에, 임대인이 사업주체(시공사)에 하자보수를 청구하도록 요구하세요. 사업주체는 청구를 받은 날부터 15일 안에 보수하거나 계획을 통보해야 합니다(공동주택관리법 제37조).');
    if (!tips.length) tips.push('지금 가진 자료만으로도 충분합니다. 내용증명으로 공제 내역의 근거 자료를 요구하는 것부터 시작하세요.');
    if (tenantBurden > deposit) tips.push('정당 공제 추정액이 보증금을 넘는 구성입니다. 이 경우 남은 금액을 더 내라는 요구가 올 수 있으니, 먼저 항목별 근거를 요구하고 인정 범위를 좁히는 협상부터 하세요.');

    var flags = [];
    if (ratio >= 0.5) flags.push({ text: '공제액이 보증금의 ' + Math.round(ratio * 100) + '%입니다 — 과다 공제 다툼 대상', tone: 'bad' });
    if (input.notice === 'none') flags.push({ text: '갱신거절 통지를 놓쳐 묵시적 갱신이 되었을 수 있습니다', tone: 'warn' });
    if (mode.dorm) flags.push({ text: '기숙사는 주임법 보호 밖 — 절차가 다릅니다', tone: 'warn' });
    if (delayDays > 365) flags.push({ text: '보증금 미반환 ' + delayDays + '일 경과', tone: 'bad' });
    if (checked.longterm) flags.push({ text: '장기수선충당금은 별도로 반환 청구할 수 있습니다', tone: 'info' });
    if (tenantBurden > deposit) flags.push({ text: '정당 공제 추정액이 보증금을 넘습니다 — 추가 부담이 생길 수 있습니다', tone: 'bad' });

    return {
      mode: mode,
      deposit: deposit,
      rent: rent,
      claimTotal: claimTotal,
      tenantBurden: tenantBurden,
      defense: defense,
      reverseTotal: reverseTotal,
      recoverable: recoverable,
      netUnpaid: netUnpaid,
      rows: rows,
      score: score,
      level: level,
      verdict: verdict,
      reasons: reasons,
      delayDays: delayDays,
      interest: interestNow,
      interestLitigation: interest(netUnpaid + reverseTotal, RATE.litigation, delayDays),
      rateLabel: '민법 제379조 법정이율 연 5%',
      isSmallClaim: isSmall,
      claimForFee: claimForFee,
      costs: costs,
      costTotal: costTotal,
      costRatio: costRatio,
      tips: tips,
      flags: flags,
      notice: notice,
      moveIn: movein,
      moveOut: moveout,
      clause: clause,
      landlord: landlord
    };
  }

  /* ── 타임라인 ─────────────────────────────────────── */
  function timeline(r, today) {
    today = toDate(today || new Date());
    var S = [];
    if (r.mode.dorm) {
      S.push({ d: 'D-0', date: today, when: '오늘', title: '퇴사 전 상태 기록', body: '방·화장실·비품을 영상으로 찍고, 입주(입사) 당시 사진과 관리 규정의 변상 기준 조항을 확보합니다.', tone: 'now' });
      S.push({ d: 'D+1', date: addDays(today, 1), when: '내일', title: '변상 내역서 요구', body: '금액·수량·산정 근거·감가상각 적용 여부를 서면으로 요구합니다. 구두 통보는 기록이 남지 않습니다.', tone: 'act' });
      S.push({ d: 'D+3', date: addDays(today, 3), when: '3일 뒤', title: '이의신청서 제출', body: '숙사 운영 주체(학생지원팀·관리사무소)에 이의신청서를 내고 접수증을 받습니다.', tone: 'act' });
      S.push({ d: 'D+14', date: addDays(today, 14), when: '2주 뒤', title: '학교 민원 → 소비자원', body: '답변이 없으면 대학 민원 창구와 한국소비자원 분쟁조정을 병행합니다. 조정 신청은 무료입니다.', tone: 'legal' });
      S.push({ d: 'D+30', date: addDays(today, 30), when: '한 달 뒤', title: '소액심판 검토', body: '변상금을 이미 공제당했다면 지급명령·소액심판으로 반환을 청구할 수 있습니다.', tone: 'end' });
      return S;
    }
    S.push({ d: 'D-0', date: today, when: '오늘', title: '퇴거 기록 · 인도 통지', body: '방마다 영상, 계량기 사진을 남기고 열쇠·도어락 비밀번호를 넘긴 사실을 문자로 통지합니다. 이 통지가 지연이자의 출발점입니다.', tone: 'now' });
    S.push({ d: 'D+1', date: addDays(today, 1), when: '내일', title: '공제 내역서 요구', body: '항목별 금액, 시공 견적서, 시공 전 사진, 감가상각 적용 내역을 문서로 요구합니다.', tone: 'act' });
    S.push({ d: 'D+2', date: addDays(today, 2), when: '2일 뒤', title: '내용증명 발송', body: '이의제기 + 보증금 반환 청구를 우체국 내용증명(3통)으로 보냅니다. 4,470원.', tone: 'act' });
    S.push({ d: 'D+9', date: addDays(today, 9), when: '9일 뒤', title: '반환 기한', body: '내용증명 도달 후 7일을 기한으로 정합니다. 기한을 넘기면 지체책임이 확정됩니다.', tone: 'deadline' });
    S.push({ d: 'D+10', date: addDays(today, 10), when: '10일 뒤', title: '임차권등기명령 신청', body: '이사 전에 신청해야 대항력·우선변제권을 유지합니다. 비용 46,840원은 임대인에게 청구할 수 있습니다.', tone: 'legal' });
    S.push({ d: 'D+30', date: addDays(today, 30), when: '한 달 뒤', title: '지급명령 신청', body: '인지 ' + fmtWon(r.costs.paymentOrderFee) + ' + 송달료 ' + fmtWon(r.costs.paymentOrderService) + '. 임대인이 2주 안에 이의하지 않으면 확정됩니다.', tone: 'legal' });
    S.push({ d: 'D+60', date: addDays(today, 60), when: '두 달 뒤', title: r.isSmallClaim ? '이의 시 소액심판' : '이의 시 본안소송', body: r.isSmallClaim ? '3,000만 원 이하면 소액심판으로 전환합니다. 1회 변론으로 끝나는 경우가 많습니다.' : '3,000만 원을 넘으면 일반 민사소송으로 전환됩니다. 변론이 여러 번 열릴 수 있습니다.', tone: 'legal' });
    S.push({ d: 'D+90', date: addDays(today, 90), when: '석 달 뒤', title: '강제집행 · 배당', body: '확정된 지급명령으로 임차주택 경매를 신청하고 배당요구합니다.', tone: 'end' });
    return S;
  }

  /* ── 공유 URL ─────────────────────────────────────── */
  function encodeInput(input) {
    var items = {};
    ITEM_ORDER.forEach(function (k) {
      if (input.items && input.items[k]) items[k] = (typeof input.items[k] === 'number') ? input.items[k] : 0;
    });
    var payload = {
      m: input.mode, d: input.deposit, r: input.rent || 0,
      e: input.endDate || '', o: input.moveOutDate || '',
      n: input.notice, i: input.moveIn, u: input.moveOut, c: input.clause,
      l: input.landlord, s: input.certSent, j: input.injunction,
      g: input.moldNotice, h: input.holesMany, a: input.applianceAge || 0,
      x: input.extra || 0, it: items
    };
    return 'q=' + encodeURIComponent(JSON.stringify(payload));
  }

  function decodeInput(search) {
    try {
      var m = /[?&]q=([^&]+)/.exec(search || '');
      if (!m) return null;
      var p = JSON.parse(decodeURIComponent(m[1]));
      var items = {};
      ITEM_ORDER.forEach(function (k) { if (p.it && p.it[k]) items[k] = p.it[k] || true; });
      return {
        mode: p.m || 'studio', deposit: +p.d || 0, rent: +p.r || 0,
        endDate: p.e || '', moveOutDate: p.o || '',
        notice: p.n || 'inTime', moveIn: p.i || 'none', moveOut: p.u || 'none',
        clause: p.c || 'generic', landlord: p.l || 'person',
        certSent: p.s || 'no', injunction: p.j || 'no',
        moldNotice: p.g || 'unknown', holesMany: p.h || 'no',
        applianceAge: +p.a || 0, extra: +p.x || 0, items: items
      };
    } catch (e) { return null; }
  }

  global.DepositGuard = {
    RATE: RATE,
    MODES: MODES,
    ITEMS: ITEMS,
    ITEM_ORDER: ITEM_ORDER,
    NOTICE: NOTICE,
    MOVEIN: MOVEIN,
    MOVEOUT: MOVEOUT,
    CLAUSE: CLAUSE,
    LANDLORD: LANDLORD,
    FEES: FEES,
    diagnose: diagnose,
    timeline: timeline,
    toDate: toDate,
    addDays: addDays,
    fmtDate: fmtDate,
    fmtDot: fmtDot,
    fmtWon: fmtWon,
    fmtNum: fmtNum,
    encodeInput: encodeInput,
    decodeInput: decodeInput
  };
})(typeof window !== 'undefined' ? window : globalThis);
