const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Accept self-signed certs common in staging environments
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

app.post('/api/fetch-schemas', async (req, res) => {
  const { url, username, password } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: 'URL is required' });
  }

  const config = {
    url,
    method: 'GET',
    headers: {
      'User-Agent': 'SchemaValidator/1.0 skipAuth',
      'Accept': 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
    timeout: 20000,
    httpsAgent,
    maxRedirects: 5,
  };

  if (username && password) {
    config.auth = { username, password };
  }

  try {
    const response = await axios(config);
    const contentType = (response.headers['content-type'] || '').toLowerCase();
    const schemas = [];

    if (contentType.includes('json')) {
      schemas.push({
        id: 0,
        type: 'json',
        label: 'JSON Response',
        schemaType: null,
        data: response.data,
      });
    } else {
      const $ = cheerio.load(response.data);
      let index = 0;

      const addSchema = (item) => {
        const schemaType = item['@type'];
        const typeLabel = Array.isArray(schemaType)
          ? schemaType.join(', ')
          : (schemaType || `Schema ${index + 1}`);
        schemas.push({
          id: index++,
          type: 'json-ld',
          label: `JSON-LD: ${typeLabel}`,
          schemaType: schemaType || null,
          data: item,
        });
      };

      $('script[type="application/ld+json"]').each((_i, el) => {
        try {
          const json = JSON.parse($(el).html());
          if (json['@graph'] && Array.isArray(json['@graph'])) {
            json['@graph'].forEach(addSchema);
          } else if (Array.isArray(json)) {
            json.forEach(addSchema);
          } else {
            addSchema(json);
          }
        } catch {
          // skip malformed JSON-LD blocks
        }
      });
    }

    res.json({
      success: true,
      schemas,
      statusCode: response.status,
      resolvedUrl: response.request?.res?.responseUrl || url,
    });
  } catch (error) {
    let errorMessage = error.message;
    if (error.response) {
      errorMessage = `HTTP ${error.response.status}: ${error.response.statusText}`;
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Domain not found or unreachable';
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      errorMessage = 'Request timed out (20s limit)';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused';
    }
    res.status(400).json({ success: false, error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`\nSchema Validator running at http://localhost:${PORT}\n`);
});
