/* 🏠 보증금·원상복구 119 — 문서 생성기
 * 내용증명 / 임차권등기명령 신청서 / 지급명령 신청서 /
 * 기숙사 변상 이의신청서 / 하자보수 요청서 / 진단 리포트
 */
(function (global) {
  'use strict';
  var E = global.DepositGuard;

  function won(n) { return E.fmtWon(n); }
  function dateKR(v) { return v ? E.fmtDate(v) : '○○년 ○○월 ○○일'; }
  function blank(v, fb) { return (v && String(v).trim()) ? String(v).trim() : (fb || '○○○'); }
  function addDays(v, n) { return E.addDays(v || new Date(), n); }
  function pct(x) { var p = x * 100; return String(p % 1 ? p.toFixed(0) : p); }

  function itemLines(r, opts) {
    var L = [];
    var rows = (r.rows || []).filter(function (x) { return !x.reverse; });
    if (!rows.length) return L;
    rows.forEach(function (x, i) {
      L.push('    ' + (i + 1) + ') ' + x.label + ' ' + won(x.amount) + ' → 임차인 부담 ' + won(x.tenant) + ', 나머지 ' + won(x.defend) + '은 다툼 대상');
      if (opts && opts.detail) {
        L.push('       - ' + x.basis);
        if (x.cite) L.push('       - 근거: ' + x.cite);
      }
    });
    return L;
  }

  /* ── 1. 내용증명 ────────────────────────────────────── */
  function contentCert(d, r) {
    var send = d.today ? E.fmtDate(d.today) : E.fmtDate(new Date());
    var payBy = E.fmtDate(addDays(d.today || new Date(), 7));
    var rows = (r.rows || []).filter(function (x) { return !x.reverse; });
    var reverse = (r.rows || []).filter(function (x) { return x.reverse; });
    var L = [];

    L.push('내  용  증  명');
    L.push('');
    L.push('문서번호: ' + (d.docNo || 'DEP-' + new Date().getFullYear() + '-0000'));
    L.push('발신일자: ' + send);
    L.push('');
    L.push('수신인  ' + blank(d.landlordName, '○○○ (임대인)'));
    L.push('  주소  ' + blank(d.landlordAddress, '○○시 ○○구 ○○동 ○○○'));
    L.push('발신인  ' + blank(d.tenantName, '○○○ (임차인)'));
    L.push('  주소  ' + blank(d.tenantAddress, '○○시 ○○구 ○○동 ○○○'));
    L.push('');
    L.push('제  목: 원상복구비 공제의 부당성 이의 및 임대차보증금 반환 청구');
    L.push('');
    L.push('1. 임대차계약의 내용');
    L.push('  가. 발신인은 ' + dateKR(d.contractDate) + ' 수신인과 ' + blank(d.propertyAddress, '○○시 ○○구 ○○동 ○○○') + ' (이하 "이 사건 주택")에 관하여 임대차계약을 체결하였습니다.');
    L.push('  나. 위 계약의 임대차보증금은 금 ' + won(r.deposit || d.deposit) + (d.rent ? ', 월 차임은 금 ' + won(d.rent) : '') + '이며, 임대차기간은 ' + dateKR(d.endDate) + '까지로 정하였습니다.');
    L.push('  다. 발신인은 ' + dateKR(d.moveOutDate) + ' 이 사건 주택을 수신인에게 인도하였고, 열쇠 및 출입 비밀번호를 인도하였습니다.');
    L.push('');
    L.push('2. 수신인의 공제 통보');
    if (r.claimTotal > 0) {
      L.push('  수신인은 발신인에게 보증금 ' + won(r.deposit || d.deposit) + ' 중 금 ' + won(r.claimTotal) + '을 아래와 같은 항목으로 공제하겠다고 통보하였습니다.');
      if (rows.length) {
        rows.forEach(function (x, i) {
          L.push('    ' + (i + 1) + '. ' + x.label + ' : ' + won(x.amount));
        });
      }
      if (d.extra > 0) L.push('    ' + (rows.length + 1) + '. 기타 : ' + won(d.extra));
    } else {
      L.push('  수신인은 발신인에게 아무런 공제 내역과 산정 근거를 제시하지 아니한 채, 보증금 ' + won(r.deposit || d.deposit) + '의 반환을 미루고 있습니다.');
    }
    L.push('');
    L.push('3. 공제의 부당성');
    L.push('  가. 임차인의 원상복구 의무는 임차인이 임차 당시의 상태보다 악화시킨 부분, 즉 통상의 사용에 따른 손모를 넘는 훼손에 한하여 발생합니다. 통상의 손모는 임대차계약의 본질상 당연히 예정된 것이고 그 가치는 이미 차임에 반영되어 있으므로, 이에 대한 원상복구비용은 특약이 없는 한 임대인이 부담합니다(대법원 2019. 8. 30. 선고 2017다268142 판결, 대법원 2001. 6. 15. 선고 2000다62473 판결 등).');
    L.push('  나. 원상회복의 기준은 "새 집"이 아니라 임차인이 입주할 당시의 상태이며, 그 내용과 범위는 계약의 체결 경위, 임대 당시 목적물의 상태, 임차인이 수리·변경한 내용을 종합하여 개별적으로 정하여야 합니다(대법원 2023. 11. 2. 선고 2023다249661 판결).');
    L.push('  다. 보증금에서 공제할 손해배상채권이 발생하였다는 점은 임대인이 증명하여야 합니다(대법원 1995. 7. 25. 선고 95다14664 판결). 또한 낡은 자재를 신품으로 교체하는 비용 전액을 임차인에게 부담시킬 수 없고, 감가상각분은 제외되어야 합니다(대법원 2009. 6. 25. 선고 2009다24415 판결).');
    if (rows.length) {
      L.push('  라. 따라서 아래 항목은 위 법리에 비추어 공제할 수 없거나, 공제하더라도 그 금액이 과다합니다.');
      itemLines(r, { detail: true }).forEach(function (x) { L.push(x); });
    }
    L.push('');
    L.push('4. 요구 사항');
    L.push('  가. 수신인은 이 서면을 받은 날부터 7일 이내(' + payBy + '까지)에 위 공제 항목별 금액의 산정 근거(시공 견적서, 실제 지출 영수증, 시공 전·후 사진, 감가상각 적용 내역)를 발신인에게 문서로 제시하십시오.');
    L.push('  나. 위 근거를 제시하지 못하는 항목은 공제할 수 없습니다. 수신인은 공제액을 취소하고, 임대차보증금 중 금 ' + won(r.netUnpaid) + '을 반환하십시오.');
    L.push('     - 반환 계좌: ' + blank(d.account, '○○은행 ○○○-○○○-○○○○○○ (예금주: ' + blank(d.tenantName, '○○○') + ')'));
    if (reverse.length) {
      L.push('  다. 수신인은 발신인이 관리비에 포함하여 대신 납부한 장기수선충당금 및 선수관리비도 함께 정산하십시오. 장기수선충당금은 원칙적으로 소유자가 부담하는 비용입니다(공동주택관리법 제30조, 같은 법 시행령 제31조 제8항).');
      L.push('     - 청구 금액: ' + won(r.reverseTotal));
    }
    L.push('');
    L.push('5. 지연손해금');
    L.push('  임대차보증금 반환채무는 임차인이 목적물을 인도함과 동시에 이행기에 도달하며, 그때부터 지체책임이 발생합니다(민법 제387조, 대법원 1977. 9. 28. 선고 77다1241 전원합의체 판결).');
    L.push('  따라서 미반환 보증금 금 ' + won(r.netUnpaid) + '에 대하여 ' + dateKR(d.moveOutDate ? addDays(d.moveOutDate, 1) : null) + '부터 실제 반환일까지 민법 제379조가 정한 연 5%의 비율로 계산한 지연손해금이 발생합니다.');
    L.push('  (이 서면 작성일 기준 예상액: ' + won(r.interest) + ' / ' + r.delayDays + '일분)');
    L.push('');
    L.push('6. 법적 조치 예고');
    L.push('  위 기한까지 반환 또는 근거 제시가 없으면, 발신인은 다음 절차를 진행합니다.');
    L.push('   - 임차권등기명령 신청(주택임대차보호법 제3조의3): 이사 후에도 대항력과 우선변제권을 유지하고, 신청·등기 비용을 수신인에게 청구');
    L.push('   - 지급명령 신청 및 소액사건심판(청구금액 3,000만 원 이하): 인지대·송달료를 포함한 절차 비용을 수신인이 부담');
    L.push('   - 확정된 집행권원에 기한 강제경매 신청 및 배당요구');
    L.push('  위 절차에서 발생하는 비용과 지연손해금(소장 송달 다음 날부터 연 12%)은 모두 수신인이 부담하게 됩니다.');
    L.push('');
    L.push('7. 본 서면은 우체국 내용증명우편으로 발송되며, 발송 사실과 내용은 우체국에서 증명됩니다. 본 서면은 법률 자문이 아니라 당사자의 의사 통지입니다.');
    L.push('');
    L.push('별첨: 공제 항목 대조표 1부, 임대차계약서 사본 1부, 퇴거 사진 1부');
    L.push('');
    L.push('');
    L.push(send);
    L.push('');
    L.push('발신인  ' + blank(d.tenantName, '○○○') + '  (서명 또는 인)');
    L.push('연락처  ' + blank(d.tenantContact, '○○○-○○○○-○○○○') + '  이메일  ' + blank(d.tenantEmail, '○○○○@○○○.○○○'));
    L.push('');
    L.push('※ 우체국 내용증명은 같은 내용 3통을 작성하여 1통은 발송인 보관, 1통은 우체국 보관, 1통은 수신인에게 배달됩니다. 3통 기준 4,470원입니다.');
    return L.join('\n');
  }

  /* ── 2. 임차권등기명령 신청서 ───────────────────────── */
  function injunction(d, r) {
    var L = [];
    L.push('주택임차권등기명령 신청서');
    L.push('');
    L.push('신  청  인  ' + blank(d.tenantName));
    L.push('  주민등록번호  ○○○○○○-○○○○○○○');
    L.push('  주소          ' + blank(d.tenantAddress));
    L.push('  연락처        ' + blank(d.tenantContact, '○○○-○○○○-○○○○'));
    L.push('  송달장소      ' + blank(d.tenantAddress));
    L.push('');
    L.push('피신청인(임대인)  ' + blank(d.landlordName));
    L.push('  주소  ' + blank(d.landlordAddress));
    L.push('');
    L.push('신  청  취  지');
    L.push('  피신청인 소유의 별지 목적물에 관하여 채권자인 신청인의 임차권을 원인으로 한 임차권등기명령을 하여 달라는 것입니다.');
    L.push('');
    L.push('신  청  이  유');
    L.push('  1. 신청인은 ' + dateKR(d.contractDate) + ' 피신청인과 별지 목적물에 관한 임대차계약을 체결하고, 보증금 금 ' + won(r.deposit || d.deposit) + (d.rent ? ', 월 차임 금 ' + won(d.rent) : '') + '을 정하였습니다.');
    L.push('  2. 신청인은 위 주택을 인도받고 주민등록을 마쳐 대항력을 취득하였으며, 임대차계약증서에 확정일자를 받았습니다.');
    L.push('  3. 위 임대차는 ' + dateKR(d.endDate) + ' 기간만료로 종료되었고, 신청인은 ' + dateKR(d.moveOutDate) + ' 위 주택을 피신청인에게 인도하였습니다.');
    L.push('  4. 그러나 피신청인은 보증금 중 금 ' + won(r.netUnpaid) + '을 반환하지 아니하고 있습니다.');
    L.push('  5. 신청인은 주거 이전으로 주민등록을 옮겨야 하는 상황이므로, 이사 후에도 대항력 및 우선변제권을 유지하기 위하여 이 신청에 이르렀습니다.');
    L.push('');
    L.push('소  명  자  료');
    L.push('  1. 임대차계약서 사본(확정일자 포함) 1부');
    L.push('  2. 부동산등기사항전부증명서 1부');
    L.push('  3. 주민등록등(초)본(주소 변동 사항 포함, 1개월 이내 발급) 1부');
    L.push('  4. 임대차 종료를 증명하는 서류 1부 — 다음 중 하나');
    L.push('     가. 계약갱신거절 통지 내용증명 사본');
    L.push('     나. 해지 통지 내용증명 사본 또는 문자·카카오톡 대화 출력본');
    L.push('     다. 임대차계약 해지 합의서 사본');
    L.push('     라. 위 서류가 없으면 법원의 의사표시 공시송달 결정문 사본');
    L.push('  5. 보증금 지급 및 미반환을 확인하는 자료(계좌이체 내역 등) 1부');
    L.push('');
    L.push('첨  부  및  비  용');
    L.push('  - 인지: 1,800원(전자신청) / 2,000원(종이신청) — 임차권등기명령 절차에 관한 규칙 제2조');
    L.push('  - 예납 송달료: ' + won(2 * 3 * 5640) + ' (1회 5,640원 × 3회 × 당사자 2인)');
    L.push('  - 등록면허세 6,000원 + 지방교육세 1,200원 + 등기신청수수료 4,000원');
    L.push('  - 합계 약 ' + won(46840) + ' (전자신청 기준, 1필지·당사자 2인)');
    L.push('  - 위 비용은 주택임대차보호법 제3조의3 제8항에 따라 피신청인에게 청구할 수 있습니다.');
    L.push('');
    L.push('  ※ 결정이 나와도 등기사항전부증명서에 임차권등기가 실제로 기재된 것을 확인한 뒤 이사·전출하십시오. 등기가 되면 이후 전출하더라도 이미 취득한 대항력·우선변제권은 상실되지 않습니다(같은 조 제5항).');
    L.push('  ※ 임대인이 "등기를 말소해야 보증금을 준다"고 하여도 응할 필요가 없습니다. 임차권등기의 말소는 보증금 반환과 동시이행관계가 아닙니다(대법원 2005. 6. 9. 선고 2005다4529 판결).');
    L.push('');
    L.push('');
    L.push(E.fmtDate(d.today || new Date()));
    L.push('');
    L.push('신청인  ' + blank(d.tenantName) + '  (서명 또는 인)');
    L.push('');
    L.push(blank(d.courtName, '○○지방법원') + ' 귀중');
    L.push('');
    L.push('[별지] 목적물의 표시');
    L.push('  ' + blank(d.propertyAddress, '○○시 ○○구 ○○동 ○○○ (○○동 ○○○호)'));
    return L.join('\n');
  }

  /* ── 3. 지급명령 신청서 ─────────────────────────────── */
  function paymentOrder(d, r) {
    var principal = r.netUnpaid;
    var interestNow = r.interest;
    var total = principal + interestNow;
    var L = [];
    L.push('지  급  명  령  신  청  서');
    L.push('');
    L.push('[채권자]  ' + blank(d.tenantName));
    L.push('  주소      ' + blank(d.tenantAddress));
    L.push('  연락처    ' + blank(d.tenantContact, '○○○-○○○○-○○○○'));
    L.push('  주민등록번호  ○○○○○○-○○○○○○○');
    L.push('');
    L.push('[채무자]  ' + blank(d.landlordName));
    L.push('  주소      ' + blank(d.landlordAddress));
    L.push('');
    L.push('청  구  금  액');
    L.push('  1. 원금(미반환 보증금)   금 ' + won(principal));
    L.push('  2. 지연손해금            금 ' + won(interestNow) + '  (' + dateKR(addDays(d.moveOutDate, 1)) + ' ~ ' + E.fmtDate(d.today || new Date()) + ')');
    L.push('  3. 합계                  금 ' + won(total));
    L.push('');
    L.push('청  구  취  지');
    L.push('  1. 채무자는 채권자에게 금 ' + won(principal) + ' 및 이에 대하여 ' + dateKR(addDays(d.moveOutDate, 1)) + '부터 이 사건 지급명령 정본 송달일까지는 연 5%의, 그 다음 날부터 다 갚는 날까지는 연 12%의 각 비율로 계산한 돈을 지급하라.');
    L.push('  2. 독촉절차 비용은 채무자가 부담한다.');
    L.push('');
    L.push('청  구  원  인');
    L.push('  1. 임대차계약');
    L.push('     채권자는 ' + dateKR(d.contractDate) + ' 채무자와 ' + blank(d.propertyAddress, '○○시 ○○구 ○○동 ○○○') + '에 관한 임대차계약을 체결하고, 보증금을 금 ' + won(r.deposit || d.deposit) + '으로 정하였습니다.');
    L.push('  2. 계약의 종료와 목적물 인도');
    L.push('     위 임대차는 ' + dateKR(d.endDate) + ' 기간만료로 종료되었고, 채권자는 ' + dateKR(d.moveOutDate) + ' 목적물을 채무자에게 인도하였습니다.');
    L.push('  3. 보증금 미반환');
    if (r.claimTotal > 0) {
      L.push('     채무자는 보증금 중 금 ' + won(r.claimTotal) + '을 원상복구비 등으로 공제한다며 반환을 거절하고 있으나, 그 공제는 아래와 같은 이유로 부당합니다.');
      itemLines(r, { detail: false }).forEach(function (x) { L.push(x); });
      L.push('     통상의 손모는 임차인의 원상복구 의무 범위에 속하지 않고(대법원 2017다268142), 보증금에서 공제할 손해배상채권의 발생은 임대인이 증명하여야 합니다(대법원 95다14664).');
    } else {
      L.push('     채무자는 아무런 공제 내역도 제시하지 아니한 채 보증금 ' + won(r.deposit || d.deposit) + '의 반환을 미루고 있습니다. 보증금 반환채무는 목적물 인도와 동시이행관계에 있고(대법원 77다1241 전원합의체), 채무자가 공제를 주장하려면 그 근거와 금액을 스스로 증명하여야 합니다(대법원 95다14664).');
    }
    L.push('  4. 지연손해금');
    L.push('     인도일 다음 날부터 지체책임이 발생하므로(대법원 77다1241 전원합의체), ' + dateKR(addDays(d.moveOutDate, 1)) + '부터 신청일까지 연 5%의 비율로 계산한 금 ' + won(interestNow) + '의 지연손해금이 발생하였습니다.');
    L.push('  5. 최고 및 신청의 경위');
    L.push('     채권자는 ' + dateKR(d.certDate) + ' 내용증명우편으로 반환을 최고하였으나, 채무자는 이에 응하지 아니하였습니다. 이에 채권자는 지급명령을 신청합니다.');
    L.push('');
    L.push('청 구 금 액 산 정 근 거');
    L.push('  - 보증금 ' + won(r.deposit || d.deposit) + ' − 부당 공제 ' + won(r.claimTotal) + ' + 정당 공제 ' + won(r.tenantBurden) + ' = ' + won(principal));
    L.push('  - 지연손해금: ' + won(principal) + ' × 연 5% × ' + r.delayDays + '일 ÷ 365 = ' + won(interestNow) + ' (원 미만 버림)');
    L.push('  - 청구금액 ' + won(total) + '은 ' + (r.isSmallClaim ? '3,000만 원 이하로 소액사건에 해당합니다.' : '3,000만 원을 초과하여 일반 민사사건에 해당합니다.'));
    L.push('');
    L.push('첨  부  서  류');
    L.push('  1. 임대차계약서 사본 1부');
    L.push('  2. 목적물 인도 사실을 증명하는 자료(문자·영상·열쇠 인도 확인) 1부');
    L.push('  3. 공제 통보 자료 및 이의제기 내용증명 사본 1부');
    L.push('  4. 채권자 신분증 사본 1부');
    L.push('');
    L.push('  ※ 인지액: ' + won(r.costs.paymentOrderFee) + ' (민사소송 등 인지법 제7조, 소장 인지의 10분의 1)');
    L.push('  ※ 송달료: ' + won(r.costs.paymentOrderService) + ' (1회 5,640원 × 6회 × 2인)');
    L.push('  ※ 채무자가 이의신청을 하면 소액심판 또는 본안소송으로 전환됩니다(이의 있는 부분에 한함).');
    L.push('');
    L.push('');
    L.push(E.fmtDate(d.today || new Date()));
    L.push('');
    L.push('채권자  ' + blank(d.tenantName) + '  (서명 또는 인)');
    L.push('');
    L.push(blank(d.courtName, '○○지방법원') + ' 귀중   (관할: 채무자 주소지 관할 법원)');
    return L.join('\n');
  }

  /* ── 4. 기숙사 퇴실 변상 이의신청서 ─────────────────── */
  function dormObjection(d, r) {
    var L = [];
    L.push('기숙사 퇴실 변상금 이의신청서');
    L.push('');
    L.push('접수일자: ' + E.fmtDate(d.today || new Date()) + '   접수번호: ○○-○○○');
    L.push('');
    L.push('신청인  ' + blank(d.tenantName) + '   (학번 ○○○○○○○)');
    L.push('  소속  ' + blank(d.dept, '○○대학 ○○학과') + '   연락처  ' + blank(d.tenantContact, '○○○-○○○○-○○○○'));
    L.push('  이메일  ' + blank(d.tenantEmail, '○○○○@○○○.○○○'));
    L.push('수신    ' + blank(d.landlordName, '○○대학교 학생지원팀(생활관 운영팀)'));
    L.push('');
    L.push('신  청  취  지');
    L.push('  ' + dateKR(d.moveOutDate) + ' 퇴실과 관련하여 부과된 변상금 ' + won(r.claimTotal) + ' 중 ' + won(r.defense) + '을 취소하고, 이미 공제된 금액은 반환하여 주시기 바랍니다.');
    L.push('');
    L.push('신  청  이  유');
    L.push('  1. 신청인은 ' + dateKR(d.contractDate) + '부터 ' + dateKR(d.endDate) + '까지 ' + blank(d.propertyAddress, '○○생활관 ○○동 ○○○호') + '를 사용하였고, ' + dateKR(d.moveOutDate) + ' 퇴실하였습니다.');
    L.push('  2. 운영팀은 아래 항목을 변상금으로 부과하였습니다.');
    var drows = (r.rows || []).filter(function (x) { return !x.reverse; });
    if (drows.length) {
      drows.forEach(function (x, i) {
        L.push('     ' + (i + 1) + ') ' + x.label + ' : ' + won(x.amount));
      });
    } else {
      L.push('     (금액과 항목을 서면으로 통지받지 못하였고, 구두로만 고지되었습니다.)');
    }
    L.push('  3. 그러나 아래와 같은 이유로 위 부과는 감액 또는 취소되어야 합니다.');
    L.push('     가. 시설·비품의 파손 사실과 그 금액은 부과하는 측이 증명하여야 합니다. 입사 당시 상태를 확인할 수 있는 자료 없이 퇴실 시점의 상태만으로 파손을 추정할 수는 없습니다.');
    L.push('     나. 내용연수를 넘긴 비품의 교체비는 신품가 전액이 아니라 감가상각을 반영한 잔존가액을 기준으로 산정하여야 합니다.');
    L.push('     다. 정상적인 사용으로 생긴 마모·변색은 사용료에 이미 반영된 비용으로, 별도의 변상 대상이 아닙니다.');
    L.push('     라. 청소비는 실제 청소가 이루어진 뒤 그 비용 범위에서 부과되어야 하며, 사전에 정액으로 공제하는 것은 근거가 될 수 없습니다.');
    L.push('     마. 숙사 운영규정에 변상 기준이 있다면 그 조항, 산정식, 감가상각 적용 여부를 서면으로 제시하여 주시기 바랍니다.');
    L.push('  4. 신청인은 퇴실 당시 촬영한 사진·영상과 입사 당시 상태 자료를 보유하고 있습니다.');
    L.push('');
    L.push('요  청  사  항');
    L.push('  1. 변상금 산정 근거(규정 조항, 수량, 단가, 감가상각 적용 내역)를 7일 이내에 서면으로 통지하여 주십시오.');
    L.push('  2. 위 근거가 제시되지 않는 항목은 부과를 취소하여 주십시오.');
    L.push('  3. 이미 공제된 금액은 신청인 명의 계좌로 반환하여 주십시오.');
    L.push('     - 반환 계좌: ' + blank(d.account, '○○은행 ○○○-○○○-○○○○○○ (예금주: ' + blank(d.tenantName, '○○○') + ')'));
    L.push('');
    L.push('  4. 7일 이내에 답변이 없거나 부당한 부과가 유지될 경우, 신청인은 대학 민원 창구 및 한국소비자원 분쟁조정 절차를 진행할 예정입니다.');
    L.push('');
    L.push('첨부: 퇴실 사진 및 영상 캡처 ○매, 입사 당시 상태 자료 ○매, 변상금 부과 내역 사본 1부');
    L.push('');
    L.push('');
    L.push(E.fmtDate(d.today || new Date()));
    L.push('');
    L.push('신청인  ' + blank(d.tenantName) + '  (서명)');
    L.push('');
    L.push(blank(d.landlordName, '○○대학교 생활관 운영팀') + ' 귀중');
    L.push('');
    L.push('※ 기숙사·사택은 임대차가 아닌 "사용허가" 성격이어서 주택임대차보호법의 대항력·우선변제권·임차권등기명령이 적용되지 않는 경우가 많습니다. 대신 민법상 손해배상 원칙과 숙사 운영규정, 소비자분쟁조정을 활용합니다.');
    return L.join('\n');
  }

  /* ── 5. 하자보수 요청 및 이행 촉구서 ─────────────────── */
  function defectRequest(d, r) {
    var L = [];
    L.push('하자보수 요청 및 이행 촉구서');
    L.push('');
    L.push('문서번호: ' + (d.docNo || 'DEF-' + new Date().getFullYear() + '-0000'));
    L.push('발신일자: ' + E.fmtDate(d.today || new Date()));
    L.push('');
    L.push('수신인  ' + blank(d.landlordName, '○○○ (임대인)'));
    L.push('  주소  ' + blank(d.landlordAddress, '○○시 ○○구 ○○동 ○○○'));
    L.push('발신인  ' + blank(d.tenantName, '○○○ (임차인)'));
    L.push('  주소  ' + blank(d.propertyAddress, '○○시 ○○구 ○○동 ○○○'));
    L.push('');
    L.push('제  목: 임차주택 하자의 보수 요청 및 기한 내 이행 촉구');
    L.push('');
    L.push('1. 임대차 및 하자 현황');
    L.push('  가. 발신인은 ' + dateKR(d.contractDate) + ' 위 주택을 임차하여 거주하던 중입니다(임대차기간 ' + dateKR(d.endDate) + '까지).');
    L.push('  나. 입주 후 아래와 같은 하자가 발생하였으며, 이는 임대인의 수선의무 대상으로 판단됩니다.');
    var defects = d.defects && d.defects.length ? d.defects : ['결로 및 곰팡이(외벽·창호 접합부)', '누수(욕실·베란다)', '창호 기밀 불량', '보일러·급탕 이상'];
    defects.forEach(function (x, i) { L.push('     ' + (i + 1) + ') ' + x); });
    L.push('  다. 위 하자는 주거의 사용·수익에 지장을 초래하는 것으로, 임대인은 목적물을 사용·수익에 필요한 상태로 유지할 의무가 있습니다(민법 제623조).');
    L.push('');
    L.push('2. 요청 사항');
    L.push('  가. 위 하자에 대한 보수 계획(보수 범위, 방법, 일정, 담당자 연락처)을 이 서면을 받은 날부터 7일 이내에 서면으로 통지하여 주십시오.');
    L.push('  나. 보수를 완료할 때까지 발생하는 임차인의 손해(가전·의류·가구 피해, 임시 거처 비용 등)는 임대인의 채무불이행에 따른 손해배상으로 청구할 수 있음을 알려드립니다(민법 제390조, 제393조).');
    L.push('  다. 위 주택이 신축 아파트로서 사업주체의 하자담보책임기간 내에 있다면, 임대인은 사업주체에게 하자보수를 청구하여 주십시오. 사업주체는 하자보수 청구를 받은 날부터 15일 이내에 보수하거나 보수계획을 통보하여야 합니다(공동주택관리법 제37조 제1항, 같은 법 시행령 제38조 제3항).');
    L.push('  라. 하자가 구조적 원인(단열·방습 성능 미비, 시공 하자)에서 비롯된 경우, 그 보수비용은 임차인이 부담하지 않습니다.');
    L.push('');
    L.push('3. 관리비·장기수선충당금');
    L.push('  가. 임차인이 관리비에 포함하여 납부한 장기수선충당금은 원칙적으로 소유자가 부담하는 비용이며, 임차인은 임대차 종료 시 그 반환을 청구할 수 있습니다(공동주택관리법 제30조, 같은 법 시행령 제31조 제8항).');
    L.push('  나. 관리사무소에서 발급한 납부확인서를 첨부하오니, 정산하여 주시기 바랍니다.');
    L.push('     - 납부 확인액: ' + won(r.reverseTotal));
    L.push('');
    L.push('4. 이행 기한');
    L.push('  위 기한까지 보수 계획을 통보하지 않거나 보수가 이루어지지 않으면, 발신인은 하자보수에 갈음하는 손해배상 청구, 임대차계약 해지, 대한민국 법원의 임대차 분쟁조정 신청 등 필요한 조치를 진행할 예정입니다.');
    L.push('');
    L.push('첨부: 하자 사진 ○매, 하자 발생 경과 및 통지 기록 1부, 장기수선충당금 납부확인서 1부');
    L.push('');
    L.push('');
    L.push(E.fmtDate(d.today || new Date()));
    L.push('');
    L.push('발신인  ' + blank(d.tenantName) + '  (서명 또는 인)');
    L.push('연락처  ' + blank(d.tenantContact, '○○○-○○○○-○○○○'));
    return L.join('\n');
  }

  /* ── 6. 진단 리포트 ─────────────────────────────────── */
  function report(input, r, steps) {
    var L = [];
    L.push('보증금·원상복구 진단 리포트');
    L.push('');
    L.push('작성일  ' + E.fmtDate(new Date()));
    L.push('주거 형태  ' + r.mode.label + ' (' + r.mode.law + ')');
    L.push('');
    L.push('■ 진단 요약');
    L.push('  방어 가능성      ' + r.score + '점 / 100 (' + r.level.label + ')');
    L.push('  판정             ' + r.verdict);
    L.push('');
    L.push('■ 금액');
    L.push('  보증금           ' + won(r.deposit));
    L.push('  공제 통보액      ' + won(r.claimTotal));
    L.push('  정당 공제 추정   ' + won(r.tenantBurden));
    L.push('  방어 가능 금액   ' + won(r.defense));
    if (r.reverseTotal > 0) L.push('  별도 반환 청구   ' + won(r.reverseTotal) + ' (장기수선충당금 등)');
    L.push('  돌려받아야 할 돈 ' + won(r.recoverable));
    L.push('  지연이자         ' + won(r.interest) + ' (연 5%, ' + r.delayDays + '일)');
    L.push('');
    L.push('■ 항목별 판정');
    (r.rows || []).forEach(function (x) {
      L.push('  - ' + x.label + ' ' + won(x.amount) + ' → 임차인 부담 ' + won(x.tenant) + ' / 다툼 ' + won(x.defend) + (x.reverse ? ' (반환 청구)' : ''));
      L.push('    ' + x.basis);
      if (x.cite) L.push('    근거: ' + x.cite);
    });
    L.push('');
    L.push('■ 점수 구성');
    r.reasons.forEach(function (x) { L.push('  - ' + x.label + ': ' + x.value + '/' + x.max + ' (' + x.note + ')'); });
    L.push('');
    L.push('■ 예상 비용');
    L.push('  내용증명 (3통·등기)        ' + won(r.costs.contentCert));
    L.push('  임차권등기명령 (전자)      ' + won(r.costs.injunction));
    L.push('  지급명령 인지              ' + won(r.costs.paymentOrderFee));
    L.push('  지급명령 송달료 (6회)      ' + won(r.costs.paymentOrderService));
    L.push('  ' + (r.isSmallClaim ? '소액심판 인지 (전자)' : '본안 인지 (전자)') + '        ' + won(r.isSmallClaim ? r.costs.smallClaimFee : r.costs.civilFee));
    L.push('  ' + (r.isSmallClaim ? '소액심판 송달료 (10회)' : '본안 송달료 (15회)') + '      ' + won(r.isSmallClaim ? r.costs.smallClaimService : r.costs.civilService));
    L.push('  합계 (내용증명+지급명령+' + (r.isSmallClaim ? '소액심판' : '본안') + ')  ' + won(r.costTotal));
    L.push('');
    L.push('■ 단계별 일정');
    steps.forEach(function (s) {
      L.push('  ' + s.d + '  ' + E.fmtDate(s.date) + '  ' + s.title);
      L.push('        ' + s.body);
    });
    L.push('');
    L.push('■ 보강 안내');
    r.tips.forEach(function (t, i) { L.push('  ' + (i + 1) + '. ' + t); });
    L.push('');
    L.push('※ 본 리포트는 법률 자문이 아닌 문서 작성 보조 도구의 참고 계산입니다.');
    L.push('※ 항목별 인정 비율은 공개 판례의 경향을 반영한 추정치이며, 실제 결과는 증거와 법원의 판단에 따라 달라집니다.');
    L.push('※ 근거: 민법 제618조·제623조·제626조·제634조·제654조, 주택임대차보호법 제3조의2·제3조의3·제6조·제6조의2, 공동주택관리법 제30조·제37조, 민사소송 등 인지법 제2조·제7조·제16조, 대법원 송달료 기준(2026.7.1).');
    return L.join('\n');
  }

  function maskName(name) {
    if (!name) return '○○○';
    var n = String(name).trim();
    if (n.length <= 1) return n;
    if (n.length === 2) return n[0] + '○';
    return n[0] + new Array(n.length).join('○');
  }

  function maskAddress(addr) {
    if (!addr) return '○○시 ○○구 ○○동';
    var parts = String(addr).trim().split(/\s+/);
    return parts.slice(0, 2).join(' ') + ' ○○○';
  }

  global.DepositDocs = {
    contentCert: contentCert,
    injunction: injunction,
    paymentOrder: paymentOrder,
    dormObjection: dormObjection,
    defectRequest: defectRequest,
    report: report,
    maskName: maskName,
    maskAddress: maskAddress
  };
})(typeof window !== 'undefined' ? window : globalThis);
