// UDN 追蹤碼（GTM / comScore / Alexa certify / etu recommender），集中於此檔，
// 由 app.vue 以 `useHead(useTracking())` 一次注入 <head>。
//
// 作法比照姊妹專案 livable-city 的 `app/assets/js/tracking.js`：
// 各追蹤器各自是一段 inline script（unhead 的 `innerHTML`），
// 不用 GTM 容器包裝，避免多一層外部依賴。
//
// GA_ID 沿用 livable-city 的量測 ID（同一組數位新聞中心專題共用，非誤植）。
// 若日後本專題要拆出獨立的 GA4 / GTM 容器，改這一個常數即可。
const GA_ID = 'G-CQV5HGZQ93';

// comScore / Alexa 為 udn 站台層級帳號，各專案共用。
const COMSCORE_C2 = '7390954';
const ATRK_ACCOUNT = 'aw0Di1a4ZP00aY';

// GTM loader：把 gtm.js 塞進 <head>，並開場推一筆 gtm.start 供容器計時。
const gtmSrc = {
  innerHTML: `
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','${GA_ID}');
  `,
};

// gtag 初始化：宣告 dataLayer / gtag()，送出第一次 config（即 page_view）。
const gtmConfig = {
  innerHTML: `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${GA_ID}');
  `,
};

const comScore = {
  innerHTML: `
    var _comscore = _comscore || [];
    _comscore.push({ c1: "2", c2: "${COMSCORE_C2}" });
    (function() {
    var s = document.createElement("script"), el = document.getElementsByTagName("script")[0]; s.async = true;
    s.src = (document.location.protocol == "https:" ? "https://sb" : "http://b") + ".scorecardresearch.com/beacon.js";
    el.parentNode.insertBefore(s, el);
    })();
  `,
};

const alexaCertify = {
  type: 'text/javascript',
  innerHTML: `
    _atrk_opts = { atrk_acct:"${ATRK_ACCOUNT}", domain:"udn.com",dynamic: true};
    (function() { var as = document.createElement('script'); as.type = 'text/javascript'; as.async = true; as.src = "https://d31qbv1cthcecs.cloudfront.net/atrk.js"; var s = document.getElementsByTagName('script')[0];s.parentNode.insertBefore(as, s); })();
  `,
};

// etu 推薦引擎：pid 取 URL 倒數第三、第二段組成（udn 慣例），title 直接讀當下 <title>。
// unhead 的標籤排序會把 title 排在 script 之前，故此處讀得到已渲染的標題。
const etu = {
  id: 'etu-recommender',
  type: 'text/javascript',
  innerHTML: `
    var temp = window.location.href.split('/')
    var pid = ''
    if(temp.length > 3){
        pid = temp[temp.length-3] + '_' + temp[temp.length-2]
    }
    var erUrlPrefix='https://rec.udn.com/';
    var _qevents = _qevents || [];
    _qevents.push({
      group:'udn',
      cid : 'udn_soft',
      act : 'view',
      cat : ['newmedia','newmedia','','',''],
      uid : '',
      bid : '',
      pid : pid,
      page:'ARTICLE',
      Rank_cat:'10',
      Rank_pid:'10',
      title: document.querySelector('title').innerHTML,
      tag:[],
      referral: document.referrer
    });
    (function() {
      var er = document.createElement('script');
      er.type = 'text/javascript';
      er.async = true;
      er.src = erUrlPrefix + 'er.js?' + (new Date().getTime());
      var currentJs = document.getElementById('etu-recommender');
      currentJs.parentNode.insertBefore(er, currentJs);
    })();
  `,
};

// 關閉 JS 時的 1x1 追蹤圖；一律走 https，避免在 https 頁面被當成 mixed content 攔掉。
const scorecardresearch = {
  innerHTML: `
    <img src="https://sb.scorecardresearch.com/p?c1=2&c2=${COMSCORE_C2}&cv=2.0&cj=1" />
  `,
};

const cloudfront = {
  innerHTML: `
    <img src="https://d5nxst8fruw4z.cloudfront.net/atrk.gif?account=${ATRK_ACCOUNT}" style="display:none" height="1" width="1" />
  `,
};

/**
 * 回傳可直接交給 `useHead()` 的 head 片段（script / noscript）。
 * 命名沿用姊妹專案的 `useTracking`，實際上是純函式、無反應式狀態。
 */
function useTracking() {
  return {
    script: [gtmSrc, gtmConfig, comScore, alexaCertify, etu],
    noscript: [scorecardresearch, cloudfront],
  };
}

export {
  gtmSrc,
  gtmConfig,
  comScore,
  scorecardresearch,
  alexaCertify,
  cloudfront,
  etu,
  useTracking,
};