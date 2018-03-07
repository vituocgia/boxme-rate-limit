# boxme-rate-limit

  A simple rate-limiting express middleware according to IP address

## About

  It uses built-in memory cache by default, and you can use your own redis cache. No matter if you're behind a reverse proxy (Nginx, Apache...), you can get the same rate-limiting result.
  

## Install

```sh
$ npm i --save boxme-rate-limit
```

## Example

```js
const express = require('express')
const RateLimit = require('boxme-rate-limit')
const redis = require('redis')

const app = express()
const cache = redis.createClient()

const limiter = new RateLimit({
  max: 10, // ten times per duration
  duration: 10 * 1000, // 10 seconds
  cache: cache // redis instance
})
app.use(limiter)
```

## Configuration

  **max**: [optional] max times per duration. The default is 10.

  **duration**: [optional] how long to keep the records of requests. The default is 1000 milliseconds.

  **cache**: [optional] redis client instance. The default is memory cache.
