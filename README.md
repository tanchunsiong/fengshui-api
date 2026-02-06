# 🧧 Fengshui API

> Chinese Almanac (通胜/黄历) data via REST API

**Live Demo:** https://tanchunsiong.github.io/fengshui-api/

## What is this?

A simple API that provides authentic Chinese almanac data in JSON format. Perfect for:

- Fortune-telling apps
- Wedding/event planning tools
- Calendar applications
- Cultural/educational projects
- Any app that needs Chinese zodiac or lunar calendar data

## Features

- 📅 **Daily Almanac** — Auspicious (宜) and inauspicious (忌) activities
- 🐲 **Chinese Zodiac** — Animal signs, elements, compatibility
- 🌙 **Lunar Calendar** — Solar-to-lunar conversion, festivals
- 💍 **Date Finder** — Find the best dates for important events
- 🔮 **Ba Zi (八字)** — Four Pillars of Destiny calculations
- ⚡ **Fast** — Sub-100ms responses

## Quick Start

```bash
# Get today's almanac
curl https://fengshui-api-5rgh.onrender.com/v1/almanac

# Get almanac for a specific date
curl https://fengshui-api-5rgh.onrender.com/v1/almanac/2026-02-14

# Find auspicious wedding dates
curl "https://fengshui-api-5rgh.onrender.com/v1/find?activity=嫁娶&days=30"
```

## Response Example

```json
{
  "date": "2026-02-07",
  "lunar": {
    "year": "乙巳",
    "month": "正月",
    "day": "初十",
    "festival": null
  },
  "zodiac": {
    "animal": "蛇",
    "element": "木"
  },
  "auspicious": ["嫁娶", "开业", "入宅", "动土"],
  "inauspicious": ["安葬", "破土", "开仓"],
  "clash": {
    "animal": "猪",
    "direction": "东"
  },
  "luckyDirection": "东南",
  "luckyColors": ["红", "黄"],
  "hourlyFortune": [...]
}
```

## Self-Hosting

This API is built on [fengshui-cli](https://github.com/tanchunsiong/fengshui-cli). You can run your own instance:

```bash
# Clone and install
git clone https://github.com/tanchunsiong/fengshui-cli
cd fengshui-cli
npm install

# Run the server
npm start
```

## Pricing

| Plan | Price | Requests/Day | Features |
|------|-------|--------------|----------|
| Free | $0/mo | 100 | Basic almanac |
| Pro | $9/mo | 10,000 | Full access, Ba Zi |
| Enterprise | Custom | Unlimited | SLA, support |

## Tech Stack

- Built with Node.js
- Uses [lunar-typescript](https://github.com/6tail/lunar-typescript) for calculations
- Deployed on Render

## Contributing

PRs welcome! See [fengshui-cli](https://github.com/tanchunsiong/fengshui-cli) for the core library.

## License

MIT

---

Built with 🧧 by [Tan Chun Siong](https://github.com/tanchunsiong)
