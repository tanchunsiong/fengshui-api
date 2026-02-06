#!/usr/bin/env node
/**
 * Fengshui API — Chinese Almanac REST API
 * 
 * Provides authentic 通胜/黄历 data in JSON format.
 * Built with lunar-typescript for accurate calculations.
 * 
 * Endpoints:
 *   GET  /v1/almanac           - Today's almanac
 *   GET  /v1/almanac/:date     - Almanac for specific date
 *   GET  /v1/find              - Find auspicious dates
 *   GET  /v1/zodiac/:year      - Zodiac for year
 *   GET  /v1/lunar/:date       - Lunar calendar conversion
 *   GET  /api/health           - Health check
 * 
 * @author Tan Chun Siong
 * @license MIT
 */

const http = require('http');
const { Solar, Lunar, HolidayUtil } = require('lunar-typescript');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || null;

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

const cors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
};

const json = (res, data, status = 200) => {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data, null, 2));
};

const error = (res, msg, status = 400) => {
  json(res, { error: msg, status }, status);
};

const checkAuth = (req) => {
  if (!API_KEY) return true;
  const key = req.headers['x-api-key'] || req.headers.authorization?.replace('Bearer ', '');
  return key === API_KEY;
};

const parseDate = (dateStr) => {
  if (!dateStr) {
    const now = new Date();
    return Solar.fromDate(now);
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) throw new Error('Invalid date format. Use YYYY-MM-DD');
  return Solar.fromYmd(y, m, d);
};

// ═══════════════════════════════════════════════════════════════════
// Data Extraction
// ═══════════════════════════════════════════════════════════════════

function getAlmanacData(solar) {
  const lunar = solar.getLunar();
  const bazi = lunar.getEightChar();
  const jieQi = lunar.getJieQi();
  
  // Yi (auspicious activities) and Ji (inauspicious activities)
  const dayYi = lunar.getDayYi() || [];
  const dayJi = lunar.getDayJi() || [];
  
  // Get clash info
  const chongDesc = lunar.getDayChongDesc();
  const sha = lunar.getDaySha();
  
  // Lucky positions
  const xiShen = lunar.getDayPositionXiDesc();
  const caiShen = lunar.getDayPositionCaiDesc();
  const fuShen = lunar.getDayPositionFuDesc();
  
  // Festivals
  const festivals = [];
  const lunarFests = lunar.getFestivals();
  const solarFests = solar.getFestivals();
  if (lunarFests) festivals.push(...lunarFests);
  if (solarFests) festivals.push(...solarFests);
  
  return {
    date: {
      solar: `${solar.getYear()}-${String(solar.getMonth()).padStart(2,'0')}-${String(solar.getDay()).padStart(2,'0')}`,
      lunar: lunar.toString(),
      lunarMonth: lunar.getMonthInChinese(),
      lunarDay: lunar.getDayInChinese(),
      weekday: solar.getWeekInChinese(),
      zodiacYear: lunar.getYearShengXiao(),
      zodiacDay: lunar.getDayShengXiao()
    },
    ganzhi: {
      year: lunar.getYearInGanZhi(),
      month: lunar.getMonthInGanZhi(),
      day: lunar.getDayInGanZhi(),
      yearGan: bazi.getYearGan(),
      yearZhi: bazi.getYearZhi(),
      monthGan: bazi.getMonthGan(),
      monthZhi: bazi.getMonthZhi(),
      dayGan: bazi.getDayGan(),
      dayZhi: bazi.getDayZhi()
    },
    fortune: {
      auspicious: dayYi,
      inauspicious: dayJi,
      clash: chongDesc,
      sha: sha,
      positions: {
        xi: xiShen,      // 喜神
        cai: caiShen,    // 财神
        fu: fuShen       // 福神
      }
    },
    solarTerm: jieQi || null,
    festivals: festivals.length > 0 ? festivals : null,
    _meta: {
      generated: new Date().toISOString(),
      version: '1.0.0'
    }
  };
}

function getZodiacData(year) {
  const lunar = Lunar.fromYmd(year, 1, 1);
  const animal = lunar.getYearShengXiao();
  const ganzhi = lunar.getYearInGanZhi();
  const gan = ganzhi.charAt(0);
  
  // Element mapping
  const elements = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
  };
  
  return {
    year,
    animal,
    ganzhi,
    element: elements[gan] || null,
    elementName: {
      '木': 'Wood',
      '火': 'Fire',
      '土': 'Earth',
      '金': 'Metal',
      '水': 'Water'
    }[elements[gan]] || null
  };
}

function findAuspiciousDates(activity, days = 30, startDate = null) {
  const results = [];
  let solar = startDate ? parseDate(startDate) : Solar.fromDate(new Date());
  
  for (let i = 0; i < days; i++) {
    const lunar = solar.getLunar();
    const dayYi = lunar.getDayYi() || [];
    const dayJi = lunar.getDayJi() || [];
    
    const isAuspicious = dayYi.some(a => a.includes(activity));
    const isInauspicious = dayJi.some(a => a.includes(activity));
    
    if (isAuspicious && !isInauspicious) {
      results.push({
        date: `${solar.getYear()}-${String(solar.getMonth()).padStart(2,'0')}-${String(solar.getDay()).padStart(2,'0')}`,
        lunar: lunar.toString(),
        weekday: solar.getWeekInChinese(),
        auspicious: dayYi,
        clash: lunar.getDayChongDesc()
      });
    }
    
    solar = solar.next(1);
  }
  
  return results;
}

// ═══════════════════════════════════════════════════════════════════
// Router
// ═══════════════════════════════════════════════════════════════════

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    cors(res);
    res.writeHead(204);
    return res.end();
  }

  // Rate limiting check (basic, for future implementation)
  // TODO: Implement proper rate limiting with Redis

  // Auth check
  if (!checkAuth(req) && !pathname.includes('/api/health')) {
    return error(res, 'Invalid or missing API key', 401);
  }

  try {
    // Health check
    if (pathname === '/api/health' || pathname === '/health') {
      return json(res, { 
        status: 'healthy',
        service: 'fengshui-api',
        version: '1.0.0',
        uptime: process.uptime()
      });
    }

    // v1/almanac - today
    if ((pathname === '/v1/almanac' || pathname === '/api/almanac') && method === 'GET') {
      const data = getAlmanacData(parseDate(null));
      return json(res, data);
    }

    // v1/almanac/:date
    const almanacMatch = pathname.match(/^\/(v1|api)\/almanac\/(\d{4}-\d{2}-\d{2})$/);
    if (almanacMatch && method === 'GET') {
      const data = getAlmanacData(parseDate(almanacMatch[2]));
      return json(res, data);
    }

    // v1/find - find auspicious dates
    if ((pathname === '/v1/find' || pathname === '/api/find') && method === 'GET') {
      const activity = url.searchParams.get('activity') || url.searchParams.get('q');
      const days = parseInt(url.searchParams.get('days') || '30');
      const start = url.searchParams.get('start');
      
      if (!activity) {
        return error(res, 'Missing required parameter: activity (or q)');
      }
      
      const results = findAuspiciousDates(activity, Math.min(days, 365), start);
      return json(res, {
        query: activity,
        days,
        found: results.length,
        results
      });
    }

    // v1/zodiac/:year
    const zodiacMatch = pathname.match(/^\/(v1|api)\/zodiac\/(\d{4})$/);
    if (zodiacMatch && method === 'GET') {
      const data = getZodiacData(parseInt(zodiacMatch[2]));
      return json(res, data);
    }

    // v1/lunar/:date - solar to lunar conversion
    const lunarMatch = pathname.match(/^\/(v1|api)\/lunar\/(\d{4}-\d{2}-\d{2})$/);
    if (lunarMatch && method === 'GET') {
      const solar = parseDate(lunarMatch[2]);
      const lunar = solar.getLunar();
      return json(res, {
        solar: `${solar.getYear()}-${String(solar.getMonth()).padStart(2,'0')}-${String(solar.getDay()).padStart(2,'0')}`,
        lunar: lunar.toString(),
        lunarYear: lunar.getYearInChinese(),
        lunarMonth: lunar.getMonthInChinese(),
        lunarDay: lunar.getDayInChinese(),
        isLeapMonth: lunar.getMonth() < 0,
        zodiac: lunar.getYearShengXiao(),
        festivals: lunar.getFestivals()
      });
    }

    // Landing page redirect
    if (pathname === '/' || pathname === '') {
      res.writeHead(302, { 'Location': 'https://tanchunsiong.github.io/fengshui-api/' });
      return res.end();
    }

    // 404
    return error(res, `Endpoint not found: ${pathname}`, 404);

  } catch (e) {
    console.error('Request error:', e);
    return error(res, e.message, 500);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Server
// ═══════════════════════════════════════════════════════════════════

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  🧧 Fengshui API v1.0.0                                           ║
╠═══════════════════════════════════════════════════════════════════╣
║  Running on: http://localhost:${PORT}                               ║
║                                                                   ║
║  Endpoints:                                                       ║
║    GET /v1/almanac              Today's almanac                   ║
║    GET /v1/almanac/:date        Almanac for date                  ║
║    GET /v1/find?q=嫁娶          Find auspicious dates             ║
║    GET /v1/zodiac/:year         Zodiac for year                   ║
║    GET /v1/lunar/:date          Solar→Lunar conversion            ║
║    GET /api/health              Health check                      ║
║                                                                   ║
║  Auth: ${API_KEY ? 'API Key required (X-API-Key header)' : 'Open access (no key configured)'}         ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
});

process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => process.exit(0));
});
