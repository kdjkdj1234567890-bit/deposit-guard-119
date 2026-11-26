/* 🏠 보증금·원상복구 119 — 결제 연결 설정
 *
 * 크몽·스마트스토어에 상품을 등록하면 아래 두 칸에 상품 URL만 붙여넣으세요.
 * 사이트의 모든 결제 버튼이 즉시 그 링크로 연결됩니다.
 * 비어 있으면 진단 요약이 자동으로 채워진 "주문 문의" 경로가 열립니다.
 *
 * 예)
 *   kmong:      'https://kmong.com/gig/000000'
 *   smartstore: 'https://smartstore.naver.com/스토어명/products/0000000000'
 */
var __PAY_ROOT = (typeof window !== 'undefined' ? window : globalThis);
__PAY_ROOT.DEPOSIT_PAY = {
  kmong: {
    content: '',   // 크몽 · 원상복구 이의제기 29,000원
    full: '',      // 크몽 · 보증금 회수 풀패키지 49,000원
    dorm: ''       // 크몽 · 기숙사 퇴실 19,000원
  },
  smartstore: {
    content: '',
    full: '',
    dorm: ''
  },
  email: 'ralehdwlsdj1234567890@gmail.com'
};

(function (global) {
  'use strict';

  var PLANS = {
    content: {
      key: 'content',
      name: '원상복구 이의제기 패키지',
      price: 29000,
      summary: '내용증명 초안 + 공제 항목 대조표 + 발송 안내',
      for: '벽지·장판·청소비 공제를 다투는 경우'
    },
    full: {
      key: 'full',
      name: '보증금 회수 풀패키지',
      price: 49000,
      summary: '내용증명 + 임차권등기명령 신청서 + 지급명령 신청서 + 비용 계산서',
      for: '돈을 안 주거나 연락이 끊긴 경우'
    },
    dorm: {
      key: 'dorm',
      name: '기숙사·단기 퇴실 패키지',
      price: 19000,
      summary: '변상금 이의신청서 + 감가상각 계산 + 학교·소비자원 절차 안내',
      for: '기숙사·쉐어하우스 퇴실 변상'
    }
  };

  var CHANNELS = {
    kmong: { name: '크몽', tone: 'primary' },
    smartstore: { name: '스마트스토어', tone: 'outline' }
  };

  function url(channel, plan) {
    var conf = global.DEPOSIT_PAY || {};
    var bag = conf[channel];
    if (!bag) return '';
    return (bag[plan] || '').trim();
  }

  function has(channel, plan) { return !!url(channel, plan); }
  function plan(key) { return PLANS[key] || PLANS.content; }

  function orderMailto(planKey, ctx) {
    var p = plan(planKey);
    var conf = global.DEPOSIT_PAY || {};
    var L = [];
    L.push('안녕하세요, ' + p.name + ' 주문합니다.');
    L.push('');
    L.push('■ 주문 상품: ' + p.name + ' (' + p.price.toLocaleString('ko-KR') + '원)');
    L.push('');
    L.push('■ 사건 정보');
    if (ctx) {
      L.push('- 주거 형태: ' + (ctx.mode || '-'));
      L.push('- 보증금: ' + (ctx.deposit != null ? ctx.deposit.toLocaleString('ko-KR') + '원' : '-'));
      L.push('- 공제 통보액: ' + (ctx.claim != null ? ctx.claim.toLocaleString('ko-KR') + '원' : '-'));
      L.push('- 방어 가능 금액: ' + (ctx.defense != null ? ctx.defense.toLocaleString('ko-KR') + '원' : '-'));
      L.push('- 계약 종료일: ' + (ctx.endDate || '-'));
      L.push('- 퇴거일: ' + (ctx.moveOutDate || '-'));
      L.push('- 진단 점수: ' + (ctx.score != null ? ctx.score + '점' : '-'));
      L.push('- 공제 항목: ' + (ctx.items || '-'));
    } else {
      L.push('- 주거 형태(원룸/기숙사/아파트/신축):');
      L.push('- 보증금:');
      L.push('- 공제 통보액:');
      L.push('- 계약 종료일 / 퇴거일:');
      L.push('- 공제 항목:');
    }
    L.push('');
    L.push('■ 연락처');
    L.push('- 이름:');
    L.push('- 연락처:');
    L.push('- 이메일:');
    L.push('');
    L.push('■ 상대방 정보 (문서 작성용)');
    L.push('- 임대인/기관명:');
    L.push('- 주소:');
    L.push('');
    L.push('※ 결제는 크몽 또는 스마트스토어에서 진행합니다. 이 메일은 초안 작성용 정보입니다.');
    var subject = '[주문] ' + p.name + ' — 보증금·원상복구 119';
    return 'mailto:' + (conf.email || '') +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(L.join('\n'));
  }

  global.DepositPay = {
    PLANS: PLANS,
    CHANNELS: CHANNELS,
    url: url,
    has: has,
    plan: plan,
    orderMailto: orderMailto
  };
})(typeof window !== 'undefined' ? window : globalThis);
